---
title: "JKTDrive: Benchmarking VLMs on Jakarta Traffic"
date: "2024-07-15"
tags: ["Autonomous Driving", "Vision-Language Models", "Benchmark", "Python"]
summary: "Most driving benchmarks assume orderly, Western roads. JKTDrive tests whether vision-language models can reason about Jakarta traffic — and finds the gap between commercial and open-source models is far smaller than expected."
pinned: true
coverImage: "https://github.com/user-attachments/assets/bda86984-a5d8-4390-a01e-b4cab0ad5c6d"
---

<!-- ─────────────────────────────────────────────────────────────────────────
     SCAFFOLD — every «BRACKETED» block is a prompt for you to replace.
     Delete each comment and its «…» once you have written the real thing.
     Nothing here invents facts: the numbers below are the ones already in
     your README. Anything I could not verify is left as a prompt.
     ───────────────────────────────────────────────────────────────────── -->

## The problem

Autonomous driving benchmarks are built on roads that behave. Lanes are marked, traffic
follows signals, and the vehicles around you are mostly cars moving in predictable
directions. Models trained and evaluated on that world do well on that world.

Jakarta is not that world. Motorcycles weave between lanes, right-of-way is negotiated
rather than signposted, vendors and parked vehicles occupy the roadway, and lane markings
are often ambiguous or absent. If a vision-language model is going to reason about driving
anywhere outside the conditions it was benchmarked on, someone has to measure it there
first.

JKTDrive is that measurement: 273 human-annotated road scenes from Jakarta, turned into
multiple-choice questions across 14 reasoning categories, run against five vision-language
models under identical conditions.

<!-- ═══ YOUR STORY #1 — WHY YOU BUILT IT ═══════════════════════════════════
     Two or three sentences, first person. The most valuable thing you can add
     here is the origin: what made you notice the gap?

     Prompts, pick whichever is true:
       • Was this coursework, a thesis, a lab project, or self-directed?
       • Did you try an existing benchmark on local footage and watch it fail?
       • Is this a road you drive? Did something specific prompt it?

     Recruiters read this paragraph to learn how you choose problems. A real
     origin story — even a mundane one — beats any amount of polish.

     «WRITE 2-3 SENTENCES HERE»
     ══════════════════════════════════════════════════════════════════════ -->

## Building the dataset

All 273 images are captured from a forward-facing viewpoint that simulates an autonomous
vehicle's camera, then hand-annotated as multiple-choice questions with one correct answer
and three distractors.

The scenes are organised into 14 categories under three capability groups:

| Capability group | What it tests | Categories |
| --- | --- | --- |
| **Perception Reasoning** | Reading road layout and planning a lawful action | Navigation Decision Making, Lane Recognition, Unidirectional Traffic, Narrow Roadway |
| **Safety Compliance** | Obeying signage, signals, and road conditions | Obstacle Recognition, Long/Short Parking, Inadequate Road Conditions, Trajectory Planning Signs, Traffic Signal Recognition, Road Signs Recognition |
| **Urban Flow Complexity** | Handling moving agents and evasive situations | Evasive Maneuver Planning, VRU Cut-In, Vehicle Cut-In, Vehicle Recognition |

<!-- ═══ YOUR STORY #2 — HOW THE DATA GOT MADE ══════════════════════════════
     This is the part no reader can guess and no repo makes obvious. It is
     also the part that demonstrates real research work.

     Prompts:
       • Where did the images come from? Dashcam? Phone? Public footage?
         Roughly how long did collection take?
       • Who wrote the questions and distractors — you alone, or a team?
       • How did you decide the 14 categories? Did they emerge from the data,
         or come from an existing taxonomy you adapted?
       • Writing *good* distractors is genuinely hard: a wrong answer that is
         too obviously wrong makes the question free. How did you handle that?
       • Did you discard scenes? What made a scene unusable?

     «WRITE A PARAGRAPH OR TWO HERE»
     ══════════════════════════════════════════════════════════════════════ -->

## Making the evaluation fair

A multiple-choice benchmark has an obvious failure mode: a model can score well by
preferring a position — always answering "C" — rather than by understanding the image.

JKTDrive uses **circular evaluation** to remove that. Each question is asked four times
with the answer options rotated, and a model only earns credit if it selects the correct
answer in every rotation. Position bias stops being worth anything.

Every model sees identical prompts and the same response constraints.

<!-- ═══ YOUR STORY #3 — THE ENGINEERING ════════════════════════════════════
     What did you actually have to build and debug? This is where your Python
     and infrastructure skills become visible instead of implied.

     Prompts:
       • You built on VLMEvalKit — what did you have to change or extend to
         make it accept a custom dataset?
       • How did you run the open-source models? Local GPU, Colab, cloud?
         Did VRAM limits shape which models you could evaluate?
       • What broke? Anything about output parsing, rate limits, cost,
         non-deterministic responses, models refusing to answer in format?
       • Roughly how long did a full evaluation run take?

     A specific, unglamorous debugging story is worth more here than a smooth
     summary. It shows you have actually run this kind of thing end to end.

     «WRITE A PARAGRAPH OR TWO HERE»
     ══════════════════════════════════════════════════════════════════════ -->

## Results

Five models, evaluated under circular evaluation on all 273 scenes.

| Model | Type | Overall accuracy |
| --- | --- | --- |
| GPT-5 | Commercial | **86.90%** |
| InternVL2.5 | Open source | **86.45%** |
| Qwen-2.5-VL | Open source | <!-- «ADD» --> |
| Ovis-1.6-Gemma2 | Open source | <!-- «ADD» --> |
| LLaVA-1.5 | Open source | <!-- «ADD» --> |

<!-- ═══ FILL IN — the three missing accuracy figures ═══════════════════════
     These are in Result/*/summary_results.csv in the repo. They matter: with
     only the top two filled in, a reader cannot see the spread, and the
     spread is the whole finding.
     ══════════════════════════════════════════════════════════════════════ -->

**The headline finding is the gap that isn't there.** GPT-5 leads overall at 86.90%, but
InternVL2.5 — open source — trails it by 0.45 percentage points. On this benchmark, the
commercial advantage in chaotic urban driving is close to noise.

Performance also splits by capability. GPT-5 is strongest on Perception Reasoning, while
InternVL2.5 takes both Safety Compliance and Urban Flow Complexity — the categories most
directly about dense, unpredictable traffic.

<!-- ═══ YOUR STORY #4 — WHAT SURPRISED YOU ═════════════════════════════════
     The single highest-value paragraph in this document. Anyone can report
     numbers; interpreting them is the research skill.

     Prompts:
       • Did you expect GPT-5 to win by more? Why do you think it didn't?
       • InternVL2.5 wins the two categories about messy, dynamic traffic.
         Is that a real capability difference or an artefact of the data?
       • Which category was hardest across all models? What does that say
         about what VLMs still cannot see?
       • Any memorable individual failure — a scene every model got wrong?
         A confident, completely incorrect answer? Those are the examples
         readers remember.

     «WRITE 2-4 SENTENCES HERE»
     ══════════════════════════════════════════════════════════════════════ -->

## Limitations

<!-- ═══ YOUR STORY #5 — BE HONEST ══════════════════════════════════════════
     Naming your own limits reads as confidence, not weakness. Reviewers
     trust work that states its boundaries.

     Candidates, keep the ones that are true:
       • 273 scenes is small for a benchmark; the per-category slices are
         smaller still, so category-level differences may not be significant.
       • Single city, single camera viewpoint — findings may not transfer to
         other dense-traffic cities.
       • MCQA measures recognition, not driving. A model can pick the right
         option without being able to act.
       • Annotation was done by a small group, so there is no inter-annotator
         agreement figure.
       • Commercial models may have seen similar imagery in training; there
         is no way to rule out contamination.

     «WRITE 3-5 BULLETS HERE»
     ══════════════════════════════════════════════════════════════════════ -->

## What I'd do next

<!-- ═══ YOUR STORY #6 — FORWARD LOOK ═══════════════════════════════════════
     Two or three bullets. Shows you see the work as ongoing rather than
     finished-and-filed.

     Prompts: more scenes? more cities? open-ended answers instead of MCQA?
     fine-tuning a model on the data? video instead of stills?

     «WRITE 2-3 BULLETS HERE»
     ══════════════════════════════════════════════════════════════════════ -->

---

**Repository:** [github.com/ChronoStellar/JktDriveVLM](https://github.com/ChronoStellar/JktDriveVLM)
<!-- Add the paper link back once the arXiv ID is confirmed — the one in the old
     README (2407.11691) should be double-checked before publishing. -->
