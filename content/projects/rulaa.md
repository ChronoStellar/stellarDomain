---
title: "Rulaa: Real-Time Object Detection"
date: "2024-03-15"
tags: ["Python", "Core ML", "Computer Vision"]
summary: "An edge-deployed machine learning application that provides real-time object detection and spatial tracking on iOS devices."
coverImage: "/images/projects/rulaa.jpg"
---

# Real-Time Spatial Analysis

Rulaa bridges the gap between complex machine learning models and intuitive user interfaces. By optimizing PyTorch models and converting them to Core ML, we achieved 60fps inference on mobile devices with minimal battery drain.

## Key Technical Challenges

- **Model Quantization:** Reduced the model size by 75% without significant accuracy loss.
- **Hardware Acceleration:** Utilized the Apple Neural Engine to offload computations from the main CPU.
- **Data Pipeline:** Built a custom data ingestion and training pipeline using FastAPI and PostgreSQL to continually improve model accuracy based on edge-case feedback.

## The Result

The final application delivers seamless, augmented reality object detection, allowing users to interact with their environment in entirely new ways.
