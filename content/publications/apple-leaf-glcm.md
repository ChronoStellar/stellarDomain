---
title: "Comparative Analysis of Fungal Infections Classification in Apple Leaves Using CNN and CNN with GLCM Features"
date: "2024-08-01"
venue: "ICORIS"
url: ""
summary: "A negative result: adding Gray Level Co-occurrence Matrix texture features to a CNN cut apple-leaf disease classification accuracy from 82% to 49%, because grayscaling discards the colour that separates the classes."
---

<!-- TODO: add the ICORIS year and full conference name to `venue`, and paste the
     DOI or IEEE Xplore link into `url` once the paper is indexed. An empty url
     renders no link, so nothing breaks until then. -->

## The question

Around 85% of major plant diseases are caused by fungi, and apple crops are hit
by two in particular: cedar apple rust (*Gymnosporangium juniperi-virginianae*)
and powdery mildew (*Podosphaera leucotricha*). Both damage harvest quality, so
catching them early matters.

GLCM (Gray Level Co-occurrence Matrix) features describe image texture, and
prior work had paired them with CNNs to good effect in medical imaging — brain
tumour classification at 99.5%, lung tumours at 93.1%, glaucoma at 93.35%. Leaf
lesions are a texture problem too. So: does adding GLCM features to a CNN
improve fungal infection classification on apple leaves?

## Method

Two CNNs with identical architecture, differing only in input.

- **Standard CNN** — RGB input, shape (256, 256, 3)
- **GLCM-CNN** — grayscale input, shape (256, 256, 1), with energy, correlation,
  dissimilarity, homogeneity, and contrast extracted as features

Both use three Conv2D layers (32, 64, 50 filters, 3×3 kernels), each followed by
2×2 max pooling, then flatten and two dense layers of 100 neurons into a
3-neuron output.

The dataset came from Kaggle: 1,532 images across three classes — healthy,
powdery, and rust — split 1,322 train / 60 validation / 150 test, balanced per
class to avoid bias.

## Result

| Metric | CNN | GLCM+CNN |
| --- | --- | --- |
| **Accuracy** | **0.82** | **0.49** |
| F1-score (healthy) | 0.75 | 0.41 |
| F1-score (powdery) | 0.90 | 0.47 |
| F1-score (rust) | 0.81 | 0.55 |

Adding GLCM made the model substantially worse — not marginally, but close to
unusable. The standard CNN beat GLCM-CNN on precision, recall, and F1 for every
class.

The training curves show why it isn't noise. The standard CNN reaches near-100%
training accuracy with validation stabilising around 95%, and both losses
decline steadily. GLCM-CNN plateaus below 60% training accuracy with wildly
fluctuating validation accuracy and volatile losses — a model that cannot fit
its data, not one that overfits.

## Why it failed

The most defining feature separating these three classes is **colour**: rust
appears as reddish-brown spots, powdery mildew as a white-grey coating, healthy
leaves as green. The GLCM pipeline grayscales every image before extracting
texture, which throws that signal away. What remains is a similar texture
profile across all three classes, so the model has little left to separate them
on, and it underfits.

The conclusion is narrow and worth stating plainly: GLCM-CNN is not recommended
where colour carries the class signal. This matches [17], which found CNN
outperformed GLCM-CNN on herbal leaf classification, and stands against the
medical-imaging results — where inputs are often grayscale to begin with, so
GLCM discards nothing.

## What I'd note in hindsight

A colour-preserving texture feature, or GLCM computed per colour channel rather
than on a grayscaled image, would test the texture hypothesis without destroying
the colour signal. As run, the experiment can't separate "texture features don't
help here" from "grayscaling hurts here" — the two are confounded.
