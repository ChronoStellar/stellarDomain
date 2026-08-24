---
title: "JKTDrive: Benchmarking VLMs on Jakarta Traffic"
date: "2024-07-15"
tags: ["Autonomous Driving", "Vision-Language Models", "Benchmark", "Python"]
summary: "Most driving benchmarks assume orderly, Western roads. JKTDrive tests whether vision-language models can reason about Jakarta traffic and finds the gap between commercial and open-source models is far smaller than expected."
pinned: true
coverImage: "https://github.com/user-attachments/assets/bda86984-a5d8-4390-a01e-b4cab0ad5c6d"
---

## The problem

Autonomous driving benchmarks are built on roads that behave. Lanes are marked, traffic follows signals, and the vehicles around you are mostly cars moving in predictable directions. Models trained and evaluated on that world do well on that world.

Jakarta is not that world. Motorcycles weave between lanes, right-of-way is negotiated rather than signposted, vendors and parked vehicles occupy the roadway, and lane markings are often ambiguous or absent. If a vision-language model is going to reason about driving anywhere outside the conditions it was benchmarked on, someone has to measure it there first.

JKTDrive is that measurement: 273 human-annotated road scenes from Jakarta, turned into multiple-choice questions across 14 reasoning categories, run against five vision-language models under identical conditions.

This work was my thesis for my final year, however it's also a product of my own curiosity. I got really engrossed in Autonomous Driving (still am), but then I also realized that this technology does not exist where I live, why? So we decided to look deeper into that. As for why we went for Jakarta, that's my home essentially.

## Key Learnings and Technical Outcomes:
- Led end-to-end data workflows, including dataset cleaning, annotation, quality control, and quantitative analysis.
- Gained practical exposure to autonomous driving algorithms and the regulatory constraints governing real-world deployment.
- Configured secure cloud-based SSH access for remote compute servers, including hardware capability profiling and resource constraint management.
- Gained hands-on experience integrating and evaluating Vision-Language Model APIs using OpenAI and Google AI Studio platforms.

## Key consideration & Trade-off:
- Open source and commercial models used to simulate the possible usable models in real cases.
- Open source models are limited to 7-8B parameters max to cater to the hardware (RTX 5090)
- Data limitations pushed us to create our own dataset

## Building the dataset

![Data Class](/projects/jktdrive/jktdrive_classes.png)

All 273 images are captured from a forward-facing viewpoint that simulates an autonomous
vehicle's camera, then hand-annotated as multiple-choice questions with one correct answer
and three distractors.

The scenes are organised into 14 categories under three capability groups:

| Capability group | What it tests | Categories |
| --- | --- | --- |
| **Perception Reasoning** | Reading road layout and planning a lawful action | Navigation Decision Making, Lane Recognition, Unidirectional Traffic, Narrow Roadway |
| **Safety Compliance** | Obeying signage, signals, and road conditions | Obstacle Recognition, Long/Short Parking, Inadequate Road Conditions, Trajectory Planning Signs, Traffic Signal Recognition, Road Signs Recognition |
| **Urban Flow Complexity** | Handling moving agents and evasive situations | Evasive Maneuver Planning, VRU Cut-In, Vehicle Cut-In, Vehicle Recognition |

We actually recorded 2/3 of the dataset with an iPhone mounted to a tripod inside a car. We placed the camera near the dashcam to get a closer POV to a real autonomous vehicle camera, then we drove around Jakarta for 4 hours. The rest is from an actual dashcam. With the footage we reviewed them and selected corner cases for each category. The paper goes in depth for each category, but essentially we took references from existing works and added some of our own to fit the case.

When we were writing the annotations, I found it pretty annoying to keep switching back and forth, making sure that each file was with its correct pair, and so on. I could use Excel or Word but that's more work for exporting it later to a dataset. It could work as a CSV, with img_path, MCQA or something like that, however I don't find it quite as readable as JSON, so I made a Gradio UI tool to pair a JSON object with the images. Then we wrote the question and right answer for each image, we used Gemini to create distractors, then checked all of it again to make sure everything made sense.

The number 273 was actually a bit lower than what we expected. We wanted to go 350+, but the variation in the footage didn't really support going to that amount. Since this was also for a thesis on a university student budget, we couldn't go too overboard with the cost. While all of those above are true, we also saw that if a class is comprised of all the same-ish cases then there's really no new information being discovered, so the final number is also from cut data.

## Making the evaluation fair

![Models](/projects/jktdrive/jktdrive_models.png)

When choosing the models we picked them from the VLM leaderboard with around 7-8B parameters, so we could benchmark LLaVA as the 'failure' point, and when picking the commercial model, we picked GPT as the most well known general model at the time and we didn't add more because of budget constraints.

A multiple-choice benchmark has an obvious failure mode: a model can score well by
preferring a position — always answering "C" — rather than by understanding the image.

JKTDrive uses **circular evaluation** to remove that. Each question is asked four times with the answer options rotated, and a model only earns credit if it selects the correct answer in every rotation. Position bias stops being worth anything.

Every model sees identical prompts and the same response constraints.

![Data Sample](/projects/jktdrive/jktdrive_sample.png)

We actually made some edits to VLMEvalKit to fit circular eval, so the data becomes a .tsv of 2GB for each class (273*4 base-64 encoded image + text). This was run on a vast.ai instance with an RTX 5090 and 100GB of storage. Each run is saved, then the instance is wiped to clean the storage and cache, with the exception of GPT which we ran on our own device to load the data and model via API.

I think we paid $10 for vast.ai and $10 for ChatGPT. Renting vast.ai was cheaper than expected so we barely used half of it. For GPT we exhausted all of our tokens though. The whole experiment didn't take too long. It was done within the span of a week with revisions and redos, and each run barely took 10 minutes.

It's also important to note that not every model passed the ABCD correctly in the format we made, so I had to check and revise all of them. Then I compared and analyzed the accuracy of all of them manually to get the final analyzed result.

## Results

Five models, evaluated under circular evaluation on all 273 scenes.

| Model | Type | Overall accuracy |
| --- | --- | --- |
| **InternVL2.5** | Open source | **81.32%** |
| GPT-5 | Commercial | 80.22% |
| Qwen-2.5-VL | Open source | 75.82% |
| Ovis-1.6-Gemma2 | Open source | 71.79% |
| LLaVA-1.5 | Open source | 47.62% |

**InternVL2.5 is the best model overall**, and it is open source. It finishes
1.10 percentage points ahead of GPT-5 — on this benchmark, the commercial
advantage in chaotic urban driving is not just small, it is absent.

Performance also splits by capability. GPT-5 is strongest on Perception
Reasoning, while InternVL2.5 takes both Safety Compliance and Urban Flow
Complexity, the categories most directly about dense, unpredictable traffic.

We initially thought that GPT would win in a landslide, but it turns out that in general accuracy it's a very close race between InternVL and GPT. If we're not using circular eval (where all 4 must be correct) GPT edges InternVL, but with the absolute answer InternVL is more consistent. But we were also surprised that a 7-8B model can perform this well. This shows enough promise for the reasoning capabilities, though the agentic capabilities still need to be tested.

## Limitations

**273 scenes is small for a benchmark.** Split across 14 categories, the
per-category slices are smaller still, so category-level differences between
models should be read as indicative rather than significant. The 1.10-point gap
between the top two models is well inside the range where a few reannotated
questions could reorder them.

**No human baseline.** Without responses from experienced Jakarta drivers, there
is no reference for human-level performance on these scenes. That matters most
for the two questions every model missed: they may be genuinely hard, or the
question and its distractors may be flawed. I can't currently tell those apart.

**One city, one viewpoint.** Every scene is forward-facing, captured in Jakarta,
two thirds from a phone mounted near the dashcam position. Findings may not
transfer to other dense-traffic cities, and nothing here tests rear or lateral
perception.

**MCQA measures recognition, not driving.** A model can select the correct
option without being able to act on it. Nothing in this benchmark demonstrates
that a model could execute the maneuver it identifies as correct.

**Annotation was done by a small group,** with distractors drafted by Gemini and
reviewed by hand. There is no inter-annotator agreement figure, so annotation
consistency is unmeasured.

**Contamination can't be ruled out.** The commercial model may have encountered
similar imagery during training, and there is no way to verify that from the
outside.

## What I'd do next

The next iterable step in this project would be adding more data to the dataset with more variation and adding more SOTA reasoning models such as Function Gemma or AlphaMaYo, or fine-tuning a model with QLoRA using existing data.

One thing that I'm particularly interested in is letting the agent drive a virtual car in a simulated environment.

---

**Repository:** 
- Data: [github.com/ChronoStellar/JktDriveVLM](https://github.com/ChronoStellar/JktDriveVLM)
- JKTDrive-VLMEvalKit: [github.com/vncnttan/JKTDrive-VLMEvalKit](https://github.com/vncnttan/JKTDrive-VLMEvalKit)
<!-- Add the paper link back once the arXiv ID is confirmed — the one in the old
     README (2407.11691) should be double-checked before publishing. -->
