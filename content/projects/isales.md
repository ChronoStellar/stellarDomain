---
title: "Chasing Controllable Emotion in On-Device TTS"
slug: isales
date: 2026-07-10
summary: "Four attempts at giving a small on-device TTS model an emotion knob — decoder conditioning, cross-encoder style transfer, retrieval over a voice library, and teacher distillation. Every route to model-native emotion failed, and the thing that shipped reads emotion instead of producing it."
tags: ["TTS", "SwiftUI", "on-device", "LLM", "Speech"]
coverImage: /projects/isales/isales_hero.png
---

## The problem

Text-to-speech got good at sounding human and stayed bad at sounding like it means anything. The models that ship on a phone — 80M parameters, sub-second latency, no network — are trained to produce one flat, pleasant reading voice. If you want that voice to sound happy or angry or defeated, the usual answer is to go get a bigger model with a cloud API behind it, which defeats the point of running on-device in the first place.

I wanted an emotion knob — a switchable style mode where a caller passes `emotion=happy` at inference and gets audibly different speech out of the same small model. The application driving it was a sales-practice iOS app where an AI customer talks back to you, and a customer who says "I'm not convinced" in the same cheerful monotone as "I'll take three" isn't much of a customer.

The question underneath that: is emotion in these architectures something you can bolt on after the fact? The published work always adds emotion during training, with the full dataset and the full compute budget. What happens when you try to add it to frozen released weights is less documented.

Concretely: four independent experiments across five repositories, each attacking emotion control at a different layer of the stack, plus one shipped iOS application that solved the problem from the opposite direction. Three of the four produced negative results. The fourth is unfinished. They failed for closely related reasons.

## Key learnings and technical outcomes

- **Built a stand-in encoder that inverts a frozen vocoder.** Soprano's audio→token encoder was never released, so I trained a `SopranoEncoder` to satisfy `decoder(encoder(audio)) ≈ audio` against the frozen released decoder, using a multi-resolution STFT loss at three resolutions (512/128, 1024/256, 2048/512) in both linear and log domain. This produced 512-dim hidden states aligned to real recordings without the missing tokenizer.
- **Ran a full adversarial disentanglement experiment and got a causal negative result.** Reconstruction loss rose from 1.13 to 1.29 in lockstep with the confusion weight ramp (0.04 → 0.30), then flatlined the moment the weight stopped rising — the model paying a measurable price to comply with an objective it can't satisfy.
- **Chose a bounded confusion loss over gradient reversal, and documented why.** GRL asks the encoder to maximize the classifier's cross-entropy, which is unbounded — the encoder diverges by inflating activation magnitude. The confusion loss is bounded below by `ln(K)`, so it cannot run away. I also LayerNorm the classifier input so scaling can't win, and clip generator gradients at 5.0.
- **Measured a voice-embedding space that turned out to be near-degenerate for retrieval.** Across 54 Kokoro built-in voices, the mean pairwise cosine similarity of Kanade global embeddings is **0.9704, with a floor of 0.9023**. A retrieval hit at 0.9869 means little when the worst possible match in the library scores 0.90.
- **Quantified cross-space style transfer failure with signal measurements.** Steering a Kokoro voice pack with a StyleTTS2 delta drops output RMS from 0.084 to 0.009 (a 9.4× collapse) as alpha goes 0 → 1.5, while peak amplitude simultaneously hits full-scale clipping at 1.0. The output isn't emotional, it's broken in two directions at once.
- **Shipped an on-device pipeline that reads emotion instead of generating it** — VAD → STT → SER → LLM → TTS running fully local on Apple Silicon, with a server-owned game state and a deterministic scoring function that a language model never touches.

## Key considerations and trade-offs

- **Frozen released weights, not a from-scratch model.** Every experiment had to work against checkpoints someone else trained, with whatever components they chose to publish. This constraint generated all four failures, and it was deliberate — a from-scratch emotional TTS is mostly a compute problem.
- **Three emotions, not a taxonomy.** `default / happy / sad`, ids fixed at 0/1/2. The Expresso subset I used (speakers ex01–ex03) has no `angry` samples, so despite `angry` appearing in the target style list it never made it into the ID map. A three-way switch was enough to answer the question.
- **Blind listening as the primary gate, objective metrics as support.** The plan called for a speech-emotion classifier and Whisper WER on generated audio, but the go/no-go was always "can a person identify the intended emotion." For a style knob, a metric that says yes when listeners say no is the wrong metric.
- **Everything local, no cloud APIs.** The iOS app's constraint (fully on-device inference) propagated backward into the research: no route that required a hosted model was allowed, even for evaluation.
- **Emotion never feeds the score.** In the shipped app, the SER label affects the customer's *behaviour* — an angry-toned turn resolves no objections and burns 8 extra patience — but it is deliberately excluded from `scoring.py` and the judge's honesty verdict. SER accuracy on accented speech is unvalidated, and I was not willing to let an uncalibrated classifier decide someone's grade.
- **Small, balanced data over more data.** 4,438 segments, near-perfectly balanced (1,405 default / 1,466 happy / 1,567 sad; 1,527 / 1,472 / 1,439 across the three speakers). Ruling out data quantity as a cause of failure first mattered, because the architecture turned out to be the answer.

## Why the emotion vector went to the decoder first, and why that was wrong

The decision that shaped the whole project was where to inject the emotion signal. Soprano is an LLM that emits discrete audio tokens, followed by a Vocos-style decoder that turns those tokens into a waveform. Emotion could go in at either end.

I chose the decoder, because the decoder was released and the encoder was not. Injecting at the LLM input requires training on token-level targets — cross-entropy over 8,000 audio codes — which means turning Expresso audio into Soprano's exact token ids, which requires the tokenizer that doesn't exist publicly. The decoder route needed no such thing. I could add `emotion_table = nn.Embedding(3, 768)`, project it through a linear layer, broadcast-add it to the Vocos backbone features, and train against real audio using only released weights. It was the route that could start immediately.

But "can start immediately" and "can succeed" are different properties, and the second one was knowable in advance. Two things were wrong with it.

The first is a capacity ceiling I wrote down up front — the training guide says it plainly: `emotion_table` adds a *time-invariant* per-emotion bias. Real emotion is time-varying and information-rich. Three constant 768-dim vectors, added uniformly across every frame of every utterance, can shift timbre and global energy. They cannot produce a rising pitch contour, a hesitation, or a hard consonant on an angry word. The best case for this route was always "sounds slightly different," never "sounds sad."

The second is the one I missed, and it's the load-bearing one. `emotion_table` is trained on *stand-in encoder* features — `h = encoder(audio)`. At inference the encoder is gone and the decoder is fed the *LLM's* hidden states. These are different distributions. Step 1 makes `encoder ≈ decoder⁻¹`; it never makes `encoder ≈ LLM`. There is no learned bridge between the two feature spaces, so even the timbral shift the first limitation permits is aimed at the wrong coordinate system. The emotion vector is calibrated against a distribution it will never see again.

This reframed the earlier confusing result. The vectors *did* differentiate — the trained `emotion_table` rows sit 37.951, 38.118, and 38.182 apart from each other — but the audio was overpowering and uncorrelated with the intended emotion. I had read that as a training problem; it was a coordinate problem. The distances being nearly identical across all three pairs is the tell: learned emotion structure would put `happy` and `sad` further from each other than either is from `default`, and instead all three are equidistant to within 0.6%, which is what you get from vectors that have moved but not organised.

The correct decision is the one the original dev plan already had: emotion belongs at the LLM input, the one space where the signal is injected and consumed in the same coordinate system. I got there by elimination rather than by reasoning.

## Four experiments, four repositories

The work splits across five repos. Four are mine; one is a vendored dependency.

| Repo | Route | Layer attacked | Outcome |
| --- | --- | --- | --- |
| [`soprano-emo`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/soprano-emo) | Decoder-side conditioning + adversarial disentanglement | Vocoder | Negative — ruled out with a causal explanation |
| [`kokoro-emotion`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/kokoro-emotion) | Cross-encoder style transfer + retrieval | Style vector | Negative — signal collapse + degenerate embedding space |
| [`soprano-tts`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/soprano-tts) | Teacher→student distillation via LoRA | Training data | Incomplete — overfits at 1,500 clips |
| [`isales`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/isales) | Emotion *recognition* driving an LLM | Application | Shipped |
| [`test_mlx_audio`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/test_mlx_audio) | On-device streaming TTS harness | Inference | Superseded — switched to Chatterbox, then absorbed |

<!-- TODO: verify these five GitHub URLs resolve and are visible to whoever
     you're sending this to. Four are under an org (AIML26-C1-4-Audio-Multi-Modal-ML)
     that may be private, and kokoro-emotion has no git remote configured at all —
     it may not be pushed anywhere yet. -->

### Building the dataset

Every experiment that trained on real emotional speech used the same source: Expresso, filtered to speakers `ex01`–`ex03` and styles `default`, `happy`, `sad`. The raw filtered distribution is almost perfectly rectangular — 379–380 utterances in every one of the nine speaker×style cells.

Preprocessing turns that into fixed-length segments at Soprano's native 32 kHz: 48 decoder frames of 2,048 samples each, so 98,304 samples or 3.072 seconds per segment. The result is 4,438 segments, **3.79 hours of audio**, distributed as:

| Emotion | Segments | Speaker | Segments |
| --- | --- | --- | --- |
| default | 1,405 | ex01 | 1,527 |
| happy | 1,466 | ex02 | 1,472 |
| sad | 1,567 | ex03 | 1,439 |

Two preprocessing decisions were not defaults. **Loudness is not normalized** — level and energy are emotion cues, and normalizing them away would delete part of the signal I was trying to capture. And the trailing chunk of each utterance is zero-padded rather than dropped, unless it contains less than 8 frames of real audio, in which case it goes. Silence is a harmless reconstruction target; a mostly-silent segment labelled `happy` is not.

One toolchain note that cost real time: `datasets` now wants `torchcodec` to decode audio columns, and `torchcodec` on macOS is an FFmpeg version fight. Casting the column with `Audio(decode=False)` and decoding with `soundfile` manually removes the dependency entirely.

### The encoder, and the two-step training it enabled

The missing tokenizer forced the whole structure. Step 1 trains `SopranoEncoder` to invert the frozen decoder — reconstruction only, neutral emotion id, decoder parameters frozen, multi-resolution STFT loss. One alignment subtlety took a while to get right: the decoder emits `TOKEN_SIZE * (T-1)` samples for a T-frame input, dropping the first frame at the edge, so the reconstruction target is the input audio minus its first 2,048 samples.

Step 2 is where the actual hypothesis lives. An emotion classifier reads the encoder's hidden states; the encoder is trained to make that classifier's predictions *uniform*. If the encoder carries no emotion information, and reconstruction still has to succeed, then the emotion must flow through the only other path available: `emotion_table`, keyed by the clip's ground-truth label.

The classifier design has two anti-cheating measures. Its input goes through a `LayerNorm` first, so the encoder cannot defeat it by inflating activation magnitude. And the encoder's objective is the bounded confusion loss rather than gradient reversal:

```python
def confusion_loss(logits):
    """Bounded below by ln(K), reached when the prediction is uniform."""
    return -torch.nn.functional.log_softmax(logits, dim=1).mean()
```

The confusion weight ramps from 0 to `ADV_WEIGHT = 0.3` over 4,000 steps rather than switching on at full strength, because turning it on at step 0 destabilizes reconstruction before it has settled. The classifier gets a faster learning rate (1e-3) than the encoder and emotion table (2e-4, cosine-decayed) — the adversary needs to learn faster than the encoder can hide.

Every script carries a `--overfit` self-test that validates wiring against decoder-generated targets with no dataset and no checkpoints. The disentanglement test asserts two things separately: (A) with the adversarial term off, reconstruction loss drops by at least 30%; (B) with it on for one step, all three components — encoder, `emotion_table`, classifier — receive nonzero gradient, and the confusion loss respects its `ln(K)` floor. Conflating these would hide a broken adversary behind working reconstruction, since the two objectives are *supposed* to fight.

### The retrieval library

The `kokoro-emotion` line of work took a completely different angle: don't train anything, construct the right style vector. In Kokoro, which is StyleTTS2-based, the style vector *is* the personality — there's no separate emotion slot, so voice identity and emotion are entangled in one tensor of shape `(511, 1, 256)`. Control means constructing the right pack.

I indexed all 54 Kokoro built-in voices through the Kanade tokenizer's global embedding (128-dim), producing `kanade_to_kokoro_library.json` — a lookup from voice name to embedding. The runtime idea was: encode the user's emotional reference audio, find the nearest voices in Kanade space, average their Kokoro packs weighted by squared similarity, subtract the global mean pack to isolate a "pure emotion delta," and add that delta scaled by alpha onto a chosen base voice so accent and timbre stay locked.

The measurement that killed it is in the results below.

## How the evaluation was structured

The most useful methodological choice was writing the decision gates down *before* running anything, in a form that could return "stop." The H1 test plan has a table that says, in as many words, "Step 1 PCA: emotions don't cluster → StyleTTS2 encoder not useful for emotion — stop." The Soprano dev plan gates Day 2 on Day 1 succeeding: "Do not proceed to the steering layer on a broken baseline." Both documents define what failure looks like in concrete audible terms — "output sounds identical regardless of emotion reference," "emotion transfers but destroys voice identity" — rather than leaving it to post-hoc judgment.

That mattered because every one of these experiments had a tempting escape hatch. When the disentanglement run flatlined, the available excuses were data quantity, learning rate, the confusion weight, and a known plumbing bug in `cond_proj` persistence. I worked through them: the plumbing bug was real and I fixed it, and the run still couldn't improve. ~1,100 clips per emotion is not a data-quantity problem when you are fitting **three vectors**. Ruling those out is what turned "it didn't work" into "it can't work, here's why."

The second choice was blind listening as the primary signal, with two people, on the same 5 sentences × 3 emotions at a fixed speaker. Objective metrics were planned as support — a speech-emotion classifier for recovery of the intended label, Whisper WER for intelligibility at high alpha, speaker-embedding cosine similarity to check emotion wasn't leaking into identity. **Those objective metrics were never run**, because the listening gate failed first and the plan said stop. That's the gate working as designed, but it means the negative results rest on measured training dynamics plus ears, not on a classifier confusion matrix.

Third, the failure analysis stayed separate from the training guide. `EMOTION_TRAINING.md` documents the route as a how-to and states the expected ceiling up front — "if emotions aren't clearly audible after step 2, the signal is to move conditioning to the LLM, not to grind on the decoder." `EMOTION_FINDINGS.md` records what actually happened.

## Results

**Every route to model-native emotion control failed. The one system that shipped does not generate emotion at all — it recognises it, and lets a language model respond to it.**

### Decoder-side disentanglement: a causal negative

The real Expresso run, warm-started encoder, on MPS:

| Epoch | recon | cls | conf | adv weight |
| --- | --- | --- | --- | --- |
| 0 | 1.13 | 1.03 | 1.21 | 0.04 |
| 7 | 1.29 | 1.098 | 1.10 | 0.30 |
| 11 | 1.29 | 1.098 | 1.10 | 0.30 |

Reconstruction loss climbs 1.13 → 1.29 in lockstep with the confusion weight ramp, then flatlines the instant the weight stops rising. The lockstep is what makes this causal rather than noise — the loss is not drifting, it is tracking a knob I turned.

Meanwhile `cls` and `conf` both pin at 1.098, and `ln(3) ≈ 1.0986`. The adversary is defeated: the encoder became emotion-invariant almost immediately and the classifier can do no better than uniform guessing. So the disentanglement half of the experiment worked. The encoder gave up its emotion information as asked — and reconstruction got worse rather than the emotion table picking up the slack, which is the signature you would predict if the emotion table lacks the capacity to carry what the encoder dropped.

The trained emotion vectors, from the notebook:

```
||default - happy|| = 37.951
||default - sad||   = 38.118
||happy - sad||     = 38.182
```

Distinct, and useless. All three pairwise distances agree to within 0.6% — the geometry of vectors that have been pushed apart without being organised. Learned emotional structure would not be equilateral.

### Cross-encoder style transfer: signal collapse

The H1 delta-steering sweep on base voice `af_bella`, synthesizing "GET OUT OF MY WAY!", measured directly off the output WAVs:

| Alpha | Duration | RMS | Peak |
| --- | --- | --- | --- |
| 0.0 (base) | 1.02 s | 0.08365 | 0.4097 |
| 0.5 | 1.54 s | 0.04144 | 0.3633 |
| 1.0 | 1.82 s | 0.01298 | 0.3859 |
| 1.5 | 1.68 s | 0.00894 | **1.0000** |

Two failures at once. Signal energy collapses by **9.4×** from alpha 0 to 1.5 — the speech is being progressively erased. And at alpha 1.5 the peak hits exactly 1.0000, full-scale clipping, while RMS is at its lowest. Quiet, mangled output with clipped transients is a decoder being fed vectors far outside the distribution it was trained on. Duration also drifts from 1.02 s to as much as 1.82 s on identical text, meaning the prosody predictor is being destabilized rather than steered.

The naive-projection control is worse: broadcasting an averaged StyleTTS2 vector directly as a pack gives `step2_naive_neutral.wav` an RMS of 0.48665 with a peak of exactly 1.0000 — clipped solid — and the angry version 0.04098. An 11.9× energy difference between two supposedly comparable conditions says the decoder has no meaningful response to vectors from this space; it breaks differently depending on the magnitude you hand it.

One correction worth recording: the H1 plan assumed StyleTTS2 emits a `(128,)` vector needing tiling to reach 256 channels. It actually returns `(1, 256)` — the concatenation of `style_encoder` and `predictor_encoder`, 128 each — so the channel dimension already matched and no tiling was needed. The dimensional-expansion risk I had flagged as the primary threat was not what killed the route.

### The retrieval library: a near-degenerate embedding space

This measurement mattered because the system *appeared* to work. A live query returned "Closest voice match: `zm_yunjian` with similarity score: 0.9869," which reads like a confident retrieval.

Computing the full pairwise similarity matrix over all 54 voices in the library:

| Statistic | Cosine similarity |
| --- | --- |
| Mean pairwise | 0.9704 |
| Minimum (`am_onyx` ↔ `zf_xiaoyi`) | **0.9023** |
| 5th percentile | 0.9373 |
| Maximum (`em_santa` ↔ `pm_santa`) | 0.9995 |

The *least* similar pair of voices in the entire library — an American male and a Chinese female — scores 0.9023. The whole population is crushed into the top 10% of the similarity range. A 0.9869 match is an ordinary match in a space where everything is a strong match. Retrieval over these embeddings is close to arbitrary, and any "emotion delta" computed from a top-K average is a delta between two points that were nearly identical to begin with.

For contrast, `em_santa` ↔ `pm_santa` at 0.9995 is the same character in two locales, only 0.03 more similar than the mean. Whether Kanade's global embedding is capturing something real on a compressed scale or simply isn't discriminative here, I can't say from this data alone — but either way, cosine top-K over it doesn't work.

### Distillation: unfinished, with a diagnosed cause

The fourth route sidestepped architecture entirely: if you can't add emotion to the model, generate emotional training data and fine-tune. Qwen3-TTS 1.7B as teacher, voice `serena`, instruction locked to "Speak in a happy, energetic, and friendly conversational tone," generating synthetic clips from LibriTTS transcripts filtered to 6–30 words. Student: Soprano 80M via LoRA — rank 16, alpha 32, batch 8, sequence length 1,024, max LR 2e-4, ~3.2M trainable parameters out of 82.9M.

It reached **1,500 of a target 5,000 clips**, and the run at that size overfits: validation audio loss starts diverging at roughly step 200–300, with a best value of ~5.94 around step 100 against a target band of 3–5. The diagnosis is dataset size, and the fix is written down — `SOURCE_HOURS = 10.0`, generate the remaining ~3,500 clips, re-run. I did not do it. This route was abandoned for time rather than evidence, so it's undecided rather than failed.

Two operational notes that cost real debugging: MPS fp32 training is stable, but fp16 casting without a `GradScaler` produces NaN within ~100 steps. And the LoRA adapter should not be merged until ship time — merging costs you the ability to swap voices with `set_adapter()`.

### What did ship

The iOS app works, on-device, end to end: VAD segments the player's speech, Whisper transcribes it, an LSTM SER model classifies its emotion, Qwen2.5-7B-Instruct-4bit plays the customer, and TTS speaks the reply. Over 70 commits it grew a full round loop with four personas, a three-product catalog with a web authoring UI, and an evaluation screen.

**The score is computed in code, never by the language model.** `compute_score` is deterministic: interest × 5.0 (up to 500 points), objection-resolution ratio × 250, a flat 250 for a win, minus 60 per logged lie, clamped to 1,000, then mapped through fixed grade bands. The judge LLM produces only the qualitative parts — honesty title, flagged claims, coaching tips. It never emits the number, which makes grades reproducible and unit-testable.

The emotion integration is deliberately partial. Since 2026-07-06 the gated SER label drives a composure gate: an angry or sad turn resolves no objections, cannot close the sale, and takes a deterministic meter penalty (8 patience for angry, 5 interest for sad). But the label stays out of `scoring.py` and out of the judge's honesty verdict entirely, because SER accuracy on accented speech is unvalidated. The penalty constants are explicitly flagged as the tuning knob if the gate misfires in playtests. An uncalibrated classifier is allowed to shape the conversation; it is not allowed to decide the grade.

So the project's answer to "how do you get emotional speech from a small model" turned out to be: you don't, yet. You build a system that *reads* emotion and responds to it, and let the response carry the meaning the voice can't.

## What didn't work

**The constant-bias emotion table hit a capacity ceiling I had documented and then under-weighted.** `emotion_table` is `nn.Embedding(3, 768)` — three vectors, added time-invariantly to every frame. Real emotion is time-varying, so the best this route could produce was a timbral shift. It showed up as rising reconstruction loss under the confusion ramp: the encoder gave up emotion information and the table had nowhere to put it. I wrote the ceiling into `EMOTION_TRAINING.md` before training and spent the cycles anyway.

**The encoder↔LLM domain mismatch invalidated the route independently of the ceiling.** `emotion_table` was trained on stand-in encoder features but consumed at inference on LLM hidden states — two different distributions with no learned bridge between them. Step 1 makes `encoder ≈ decoder⁻¹`; it never makes `encoder ≈ LLM`. This surfaced while trying to explain why the vectors were provably distinct (‖default−happy‖ = 37.951) while the audio was both overpowering and uncorrelated with the intent. No training fix addresses it, because it isn't a training problem — the emotion vector is calibrated against a coordinate system it will never encounter at inference.

**The `cond_proj` train/inference persistence bug — a real bug that was not the cause.** The projection that injects the emotion embedding stayed at random init and wasn't being persisted consistently between training and inference. I found it, fixed it, saved it into the checkpoint alongside the emotion table, and the run still couldn't improve. A real bug that isn't *the* bug will absorb unlimited debugging time if you let it stand in for the architectural problem. There's a residual smell here too — the verification notebook loads `emotion_table` but not `cond_proj`, and two `decoder_emotion.pth` files differ in size (51.0 MB vs 48.7 MB) depending on whether `cond_proj` is included.

**Cross-space style transfer destroyed the signal instead of steering it.** Projecting StyleTTS2 style deltas onto Kokoro packs collapsed RMS 9.4× while driving peaks into clipping, and destabilized duration on fixed text. StyleTTS2 and Kokoro were fine-tuned separately, so even with matching 256-dim shapes they don't share latent geometry — and Kokoro's conditioning is per-token-position while StyleTTS2's is a single global vector. Matching dimensions is not the same as matching spaces. My design doc had guessed the dimensional expansion would be the killer; the actual killer was geometric.

**Retrieval over Kanade global embeddings was arbitrary, and the similarity scores hid it.** A 0.9869 top-1 match looks decisive until you compute the population statistics and find a mean of 0.9704 and a floor of 0.9023 across 54 voices. It took computing the full 54×54 matrix to see it — at the level of individual queries everything looked like it was working.

**Distillation stalled at 30% of the planned dataset.** 1,500 of 5,000 clips, with validation audio loss overfitting from step 200–300 and a best of ~5.94 against a 3–5 target. The cause is dataset size — diagnosed, with the remedy written down and not executed. Incomplete rather than failed.

**Effort spread across five repositories with no shared evaluation harness.** Each experiment invented its own way of deciding whether it worked — training-curve inspection here, WAV signal statistics there, blind listening somewhere else. There is no single script that takes generated audio and reports emotion-classifier recovery, WER, and speaker similarity across all four routes. That's why the objective metrics in the plan never got run: the gate failed first every time, and no shared tooling existed to make running them cheap.

## What I'd do differently

**Verify the injection point before building anything on top of it.** The question I never answered up front — does the decoder consume the LLM's final hidden states or the input code-embedding table? — determines whether the entire decoder-side route is coherent, and it gates the difficulty of reproducing the tokenizer by inversion. I spent weeks on a route whose viability turned on something I could have settled in an afternoon with a debugger.

**Send the email on day one.** The whole project was blocked on Soprano's unreleased audio→token encoder. Asking the model's author for it is free and could have collapsed a multi-week timeline into days. I routed around the missing encoder with an increasingly elaborate stand-in instead.

**Compute the population statistics before trusting any similarity score.** The Kanade retrieval failure was invisible at the level of individual queries and obvious the moment I looked at the distribution. Any system whose behaviour depends on a similarity threshold should report, on day one, what the similarity distribution over the whole reference set looks like — mean, floor, percentiles. A single high score means nothing without the range it came from.

**Build the evaluation harness first, and share it across experiments.** One script: given generated WAVs and intended labels, report speech-emotion-classifier recovery, Whisper WER, and speaker-embedding cosine similarity against a neutral reference. Every route would then produce comparable numbers, and the planned objective metrics would have actually been run. The reason my negative results rest on training curves and ears is that I never made running the real metrics cheap.

**Ship the DSP style knob as v1 and keep researching behind it.** The findings doc identifies a 1–2 day fallback: post-process the TTS output — pitch up, faster, brighter for happy; pitch down, slower, darker for sad. It's "acted" rather than model-native, and for a toggle it's often indistinguishable to listeners. A shipping style mode from week one would have given me a baseline to measure the model-native routes against. Instead I have four negative results and no controllable emotion in the product.

---

**Repository:** [`soprano-emo`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/soprano-emo) · [`kokoro-emotion`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/kokoro-emotion) · [`soprano-tts`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/soprano-tts) · [`isales`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/isales) · [`test_mlx_audio`](https://github.com/AIML26-C1-4-Audio-Multi-Modal-ML/test_mlx_audio)

**Built on:** [Soprano-1.1-80M](https://huggingface.co/ekwek/Soprano-1.1-80M) · [Kokoro-82M](https://github.com/hexgrad/kokoro) · [Kanade tokenizer](https://github.com/frothywater/kanade-tokenizer) · [Expresso](https://huggingface.co/datasets/ylacombe/expresso)

<!-- TODO: no cost figures anywhere in the repos. All training appears to be
     local (MPS on Apple Silicon) — if any cloud GPU time was bought for the
     distillation run, add it; otherwise state "all training ran locally on an
     M-series Mac, no cloud spend" and make that a virtue. -->
<!-- TODO: wall-clock training times are not recorded in any log or notebook.
     The disentanglement run is 60 epochs configured but the recorded log stops
     at epoch 11 — confirm whether it was killed early (likely, given the
     flatline) and say so explicitly. -->
<!-- TODO: the plan says blind-listening with "one other person". Confirm a
     second listener actually participated, and for which experiments. If it
     was only you, say so — single-listener evaluation is a stated limitation,
     not a thing to leave ambiguous. -->
<!-- TODO: iSales day-one latency numbers (TTFA, STT time, Qwen tok/s) are
     listed as "verification still open" in BUILD_STATUS.md and were never
     measured. Either measure them on device or keep the claim out. -->
<!-- TODO: confirm the project date range. Git history spans 2026-06-23 to
     2026-07-10 (~2.5 weeks of commits), but the article says "five weeks" in
     the summary based on the full arc including uncommitted work. Pick one and
     make it accurate. -->
