---
title: "JKTDrive Benchmark"
date: "2024-07-15"
tags: ["Autonomous Driving", "Vision-Language Models", "Benchmark", "Python"]
summary: "A benchmarking repository designed to assess the real-world driving perception and reasoning capabilities of VLMs in chaotic urban traffic environments."
pinned: true
coverImage: "https://github.com/user-attachments/assets/bda86984-a5d8-4390-a01e-b4cab0ad5c6d"
---

<img width="838" height="493" alt="image" src="https://github.com/user-attachments/assets/bda86984-a5d8-4390-a01e-b4cab0ad5c6d" />

<b>Autonomous Driving Large Vision-Language Models Benchmark Evaluation. </b>

<b>JKTDrive</b> is a <b>benchmarking</b> and <b>evaluation</b> repository designed to assess the real-world driving perception and reasoning capabilities of Vision–Language Models (VLMs) in Jakarta’s urban traffic environment based on Multiple-Choice Question Answer.
Unlike standard autonomous driving benchmarks that focus on structured, Western-centric road conditions, JKTDrive targets dense, chaotic, and culturally unique traffic scenarios commonly found in Jakarta—including motorcycles weaving through lanes, informal traffic rules, roadside vendors, and ambiguous road markings.

This repository also includes evaluation of both open-source and commercial VLMs using a circular evaluation technique on the custom JKTDrive Dataset.

<a href="https://www.arxiv.org/abs/2407.11691">📝 Research Paper </a> •
<a href="https://discord.gg/evDT4GZmxN"> 📜 License</a>

<a href="#-the-goal-of-vlmevalkit">🎯Section 1</a> •
<a href="#%EF%B8%8F-citation">🖊️Citation </a>

## 📊 Evaluation Result
The evaluation compares five Vision-Language Models across Perception Reasoning, Safety Compliance, and Urban Flow Complexity. GPT-5 achieved the highest overall accuracy (86.90%), followed closely by InternVL2.5 (86.45%). Among open-source models, InternVL2.5 showed the strongest overall performance.

Model performance varies by category. GPT-5 performed best in Perception Reasoning, while InternVL2.5 achieved the highest accuracy in both Safety Compliance and Urban Flow Complexity, indicating strong robustness in complex urban driving scenarios.

## 📂 Dataset & Models
### 🖼️ Dataset
All images are captured from a forward - facing viewpoint that simulates an Autonomous Vehicle (AV) camera.
- <b>Domain:</b>  Autonomous Driving & Vision - Language Reasoning
- <b>Data Type:</b>  Real - world traffic scene images
- <b>Total Images:</b>  273
- <b>Annotation Type:</b>  Human - annotated multiple - choice QA (MCQA)
- <b>Location:</b>  Jakarta, Indonesia

<img width="4096" height="2048" alt="JKTDriveCornerCasesCategories" src="https://github.com/user-attachments/assets/5e2b599d-ac31-40ec-b5ef-32f4c04e723f" />


JKTDrive is organized into several high-level categories, each representing a key reasoning capability required for autonomous driving in urban environments. 
- `Navigation and Planning`: Scenarios that require understanding road layout, intersections, lane usage, and planning safe driving actions based on traffic rules
  - Navigation Decision Making (NDM)
  - Lane Recognition (LRE)   
- `Spatial Reasoning`: Cases that involve interpreting spatial constraints such as narrow roads, one-way streets, and limited maneuvering space.
  - Unidirectional Traffic (UTR)
  - Narrow Roadway (NRO)
- `Dynamic Agent Behaviour`: Situations involving moving agents such as vehicles and vulnerable road users, including cut-in events and evasive maneuvering.
  - Evasive Maneuver Planning (UMP)
  - VRU Cut-In (VRU)
  - Vehicle Cut-In (VCI)
  - Vehicle Recognition (VRE)
- `Obstacles and Blockage`: Scenarios where driving is affected by static or temporary obstacles, including blocked lanes, parking situations, and roadway obstructions.
  - Obstacles Recognition (ORE)
  - Long Short Parking (LSP)
- `Environmental Conditions`: Cases that capture degraded or suboptimal road and environmental conditions, such as poor road quality or reduced visibility.
  - Inadequate Road Condition (IRC)
- `Road Infrastructure and Signage`: Scenarios focused on understanding traffic signals, road signs, and structured traffic guidance that govern lawful driving behavior.
  - Trajectory Planning Signs (TPS)
  - Traffic Signal Recognition (TSR)
  - Road Signs Recognition (RSR)

### 🤖 Models
JKTDrive benchmarks a diverse set of <b>Vision-Language Models (VLMs)</b>, including both <b>commercial</b> and <b>open-source models</b>, to provide a comprehensive comparison of performance across different model families and training paradigms.
The evaluated models include:
- Commercial Models
    - GPT-5
- Open-Source Models
    - InternVL2.5
    - LLaVA-1.5
    - Qwen-2.5-VL
    - Ovis-1.6-Gemma2

All models are evaluated under the same multiple-choice question answering (MCQA) setting, using identical prompts and response constraints to ensure a fair and consistent comparison. The evaluation focuses on each model’s ability to understand visual scenes, perform reasoning, and select the correct answer based on the given options.

## ⚒️ What is in this repository:
## Dataset 
This directory contains the image and annotation of JKTDrive dataset
```bash
Dataset/
├── UrbanFlowComplexity/
│   ├── EvasiveManeuverPlanning/
│   │   ├── EMP01.png
│   │   ├──  ...
│   ├── VRUCut-In/
│   ├── VehicleCut-In/
│   └── VehicleRecognition/
├── PerceptionReasoning/
│   ├── NarrowRoadway/
│   ├── UnidirectionalTraffic/
│   ├── LaneRecognition/
│   └── NavigationDecisionMaking/
├── SafetyCompliance/
│   ├── ObstacleRecognition/
│   ├── LongShortParking/
│   ├── InadequateRoadConditions/
│   ├── TrajectoryPlanningSigns/
│   ├── TrafficSignalRecognition/
│   └── RoadSignsRecognition/
└── annotation.json
```
In annotation.json the MCQA data format can be seen as followed: 
```json
{
    "EMP01.png": {
        "path": "UrbanFlowComplexity/EvasiveManeuverPlanning/EMP01.png",
        "category": "UrbanFlowComplexity/EvasiveManeuverPlanning",
        "question": "In this complex traffic scenario, what immediate hazard or condition should the autonomous vehicle prioritize in its evasive maneuver planning?",
        "answers": "The potential for unpredictable movements from the blurry motorcycle.",
        "distractor1": "The stationary vehicles parked on the side of the road.",
        "distractor2": "The need to maintain a high speed to keep up with the flow of traffic.",
        "distractor3": "The clear and open lane to the far left as a potential escape route."
    }
}
```

## Result 
This directory contains the raw result of VLMevalkit with circular evaluation and the summary of each models' performance.
```bash
Result/
├── GPT5/
│   ├── GPT_5_circular_perception_reasoning_group_results.csv
│   ├── GPT_5_circular_safety_compliance_group_results.csv
│   ├── GPT_5_circular_urban_flow_complexity_group_results.csv
│   └── summary_results.csv
├── InternVL2_5_8B/
│   ├── InternVL2_5-8B_circular_PR_group_results.csv
│   ├── InternVL2_5-8B_circular_SC_group_results.csv
│   ├── InternVL2_5-8B_circular_UC_group_results.csv
│   └── summary_results.csv
├── LLaVA_v1_5_7B/
│   ├── LLaVA_v1_5_7B_Custom_circular_PR_group_results.csv
│   ├── LLaVA_v1_5_7B_Custom_circular_SC_group_results.csv
│   ├── LLaVA_v1_5_7B_Custom_circular_UC_group_results.csv
│   └── summary_results.csv
├── Ovis1.6-Gemma2_9B/
│   ├── ovis1_6_gemma2_9b_circular_PR_group_results.csv
│   ├── ovis1_6_gemma2_9b_circular_SC_group_results.csv
│   ├── ovis1_6_gemma2_9b_circular_UC_group_results.csv
│   └── summary_results.csv
├── Qwen2_5_VL_7B/
│   ├── Qwen2_5_VL_7B_circular_PR_group_results.csv
│   ├── Qwen2_5_VL_7B_circular_SC_group_results.csv
│   ├── Qwen2_5_VL_7B_circular_UC_group_results.csv
│   └── summary_results.csv
└── getAccuracy.py (to get the summary)
```
## Utils
- CreateFolders.py, containins dataset's folder structure and create those folder
- JSON2TSV.ipynb, encodes image to base64 and convert the VQA dataset into .tsv format
- JSONReformater.py, reformat the raw path and answer json into mcqa format
- QAPairLabelingTools.py, gradio tools to view the mcqa dataset
- Reformat4CircularEval.ipynb, copy each QA pairs to rotate the multiple choices 4 times
- RenameFiles.py, abriviates the files into Ids e.g. EMP01
- XLSX2JSON.py, normalize files into json format

## 🖊️ Citation
If you find this work helpful, please consider to **star🌟** this repo. Thanks for your support!
[![Stargazers repo roster for @open-compass/VLMEvalKit](https://reporoster.com/stars/ChronoStellar/JktDriveVLM)](https://github.com/ChronoStellar/JktDriveVLM/stargazers)

You are welcome to use or modify JKTDrive Dataset or scripts in your research, please use the following BibTeX entry.

```bib
TBD
```
