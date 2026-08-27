---
title: "Turning scanned floor plans into AR geometry"
date: 2026-05-22
tags: ["computer vision", "opencv", "python", "swift", "3d", "arkit"]
summary: "End-to-end pipeline from raster to 3D scan and a furniture (chair) 3D model generator: a study case"
coverImage: "/projects/floorplan-to-ar/floorplan_hero.png"
---

## The problem

Right so, truthfully not really a problem but one day my team and I got curious 'how does 3D GAN works' or rather what can we learn about *novel view synthesis*, then we just dig deeper on what actually this technology is used on, which turns out one of them is architecture/furniture. Cool, yeah so how can we apply our interest there? If we just make a furniture generator, that might help a business but for our learning the goal is different. So might as well make the room the furniture will be placed on and here we are.

We found a LOT of algorithms like 3D Gaussian Splatting, 3D GAN, 3D Diffusion, and so on so we just want to learn that basically.

## Key learnings and technical outcomes

- **Scope beats complex models**. Constraining inputs and edge cases solves more problems than adding heavier AI.
- **Topology from skeletonisation**. Thinning walls to a 1px skeleton and counting pixel neighbors extracts endpoints, junctions, and bends via four simple convolutions—no dedicated corner detector needed.
- **Edge extraction via multi-source BFS**. Seeding simultaneous flood fills from every corner recovers wall segments and geodesic lengths in a single pass.
- **Fast on-device inference**. A 2,562-vertex mesh runs in ~109 ms on CPU (onnxruntime), proving real-time on-device iOS viability.
- **Heavy preprocessing with openCV isn't that eacy to replicate on device.**

## Key considerations and trade-offs

- **Pixels, not metres.** Every coordinate in the output JSON is in croppedimage space. There is no scale inference so the AR app renders a floor plan with correct proportions and arbitrary absolute size.
- **Classical for walls, learned for doors.** Walls are geometric and consistent enough for morphology. Door symbols are drawn conventions that vary by draughtsman, which is a recognition problem, so YOLO handles those.
- **Single-storey, axis-agnostic.** The pipeline handles one plan image at a time. Multi-floor stacking, which the vendored `FloorplanToBlender3d` reference implementation does support, is out of scope here.
- **A DAG, not a general graph.** The wall graph is converted to a directed acyclic graph via a DFS spanning forest for downstream traversal. This has a cost, covered in the Results section.
- **Minimum 640×640 input**, below that, skeletonisation of scanned line work produces graphs that aren't worth returning.
- **No ground truth.** I never built an annotated evaluation set, so there are no precision/recall numbers in this project. What I have instead is internal consistency measurement across the corpus, which is weaker.

## Why skeletonizing instead of segmenting

The default move in 2026 is to train a U-Net to segment walls, then vectorise the mask. I went the other way.

A segmentation model gives you a probability map. To get a graph out of it you still have to threshold, skeletonise, find corners, and trace edges. Every step of the classical pipeline is still there, just downstream of a network that needs annotated **training data I didn't have**. So I figured classic cv might be a fun way to do it.

Skeletonisation also produces topology that's correct *by construction*. If two walls meet, their skeletons meet, and the junction is a pixel with three neighbours. There's no post-hoc "are these two mask regions connected" heuristic because connectivity is preserved by the skeleton. The corner classifier is four `cv2.filter2D` calls and the edge finder is a BFS. That entire stage is about 200 lines with no weights, no training data, and no GPU (though more deterministic).

The cost is that it inherits every artefact of the binarisation. A scan with a coffee stain gets a skeleton branch. This is why so much of the code is cleanup — `_prune_spurs` iteratively strips 1-neighbour pixels for up to 20 iterations, `_suppress_neighbors` does NMS on corners within a 15px radius, `_straighten_graph` snaps near-collinear nodes within 20px to a shared coordinate to kill staircase artefacts, and `_filter_small_components` drops components with fewer than 3 edges. Four cleanup passes for one detection pass.

The upside is that when the graph is wrong I can look at the skeleton overlay and see which morphological step did it, which is easier than debugging a mask that's subtly wrong in one corner. Also like time constraint dude I need to work on the 3D furniture too.

## How the pipeline works

![pipeline process](/projects/floorplan-to-ar/floorplan_map.png)

Six stages, image in, JSON out.

| Stage | Implementation | Output |
| --- | --- | --- |
| 1. Text removal | EasyOCR at 4 rotations, boxes filled and dilated 15px, erased to white | BGR, text-free |
| 2. Binarisation | Grayscale → Gaussian blur (k=5) → Otsu inverse threshold | binary |
| 3. Crop & pad | `findNonZero` bbox + 100px padding | cropped binary + `crop_bbox` |
| 4. Wall graph | skeletonize → prune → topology corners → NMS → BFS edges | `networkx.Graph` |
| 5. Openings | YOLO on the colour image, then template matching on wall gaps | detection list |
| 6. Fusion & export | attach openings to bounding corners, merge collinear walls | JSON |

Stage 1 does double duty. Because EasyOCR runs at 0°, 90°, 180° and 270° and the pipeline keeps the angle with the most detections, text removal also recovers the plan's upright orientation as a side effect. The masks from all four angles are OR-ed together before erasing, so text is removed regardless of which rotation found it.

Stage 4 is the core. After `skimage.morphology.skeletonize`, `_prune_spurs` removes dangling tips, then corners are classified by neighbour count. `_bfs_edges` seeds a queue with every corner, floods along skeleton pixels, and when two differently-labelled fronts collide it records an edge whose length is `dist[a] + dist[b] + 1` — the geodesic path length through the actual wall, not the Euclidean distance between endpoints. Keeping the shortest collision per pair handles the case where two corners are connected by more than one route.

### Fusing openings onto walls

This is the part that makes the output useful to a renderer rather than just descriptive, and it's where most of the fiddly logic lives.

An opening is detected as a bounding box, but what a renderer needs is "on which wall, how far along, how wide". `_gap_corners` searches within `SNAP_PX` (40px) of the expanded detection box for the two graph corners that bound the gap — prioritising degree-1 nodes, since a wall that terminates at a doorway ends in an endpoint. It then requires the second corner to be on the *opposite* side of the opening centre from the first, tested with a dot product, so the pair actually spans the gap instead of both sitting on one side.

Then `graph_to_json` merges the wall segments on either side of the opening back into a single span, but only when they're genuinely collinear — the direction score has to exceed 0.85, roughly 32°. Each opening is projected onto that merged wall to produce `offset` and `width` along the wall direction, clamped to the wall length. The result is the schema the iOS app consumes:

```json
{
  "walls":    [{"id": "wall_1", "start": {"x": 285, "y": 996}, "end": {"x": 285, "y": 1406}}],
  "openings": [{"id": "opening_1", "wallId": "wall_1", "offset": 40.0, "width": 82.0, "type": "door"}]
}
```

It's important to note that finding where the doors are and windows are a complicated process on it's own, for door I used Yolov26 with a floorplan-door data in roboflow, for the window we used gap detection with classic cv. None of these two were a perfect model but suffice to use.

### The furniture

Now this is the interesting part, initially we wanted to use 3D gan for the room and furniture but after some thought, that's like impossible and unreliable, cause of model hallucination and such, SO we had to scrap that idea. The next idea is, what if we have a 3d cube or some other shape and then the model will autoregressively *deforms* them to a reference image. This is where I got the idea to test 2 model Atlas Net and pix2mesh, which we trained on PIX3D dataset, though there are better datasets. 

![chairs](/projects/floorplan-to-ar/floorplan_chair2.png)

AtlasNet treats the deformation in a parametric manner, what id we have blobs in x,y,z and then we regressively predict the shape of a chair from the reference image. This COULD create a chair-esque object but alas it looks too deformed, though it could create hollow object really well, it just needs more training data, glob points, and better renderer.

Pix2Mesh we ported to IPad successfully it is a 3D graph convolution model, so we treat an initial sphere as a graph so each movement in a node will affect others. This create an actually good looking chair, but it have no texture and struggle to create openings (since the model is basically carving from a sphere an actually opening/chair legs will need a lot more voxels). This model shows a lot of promise to develop further so we take this one.

However a textureless model is kinda bland so we also tried a much newer and heavier model, *TripoSR*. Though this one is almost plug and play and we host it on an endpoint.
![chair](/projects/floorplan-to-ar/floorplan_chair.png)

### The iOS side

The app (~3,300 lines of Swift) posts a JPEG to `/process-floorplan`, decodes the response into `Codable` DTOs, and builds a RealityKit entity graph:
`SemanticArchitectureBuilder` turns wall segments into geometry,
`ProceduralGeometryBuilder` extrudes them, and `WallStylingManager` reacts to
Combine publishers so material changes propagate without a scene rebuild.
Openings become gaps in the extruded wall using exactly the `offset`/`width`
values from the JSON.

Furniture arrives two ways: bundled `.usdz` assets, and meshes generated from a photo. That second path is the Pixel2Mesh model with DINOv2 ViT-S/14 (frozen) with
a 4-level FPN feeding three coarse-to-fine graph-convolution stages that deform an icosphere from 162 → 642 → 2,562 vertices. `Pix2MeshRunner.swift` runs it on-device through onnxruntime, unrolling the 2,562 indexed vertices into 15,360 per-face vertices with flat normals for RealityKit.

## How the evaluation was done

**There is no ground truth in this project, so there is no accuracy number anywhere in this article.** I never annotated a set of plans with correct wall graphs, so every "is this right?" judgement during development was me looking at an overlay image and deciding it looked right.

What I could do without labels is measure the pipeline's *internal consistency* across the corpus — specifically, look for places where a later stage destroys information an earlier stage produced. That's a weaker claim than accuracy, but if stage N+1 emits less than stage N, that's a defect regardless of whether stage N was correct.

So I ran all 90 plans through to the wall-graph stage, saved both the undirected graph (`walls_json/`) and the DAG (`walls_dag_json/`), and compared them edge for edge. The DAG export records `edges_dropped` and `is_dag` per plan, which let me cross-check my own differencing against the pipeline's self-report. Those two numbers agree on all 90 plans.

## Results

The pipeline completes on **90 of 90 plans** with no failures and no empty graphs, producing a total of 7,216 corner nodes and 6,164 undirected wall edges.

| Metric | Min | Median | Mean | Max |
| --- | --- | --- | --- | --- |
| Nodes per plan | 29 | 78.5 | 80.2 | 192 |
| Edges per plan (DAG) | 20 | 63 | 65.2 | 163 |
| Edges dropped by DAG | 0 | 1 | 3.26 | 35 |

**The DAG conversion silently discards 293 of 6,164 wall edges — 4.8% of the corpus — and 52 of the 90 plans (58%) lose at least one wall.** On the worst plan, `Ib_CT0601_sommaire`, 35 of 164 edges vanish: 21% of that building's walls are simply not in the exported geometry.

| Plan | Undirected edges | DAG edges | Lost |
| --- | --- | --- | --- |
| `Ib_CT0601_sommaire` | 164 | 129 | 21% |
| `Ic_JN0702_sommaire` | 98 | 83 | 15% |
| `Ia_TD0801_sommaire` | 135 | 115 | 15% |
| `IIa_TD0810` | 135 | 116 | 14% |
| `IIc_RE0701` | 95 | 82 | 14% |

The cause is straightforward. `_build_dag` builds a DFS spanning forest, and a spanning tree by definition contains no cycles. Every closed loop in a floor plan — which is to say, every room — loses exactly one wall when it becomes a
tree. The 4.8% figure is therefore approximately a count of independent cycles in the wall graph, and the plans that lose the most are the ones with the most enclosed rooms. `is_dag` is `True` for all 90 plans, so the code does exactly
what it was written to do; it's the wrong thing to want.

On the 3D side, the shipped chair model reached **epoch 22 of a configured 100** (`best.pt` records epoch 22, `last.pt` epoch 23). Training was stopped at roughly a quarter of the schedule, so the cosine annealing never completed and
the model never saw its final low-LR phase. It has 41.4M parameters, of which the DINOv2 backbone is frozen. Exported to ONNX it runs in **109 ms on CPU** (mean of 10 runs, min 107, max 113) for the full three-stage forward pass to 2,562 vertices. It looks okay so there's that.

## What didn't work

- **DAG conversion broke some room cycles**. Converting the wall graph to a DFS spanning forest deleted cycles—causing up to a 21% loss in wall edges per plan. Fixed by preserving the undirected graph format and resolving traversal orders at consumption time.

- **Unevaluated opening pipeline**. Complex heuristics (gap-corner search, dot-product tests, collinear merging) relied purely on visual spot-checks because automated batch validation was never extended past stage 4.

- **Under-trained chair model**. Training stopped at epoch 22 of 100 before the cosine learning rate annealed, yet the intermediate checkpoint was shipped since visual outputs were passable.

- **Pixel2Mesh v2 design flaws**. Previous iterations suffered from LR mismatch (under-trained FPN), redundant double dropout, border-clamping feature artifacts, deterministic RNG leakage, and checkpointing on total loss instead of stage-3 Chamfer distance.

- **Distilling from TripoSR**. We tried distilling but the result is not that good so the trained model is bad as well, maybe the result could better if we used SAM-3D as the base teacher model.

---
![poster](/projects/floorplan-to-ar/floorplan_poster.png)

**Repository:** private for now
