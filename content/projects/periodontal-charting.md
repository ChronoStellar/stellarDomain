---
title: "Periodontal Charting by Voice"
slug: periodontal-charting
date: 2026-08-21
summary: "An offline iPad app that turns Indonesian clinical dictation into a WHO-standard periodontal chart, with target speaker extraction, STT, and a custom parser"
tags: ["SwiftUI", "CoreML", "STT", "NLP", "on-device", "3D", "Speech"]
coverImage: /projects/periodontal-charting/periodontal_hero.png
---

## The problem

Periodontal charting is a two-person job for no good reason. A clinician holds a probe in one hand and a mirror in the other, reads off three to six numbers per tooth site, and an assistant types them in. Thirty-two teeth, six sites each, several metrics per site — the dictation is fast, repetitive, and the assistant is a transcription bottleneck who is also a second salary. Everyone involved knows the numbers are occasionally wrong and nobody can tell you which ones.

The obvious fix is speech-to-text, and the obvious speech-to-text is Whisper. I started there and it was the wrong tool: clinical dictation is not natural language. `"gigi 16 tiga empat lima tiga empat tiga"` is a command with a grammar, spoken by someone who is not looking at the screen, in Indonesian, in a room with a compressor running. A general model trained to produce fluent text will produce fluent text, which is the failure mode here. It hallucinates plausible sentences where I need it to either emit a valid clinical token or emit nothing.

The question underneath: can a small constrained model plus a lot of domain structure beat a big general model on a narrow task? The vocabulary here is about 700 words — a constraint I could exploit and Whisper structurally cannot. The second thing I wanted, and got much less of, was to see whether target-speaker extraction could solve the assistant-voice problem, since a clinic has two people talking and only one of them is dictating.

What it is: an iPad SwiftUI app that renders a full 32-tooth WHO-standard chart and fills it in from live Indonesian voice dictation, entirely offline. A 602 MB Wav2Vec2 Indonesian model runs on-device via Core ML, feeding a CTC beam search constrained by a 714-word prefix trie, into a stateful parser that turns token sequences into chart mutations. In front of that sits a speaker gate and a BSRNN target-speech extractor meant to keep the assistant's voice out of the chart.

## Key learnings and technical outcomes

- **A lexicon-constrained decoder beat Whisper by roughly 2.5x on the same two clips.** Wav2Vec2 with the trie scored 12.54% and 15.32% WER where the Whisper streaming benchmark scored 34.95% and 27.59% — though the two were not scored by identical normalizers, which I unpack in the evaluation section.
- **The parser is exact on clean text.** Fed the human-corrected transcripts, both test charts come back with **0 field mismatches** out of 194 comparable fields. Every remaining end-to-end error is an acoustic error, not a grammar error.
- **Steering a CTC beam with domain knowledge is cheap and effective.** A word-completion log-prob bonus for anatomy terms, plus relaxing the character prune threshold so those branches survive long enough to receive it, broke a plateau I had assumed required fine-tuning.
- **One dropped word can cost 60+ chart fields.** The parser is a state machine with a persistent active-metric cursor, so a missed metric keyword doesn't produce one error — it silently misroutes every subsequent value until the next keyword.
- **Offline evaluation harnesses have to replicate the front end exactly.** My regression script skipped the high-pass filter and auto-gain the live app applies. Fixing that one discrepancy moved mismatches from 91 to 49 with no model change whatsoever.
- **CPU-only beat CPU+ANE for the separator.** 12.40 ms/block vs 14.95 ms/block on A16 — the Neural Engine doesn't accelerate the reshape-heavy operations that dominate a BSRNN forward pass.

## Key considerations and trade-offs

- **Indonesian only, clinical vocabulary only.** The trie makes out-of-lexicon words literally undecodable. This is the source of the accuracy win and also means the system cannot transcribe a clinician's aside.
- **Fully offline, which costs 602 MB of app bundle.** Patient audio never leaves the device. In a medical context I was not willing to trade that for a smaller download or a better cloud model.
- **A 40-wide beam over a ~700-word trie, on-device.** Beam width 10 was too narrow to recover anatomy terms; 50 hallucinated. 40 is an empirical middle, not a principled one.
- **Deterministic replay over mutable chart state.** The chart is rebuilt by replaying an append-only command log on every change, so re-parsing the same transcript always yields the same chart. This made regression testing tractable and cost some live-update efficiency.
- **The evaluation ignores six high-frequency filler words** (`gigi`, `ada`, `pada`, `ke`, `di`, `bagian`). They carry no clinical value, but dropping them removes 3.7% of the reference words on one clip and 12.9% on the other, which flatters the WER.
- **Two test speakers.** Everything below rests on two recordings, one dentist and one student — not a sample size that supports much.

## Constraining the decoder instead of fine-tuning the model

The decision I spent the most time on is that all the domain knowledge lives in the decoder rather than in the model weights.

The base Wav2Vec2 Indonesian model has never seen a periodontal chart. Its language prior comes from general Indonesian, where `lima` (five) is vastly more frequent than `lingual`. Acoustically these are not far apart when spoken quickly by someone looking at a patient's mouth. The model was confidently, systematically wrong in one direction: it collapsed clinical anatomy onto numbers.

The orthodox answer is to fine-tune on clinical audio. I didn't have clinical audio — I had two recordings, which is a test set, not a training set. So the alternative was to put the prior somewhere else: a prefix trie built from a 714-word lexicon, checked at every character extension, so the beam search can only ever walk toward a valid clinical word. A branch that cannot complete into a lexicon word is pruned outright.

That alone wasn't enough, and it took a trace to find why. The trie prevents invalid words but doesn't fight acoustic bias between two *valid* words. `lima` and `lingual` are both in the lexicon. The model would commit to `l-i-m` early on raw acoustic scores, and by the time a language-model bonus could have rescued `lingual`, the character branch had already been pruned. Two fixes had to land together: a **–20.0 log-prob bonus applied when a beam completes an anatomy word** (with a smaller –2.0 running bonus for prefixes still in progress), and a **relaxed character prune threshold of –15.0**, so the weaker `l-i-n-g` branch survives long enough to collect the bonus. Either one alone does nothing. The prune relaxation without the bonus just keeps bad branches alive; the bonus without the relaxation arrives at a branch that no longer exists.

The trade is that this is all hand-tuned magic numbers against two recordings. A fine-tuned model would generalize to a third speaker better than my constants will. I traded generalization I couldn't verify for accuracy I could measure, which seems right at this sample size, but the constants aren't principled.

## How the pipeline fits together

Audio moves through five stages, all on-device:

| Stage | Component | What it does |
| --- | --- | --- |
| Conditioning | `HighPassFilter` → `AutoGain` | Lifts softly-spoken clinicians, up to 2.5x contrast |
| Segmentation | Energy VAD, 512-sample chunks | Rolling 4 s window; floor = 20th pct, loud = 90th pct |
| Isolation | `SpeakerGate` → `TSEEngine` (BSRNN) | Rejects non-target speakers; optionally extracts target |
| Recognition | Wav2Vec2 FP16 → `CTCDecoder` | Trie-constrained beam search, width 40 |
| Parsing | `VoiceTokenizer` → `StatefulParser` | Tokens → `AnnotationCommand` mutations |

The speech detector was a bug I fixed twice. The original was `isSpeech = rms > max(0.001, baselineRMS * 2.0)`, with the baseline updating *only when the detector believed the room was quiet*. That is a one-way door: once noise pushes RMS above the threshold, the baseline freezes at its old low value, and every subsequent buffer reads as speech forever. Sessions would never stop listening. The replacement measures **contrast rather than level** — speech iff `rms > floor * 3` **and** `loud / floor >= 3` over a rolling window — because steady room noise is loud but flat, while speech has dynamic range measured at 14–50x on healthy recordings versus 2.3–3.4x on noisy ones. A percentile always tracks, so the latch cannot form.

### The parser is a state machine, which is the whole risk

`StatefulParser` carries a cursor: current tooth, current metric, pending numbers, active selection. `"resesi mesio palatal 1"` sets the metric to gingival margin; subsequent bare numbers flow into that metric until something changes it. This is what makes the dictation natural — the clinician says the metric once and then reads numbers.

It is also a single point of catastrophic failure. In one run the model dropped two softly-spoken loanwords, `BOP` and `plak`, so the metric stayed on `gingivalMargin`. Then the clinician said `semua gigi` — "all teeth" — which *was* transcribed correctly, and the parser applied the pending value to the gingival margin of all 32 teeth. **Two dropped words produced 60+ wrong fields.** Not a parser bug: it was correctly executing an instruction assembled from a corrupted premise.

There is a safety net for the narrower version of this. When the parser is in a state where a number is clinically invalid — mid-range, or inside a boolean metric like bleeding or plaque — a `5` is recovered to `lingual` and a `2` to `bukal`, since the model's known bias runs in that direction and a number there is meaningless anyway. It's a targeted hack for a measured failure mode.

## How the evaluation is split

There are two evaluations here, and the split is the most useful thing in the harness. The **full pipeline** test runs audio through every stage to a finished chart. The **NLP pipeline** test feeds the human-corrected ground-truth transcript directly to the parser. The difference between them is the acoustic error, separated from grammar error.

That separation is what let me stop blaming the parser. When the NLP tests went to 0 mismatches and the audio tests didn't, the remaining problem was provably upstream.

Charts are compared field-by-field — probing depth, gingival margin, bleeding, plaque, mobility, furcation, implant — across 32 teeth, of which 5 are marked missing in both ground truths. A missing tooth short-circuits to a single comparison. That makes **194 comparable fields per chart**, which is the denominator for every mismatch count below. Both ground truth charts were annotated by hand from the audio.

Three caveats. First, **the WER normalizer filters six filler words** before scoring, which removes 3.7% of `dr_lucky`'s reference words and 12.9% of `student`'s. Second, and more seriously, **the Whisper baseline was not scored by the same normalizer** — it ports the word map but omits the filler filter and the anatomy-prefix collapse. It is therefore scored on a strictly harder reference than Wav2Vec2 was, and the 2.5x gap is inflated by an unknown amount. Third, **n = 2 speakers**, both scripted, neither recorded in a working clinic.

## Results

**The acoustic model works and the speaker-isolation layer does not.**

### Full pipeline — audio to chart

| Test case | Diagnostic words | Audio WER | Chart mismatches / 194 fields |
| --- | ---: | ---: | ---: |
| `dr_lucky` | 287 | 12.54% | 34 (82.5% correct) |
| `student` | 607 | 15.32% | 26 (86.6% correct) |

### NLP pipeline — corrected text to chart

| Test case | Mismatches | Previously |
| --- | ---: | ---: |
| `dr_lucky` | **0** | 20 |
| `student` | **0** | 69 |

### Against the Whisper baseline, same two clips

| Engine | `dr_lucky` WER | `student` WER |
| --- | ---: | ---: |
| Whisper (streaming, clinical logit bias) | 34.95% | 27.59% |
| Wav2Vec2 + trie + LM boost | **12.54%** | **15.32%** |

Mismatches fell 91 → 49 purely by making the offline harness apply the same high-pass and auto-gain as the live app — no model change, no decoder change. That was measurement error, not model error. The remaining 49 → 60 total across both clips came from the shallow fusion and prune relaxation described above.

Note that `student` has more than twice the diagnostic words of `dr_lucky` and a *higher* WER but *fewer* chart mismatches. I read this as errors clustering: `dr_lucky`'s errors more often hit metric keywords, where a single miss cascades across teeth, while `student`'s land more often on individual digits, where a miss costs exactly one field. That's an inference from the error distribution, not something I measured directly, and I'd want a third recording to support it.

**The extraction layer:**

```
6 of 8 extractions moved the span AWAY from the enrolled speaker centroid
mean +0.114   worst +0.310   best -0.039
restricted to its actual job (rescuing rejected spans): 1 rescue in 2 attempts
```

On a full real session, the transcript produced with the extractor in `rescueOnly` mode was **character-identical** to the transcript produced with no extractor at all, while costing 0.77 s. The aggressive `.everySpan` mode was destructive: `"ke resesi"` became `"selesai"`, and it hallucinated tokens (`gak`, `dengan`, `mid 1`, `bop`, `missing`) that were never spoken. Roughly 100 MB of Core ML models, at RTF 0.37–0.41, have yet to change a single word of output in either direction.

## What didn't work

**Whisper as the recognition engine.** WER 34.95% / 27.59% on the test clips, and the qualitative failure was worse than the number: it produced fluent Indonesian sentences where the correct output was a terse command string. A model with a strong language prior will use it, and here the prior is harmful. Removed in `8713fae`, along with the BERT tokenizer experiment.

**The target-speech extractor.** The models load, run, and produce separated audio at a reasonable RTF, but it has never improved a transcript. The cause is traceable: `TSEEngine.enrollmentAudio` selected enrollment speech using Silero VAD at threshold 0.3, but **Silero measures 0.001–0.003 on this device** — it finds nothing. Every enrollment therefore fell through to a "dead VAD" branch that uses the whole calibration file, pauses included. Confirmed by arithmetic: takes of 12.063 s + 10.484 s = 22.55 s, and the log reports `enrolled 22.5 s`. So 1024 conditioning keys were spread across ~22.5 s of which maybe 40% was speech, and the attention map softmaxed every mixture frame over enrollment frames carrying no speaker information. A weakly-conditioned extractor is the most likely explanation for separation failing on overlapping speech. The fix — enroll with the energy segmenter that already works, not Silero — is written up but **not yet verified on device.**

**Denoising before the speaker gate.** Tried, recorded as "do not repeat", and the mechanism is visible in the code: the segmenter derives its speech threshold *from* the noise floor (`max(noiseFloor * speechFloorMultiple, absoluteFloor)`). Denoise first and the floor collapses, the threshold pins to the 0.003 absolute floor, everything reads as speech, spans merge into one block, and the gate makes a single verdict over the whole chunk. Coverage went 39% → 31%.

**The acoustic cost filter, in its first form.** It normalized a CTC beam cost by *letter count*, then rejected words above 4.5. But beam cost carries a component that doesn't scale with word length — the trie's fight at word boundaries — so short words were structurally expensive regardless of how clearly they were spoken. It rejected `dua` (2), `enam` (6), `ke`, `dan`, `pada` — two of them are probing depths and the rest are tokens the parser builds structure from. 4.5 also bisected the distribution: `dan` appeared both accepted and rejected within a single session. The current version normalizes by **frames spanned** instead. I over-diagnosed this one: I filed it P0 on the strength of the rejected-word list, then found on re-reading the logs that all six rejections came from intermediate preview passes, which decode a growing buffer every ~0.5 s and therefore truncate the final word. High cost on a half-word is the filter working correctly, and preview text never reaches the parser, so no chart value was lost to it.

**Beam width 50.** The intuitive fix for "the right word isn't in the beam" is a wider beam. At 50 the model hallucinated and errors spiked; the actual problem was that correct branches were being *pruned by character threshold* before width ever became the binding constraint. Settled at 40.

**The offline harness diverging from the live app.** Covered above, but it belongs on this list — for a stretch I was tuning a model against numbers produced by a pipeline that no longer matched the one I was shipping.

## What I'd do differently

**Record more speakers before tuning anything.** Every constant in the decoder — the –20.0 bonus, the –15.0 prune, beam width 40, the 1.5 and 0.2 cost thresholds — was chosen against two recordings. I have no way to distinguish "tuned for clinical Indonesian" from "overfit to two people", and it's probably some of both. Ten speakers would not have been much more work and would have made every number above mean more. A third recording (`dr_gaby_audio.m4a`, 21 minutes) is sitting in the test directory unannotated.

**Build the harness to share code with the live path from day one, not to imitate it.** The 91 → 49 correction was free accuracy I'd been staring past for weeks because the measurement apparatus was wrong. The regression runner reimplements the chunking loop rather than calling into the same code the app calls, so this class of drift can recur — and the runner also hardcodes absolute paths under `/Users/vio/`, making it the least portable part of the project.

**Fix the extractor's enrollment before writing another line of extractor code.** The Silero-returns-nothing bug means the entire extraction layer has been evaluated in a degraded state. Every conclusion about whether target-speech extraction helps here is confounded by it, including the tally above. The fix is cheap, targeted, and would also cut tfmap cost by roughly 2.5x by shortening enrollment to actual speech. Until it lands, the accurate statement isn't "TSE doesn't work" but "TSE has never worked correctly enough to evaluate."

**Reconsider whether the parser should be able to fail this expensively.** A state machine that can apply one value to 32 teeth on the strength of two correctly-transcribed words trusts its input more than the input deserves. A confidence threshold on metric-switching keywords, or a confirmation step before any all-teeth operation, would bound the blast radius — worth a slightly more verbose dictation protocol.

---

**Repository:** [github.com/savio-enoson/PeriodontalCharting](https://github.com/savio-enoson/PeriodontalCharting)

<!-- TODO: confirm the date — 2026-08-21 is the last commit on `development`, not a publication date -->
<!-- TODO: the Whisper baseline (34.95% / 27.59%) comes from a commit message on the abandoned `test/whisper-wer` branch; the hypothesis files are not in the tree, so it cannot be recomputed without re-running the benchmark -->
<!-- TODO: "coverage 39% -> 31%" for denoise-before-gate is cited from a handoff.md that is not in this repo — verify or drop -->
<!-- TODO: the 2.5x conditioning contrast figure comes from analysis_results.md, not from a measurement I could locate in code -->
