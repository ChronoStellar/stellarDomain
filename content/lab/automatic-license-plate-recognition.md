---
title: "Real-Time Automatic License Plate Recognition"
date: "2025-01-03"
status: "Proof of Concept"
tags: ["OCR", "Computer Vision", "ALPR", "Deep Learning", "TrOCR"]
summary: "Benchmarking traditional computer vision techniques against modern deep learning models for real-time Indonesian license plate recognition."
highlight: "TrOCR achieved an impressive 3.84% Character Error Rate, vastly outperforming traditional methods and a custom CRNN, though it suffered from longer inference times."
github: "https://github.com/ChronoStellar/Automatic-License-Plate-Recognition"
demo: "https://huggingface.co/spaces/ChronoStellar/Indonesian_ALPR_model_comparison"
---

## 1. Motivation

The goal of this project was to automate vehicle access at entrance gates using Optical Character Recognition (OCR) and machine learning. Relying purely on a security team can lead to inconsistencies, especially during late-night shifts. A reliable Automatic License Plate Recognition (ALPR) system would reduce friction at gates—where drivers often stop too far from the ticket machine and have to unbuckle or open their doors—while maintaining an organized audit log.

To build the OCR pipeline, we set out to benchmark traditional computer vision methods against modern deep learning approaches specifically for Indonesian license plates. 

## 2. Detection and Localization

Before feeding images into any OCR model, we needed to isolate the license plates. Passing full images into OCR models introduces too much noise.

![Car Original](/lab/automatic-license-plate-recognition/car-original.png)

We fine-tuned a **YOLOv8n** model to detect and localize license plates from raw urban camera feeds. By cropping the bounding boxes detected by YOLOv8, we ensured our downstream OCR models only processed the relevant plate areas.

![YOLO Detection](/lab/automatic-license-plate-recognition/yolo-detection.png)
![Car Cropped](/lab/automatic-license-plate-recognition/car-cropped.png)

## 3. OCR Models Evaluated

We tested four different approaches, ranging from basic algorithms to advanced transformer architectures.

### Template Matching (Baseline)
The simplest and most brute-force approach. We used OpenCV's `cv.matchTemplate()` to slide character templates (A-Z, 0-9) over the cropped license plate. 
- **The problem**: It lacked flexibility. It couldn't handle scale, rotation, or varied fonts. In our test set, it failed to get a single correct full plate prediction.

### Histogram of Gradients (HOG) + Logistic Regression
We extracted gradient magnitude and direction from the images using HOG, and passed those features into a Logistic Regression classifier with a SoftMax activation.
- **The problem**: While HOG was surprisingly good at recognizing individual letters, the pipeline relied on contour detection to find the bounding boxes of each letter. Skewed or rotated plates ruined the contouring. More importantly, it lacked a language model, leading to frequent confusion between similar letters and numbers.

![HOG Prediction](/lab/automatic-license-plate-recognition/hog-prediction.png)

### CRNN + CTC
We attempted a more modern approach using a Convolutional Recurrent Neural Network (CRNN) paired with Connectionist Temporal Classification (CTC) loss. We built this from scratch based on Keras-OCR, using a CNN feature extractor and Bi-LSTM layers.
- **The problem**: This model was incredibly difficult to train due to data scarcity. We experimented with a MobileNet backbone, but it didn't improve results much (likely because ImageNet weights are tailored for general object detection, not text). The model performed poorly on unseen data with different qualities, though it did start to learn the context and format of Indonesian plates (Alphabet-Number-Alphabet).

![CRNN Prediction](/lab/automatic-license-plate-recognition/crnn-prediction.png)

### TrOCR
Our final model was Microsoft's Transformer-based Optical Character Recognition (TrOCR). It uses a Vision Transformer (ViT) encoder and a RoBERTa-like text decoder.
- **The result**: TrOCR eliminated the need for a CNN backbone and external language models. By treating image patches as tokens and using self-attention, it captured global dependencies perfectly. It was far and away the best model, with the only downside being a slower inference time.

![TrOCR Prediction](/lab/automatic-license-plate-recognition/trocr-prediction.png)

## 4. Results & Metrics

We evaluated the models using Word Error Rate (WER) and Character Error Rate (CER).

| Method | Word Error Rate (WER) | Character Error Rate (CER) |
| --- | --- | --- |
| Template Matching | 100% | 75.82% |
| HOG + Logistic Regression | 84.0% | 26.77% |
| CRNN + CTC | 96.0% | 67.03% |
| **TrOCR** | **24.0%** | **3.84%** |

### Formulas used:

Word Error Rate (WER):
$$WER = \frac{S + D + I}{N}$$

Character Error Rate (CER):
$$CER = \frac{S + D + I}{C}$$

*(Where S = substitutions, D = deletions, I = insertions, N/C = total words/characters)*

## 5. Key Takeaways

1. **Data Quality is Paramount**: We noticed massive shifts in performance based on how we prepared the data. A dataset localized with YOLOv8 yielded much better CRNN and TrOCR results, whereas our custom augmented dataset worked better for the HOG model.
2. **Transformers shine for OCR**: TrOCR's ability to attend to both the visual features and the sequential text generation made it vastly superior to our custom CRNN and traditional methods. 
3. **Traditional methods are too rigid**: Template matching is practically useless for in-the-wild ALPR due to natural variations in angle, lighting, and plate fonts.

## 6. Future Improvements

- **Synthetic Data**: Generating custom synthetic data could help train a more robust CRNN.
- **Alignment Algorithms**: Implementing an alignment or deskewing algorithm before the OCR step would significantly help the traditional and HOG pipelines.
- **Optimization**: The TrOCR model is highly accurate but computationally heavy; exploring quantization or smaller transformer variants (like TrOCR-small) could help meet strict real-time constraints.
