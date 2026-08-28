---
title: "Rulaa: Body Measurement & Size Recommendation"
date: "2025-12-05"
tags: ["Computer Vision", "3D", "Docker", "RunPod", "SwiftUI"]
summary: "An iOS app that estimates body measurements from photos and matches
them against real product size charts, so shoppers stop guessing sizes."
coverImage: "/projects/rulaa/rulaa_hero.webp"
---

## What it is

Online size charts are inconsistent across brands, and returns are expensive
for everyone. Rulaa estimates body measurements from user photos via a 3D
human-mesh pipeline, then matches them to per-garment charts with a fuzzy
logic recommender.

My role was as the lead AI Engineer, 2-person tech team, 2 designers, and a project manager. 
Shipped to App Store / TestFlight, though as of right now it's not available.

<div class="video-embed">
  <iframe src="https://drive.google.com/file/d/1GeyIhbmDX-IKUVhyS0_lav8_Qt2GWqPt/preview" allow="autoplay" allowfullscreen title="Rulaa demo"></iframe>
</div>

**Results:** ~3cm measurement error rate · 40s cold start · 5s inference time · $0.01/request · top 100th in the fashion & commerce at time of launch in Indonesia

## Why this was hard

### The customer wasn't who we thought

At first we were angling after helping apparel sellers in e-commerce reduce the
return rate of their products. After rounds of interviews and desk research, we
found the most likely cause: customers return products when the size is not what they wanted (which makes sense, you can't use them after all).

So the solution couldn't possibly be for the seller, but for the customer. That
conflicted with how we had designed the app and who we designed it for, since we
initially wanted to focus on a business-to-business (B2B) product. Should we
normalize the chart itself? Give seller & buyer access to a digital twin? Or
something else entirely?

After rounds of discussion and testing, we landed on a measurement and size
calculator for consumers.

### Getting in front of the shopper

The ideal approach was to inject the feature into existing e-commerce apps. But
most of them, e.g. Shopee and Uniqlo, for example already had a feature similar to our calculator, and it's not easy to seamlessly connect our app to an app that isn't ours.

Our solution was using Apple's share/action sheet to send links to our app. That raised a new problem: we had to scrape the data from those links per instance. Complicated enough on its own, and it goes against the terms of service of those apps and the Apple App Store. So we scrapped it in favor of size chart screenshots.

### There was no data

Data for this field is pretty much non-existent, so we had to gather our own:
clothes sizes, and what could be considered too tight, fit, or too loose.

The actual bottleneck was that we had no reliable human measurement data. I had
to design the AI by threshold and post-processing, which resulted in a more
black-box experience than I would have liked for tuning accuracy. This is where
the app could be improved the most, with a more robust system and more data
variation.

## Size Calculator

Since it was almost impossible to train a real model with the data condition, we opted to do a simple calculation logic. If $$\Delta$$ (Delta) of body parts size (bust, torso length, etc) and the clothes size from the chart are close to or less than 0, that means it's tight and the higher the $$\Delta$$ is the looser it is. To make sure that we didn't hard-code it too much, we use fuzzy logic here to help define the relationship of that number difference.

![Fuzzy Logic](/projects/rulaa/rulaa_fit_functions.webp)

Each body part gets this sort of membership and the end label is then weighted across each body part, for example bust and torso length have different tolerances for what feels small, so we give bust the biggest weight. This algorithm resulted in pretty good accuracy for blouses and shirts, which shows that not all problems immediately require AI.

### 3D Body Measurements

As it might sound, getting measurements purely from a single image is quite the complicated task. I started on SMPL (Skinned Multi-Person Linear model) which is an auto-regressive model trained on CAESAR dataset (Civilian American and European Surface Anthropometry Resource) to make a 3D mesh from body shape ($$\beta$$) pose estimation ($$\theta$$). Among the many models derived from SMPL, we used VIBE (Video Inference for Body Pose and Shape Estimation) as the first iteration of the model. Paired with the repo SMPL-Anthropometry we could create an end to end pipeline from image (in this case video) to a real measurement. Though without data to fine-tune it, representation quality was short of what the size matching needed, resulting in wrong measurements (error rate of 5-10 cm) for different body types. 

To bridge this precision gap, we migrated to **MHR** (*Momentum Human Rig* / SAM 3D Body) in the second iteration. While architecturally analogous to SMPL in its parametric decomposition, MHR provided substantially higher mesh resolution and localized joint articulation fidelity, compressing our measurement error down to **3–5 cm** across standard evaluations.

![Measurement](/projects/rulaa/rulaa_diagram.webp)

SAM 3D Body itself doesn't have an estimator, so I had to make my own, I called it sam-3d-body-measurement. At the time of development MHR was a new model, so there were no body-part landmarks for the mesh and I had to configure them on my own, the logic of the algorithm itself mirrors SMPL-Anthropometry which uses 3D renderer in python and measure the circumference and length of specified body parts from the scanned mesh. One other thing that differs substantially is that MHR doesn't have a sense of *scale* so we need to input height to scale the model to real life.

The tradeoff was real: in the docker container 7GB-10GB, latency stays similar but the new pipeline took 30s slower. Worth it because the recommendation is only as good as the measurement, and the fuzzy logic takes about 2-3 cm of error in consideration.

### Deployment

This was the first time I used docker to create an image to host, the first pick was AWS Fargate for serverless endpoint (to cut cost), however I later found that RunPod could give a better GPU for a fraction of the price, so I went with RunPod, which just took about $0.01 per request which is very cheap.

## What didn't work

This project have a lot of thing going on, lots of scrapped app design and so with the AI, the biggest factor for me is that we just don't have the data and access, I spent 2-3 weeks tuning SMPL to make sure that it could work, even tried a version with media pipe and a size estimator. The lack of data also makes the evaluation very hard to do, we tested it while doing unit testing and we got that 7/10 passed the test for the calculator. 

## What I'd do differently

Over all I think from the app side it could've been better if we create a contract / rules for the function ownership at the start. As for the AI a proper evaluation metrics would've been very helpful to plan improvement and to pitch the product.

---

## Repositories

**sam-3d-body-measurement** — the measurement estimator I built on top of SAM 3D
Body, including the body-part landmarks and circumference logic described above:
[github.com/ChronoStellar/sam-3d-body-measurement](https://github.com/ChronoStellar/sam-3d-body-measurement)

**3d-meassurement-pipeline** — the first iteration, VIBE + SMPL-Anthropometry:
[github.com/ChronoStellar/3d-meassurement-pipeline](https://github.com/ChronoStellar/3d-meassurement-pipeline)

## References

- **SMPL** (Skinned Multi-Person Linear model) — [smpl.is.tue.mpg.de](https://smpl.is.tue.mpg.de/)
- **VIBE** (Video Inference for Body Pose and Shape Estimation) — [github.com/mkocabas/VIBE](https://github.com/mkocabas/VIBE)
- **SMPL-Anthropometry** — the measurement logic my estimator mirrors: [github.com/DavidBoja/SMPL-Anthropometry](https://github.com/DavidBoja/SMPL-Anthropometry)
- **SAM 3D Body / MHR** (Momentum Human Rig) — [github.com/facebookresearch/sam-3d-body](https://github.com/facebookresearch/sam-3d-body)
- **RunPod** — serverless GPU hosting used in deployment: [runpod.io](https://www.runpod.io/)
