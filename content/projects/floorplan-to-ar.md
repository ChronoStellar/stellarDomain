---
title: "Turning scanned floor plans into AR geometry"
date: 2026-05-22
tags: ["computer vision", "opencv", "python", "swift", "3d", "arkit"]
summary: "I built a classical CV pipeline that converts scanned architectural floor plans into a structured wall-and-opening graph, plus an iOS app that renders it in AR. It runs end to end on 90 real plans, but the DAG export silently drops 4.8% of wall edges and the shipped door detector has no window class at all — every window in the output comes from template matching."
coverImage: "/projects/floorplan-to-ar/floorplan_hero.png"
---

## The problem

Every tool I found for getting a floor plan into 3D wants a floor plan that
was born digital. Give it a clean vector file with a layer named `WALLS` and it
will do an excellent job. Give it a photograph of a printed plan — the actual
artefact that exists for most buildings, especially older ones — and it either
refuses or produces confident nonsense.

The plans I had were the second kind. They were scans: French and Italian
labels, dimension strings, hatching, room names printed across the walls
themselves. The interesting question wasn't "can a model segment walls" — plenty
can. It was whether you could get from a scan to something *structured* enough
that a renderer could consume it: not a wall mask, but a graph with wall
segments that have endpoints, and openings that know which wall they belong to
and how far along it they sit. A mask tells you where ink is. A renderer needs
to know that `wall_7` runs from (285, 996) to (285, 1406) and has a door 40
pixels in.

The honest second motivation: this was coursework, and I wanted to see how far
purely classical CV could go before I reached for a learned model. There's a
prevailing assumption that you segment walls with a network now. I wanted to
find out what the skeleton-and-graph approach actually costs you, because if it
works it has properties a segmentation model doesn't — it produces topology by
construction, not as a post-process.

What I built is a Python pipeline (`preprocessing.py` → `pipeline.py` →
`window_detect.py`) that takes a floor plan image and returns JSON describing
walls and openings, wrapped in a FastAPI endpoint, plus a SwiftUI/RealityKit iOS
app that consumes that JSON and builds an AR scene you can walk through and
place furniture in. The wall detection is entirely classical — no learned model
touches the walls. Only the door detection is a neural network.

## Key learnings and technical outcomes

- **Skeletonisation gives you topology for free.** By reducing walls to a 1px
  skeleton and classifying pixels by neighbour count — 1 neighbour is an
  endpoint, ≥3 is a junction, 2 non-collinear is a bend — corners fall out of
  the morphology instead of needing a corner detector. `_detect_corners_topology`
  in `pipeline.py` does this in four convolutions.
- **Multi-source BFS is the right way to find graph edges on a skeleton.**
  Seeding a flood fill from every corner simultaneously and recording collisions
  between differently-labelled regions recovers wall segments *and* their
  geodesic lengths in one pass over the image.
- **The pipeline runs end to end on 90 real scanned plans**, producing 7,216
  corner nodes and 5,871 wall edges — a median of 78.5 nodes and 63 edges per
  plan, ranging from 29 nodes on the simplest to 192 on the most complex.
- **OCR is a preprocessing step, not a feature.** Running EasyOCR at four
  rotations and erasing every detected text box was the single change that made
  skeletonisation viable — text strokes skeletonise into dense spurious graphs
  that swamp the real walls.
- **A 2,562-vertex mesh runs in 109 ms on a laptop CPU** through onnxruntime
  (measured, mean of 10 runs), which is what made an on-device iOS path
  plausible at all.
- **The API contract is enforced on both ends.** Pydantic `model_config =
  ConfigDict(extra="forbid")` on the Python side, `Codable` DTOs on the Swift
  side, with `FloorPlanDTOError.missingWall` thrown if an opening references a
  wall ID that isn't in the payload.

## Key considerations and trade-offs

- **Pixels, not metres.** Every coordinate in the output JSON is in cropped
  image space. There is no scale inference — no attempt to read dimension
  strings or detect a scale bar. The AR app therefore renders a floor plan with
  correct proportions and arbitrary absolute size.
- **Classical for walls, learned for doors.** Walls are geometric and
  consistent enough for morphology. Door symbols are drawn conventions that
  vary by draughtsman, which is a recognition problem, so YOLO handles those.
- **Single-storey, axis-agnostic.** The pipeline handles one plan image at a
  time. Multi-floor stacking, which the vendored `FloorplanToBlender3d`
  reference implementation does support, is out of scope here.
- **A DAG, not a general graph.** The wall graph is converted to a directed
  acyclic graph via a DFS spanning forest for downstream traversal. This is a
  real decision with a real cost, and it's the subject of the Results section.
- **Minimum 640×640 input**, rejected with HTTP 422 in `app.py`. Below that,
  skeletonisation of scanned line work produces graphs that aren't worth
  returning.
- **No ground truth.** I never built an annotated evaluation set, so there are
  no precision/recall numbers anywhere in this project. What I have instead is
  internal consistency measurement across the corpus, which is weaker, and I say
  so plainly below.

## Why I skeletonised instead of segmenting

The default move in 2026 is to train a U-Net to segment walls, then vectorise
the mask. I went the other way, and it's the choice most worth defending.

A segmentation model gives you a probability map. To get a graph out of it you
still have to threshold, skeletonise, find corners, and trace edges — every step
of the classical pipeline is still there, just downstream of a network that
needs annotated training data I didn't have. Segmentation moves the hard part; it
doesn't remove it. The topology extraction is the actual problem, and it's the
part I'd have to build either way.

Skeletonisation also produces topology that's correct *by construction*. If two
walls meet, their skeletons meet, and the junction is a pixel with three
neighbours. There's no post-hoc "are these two mask regions connected" heuristic
because connectivity is preserved by the skeleton. The corner classifier is four
`cv2.filter2D` calls and the edge finder is a BFS. That entire stage is about
200 lines with no weights, no training data, and no GPU.

The cost is that it's brittle in a specific, characterisable way: it inherits
every artefact of the binarisation. A scan with a coffee stain gets a skeleton
branch. This is why so much of the code is cleanup — `_prune_spurs` iteratively
strips 1-neighbour pixels for up to 20 iterations, `_suppress_neighbors` does
NMS on corners within a 15px radius, `_straighten_graph` snaps near-collinear
nodes within 20px to a shared coordinate to kill staircase artefacts, and
`_filter_small_components` drops components with fewer than 3 edges. Four
cleanup passes for one detection pass. That ratio is the honest price of the
classical approach, and it's roughly what the git history shows too:
`pipeline.py` was rewritten across 7 of the 46 commits, more than any other
source file.

I still think it was the right call for this project, mostly because it fails
*legibly*. When the graph is wrong I can look at the skeleton overlay and see
exactly which morphological step did it. I've debugged enough segmentation
models to know that "the mask is subtly wrong in the top left" is a much worse
place to start.

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

Stage 1 does double duty. Because EasyOCR runs at 0°, 90°, 180° and 270° and
the pipeline keeps the angle with the most detections, text removal also
recovers the plan's upright orientation as a side effect. The masks from all
four angles are OR-ed together before erasing, so text is removed regardless of
which rotation found it.

Stage 4 is the core. After `skimage.morphology.skeletonize`, `_prune_spurs`
removes dangling tips, then corners are classified by neighbour count.
`_bfs_edges` seeds a queue with every corner, floods along skeleton pixels, and
when two differently-labelled fronts collide it records an edge whose length is
`dist[a] + dist[b] + 1` — the geodesic path length through the actual wall, not
the Euclidean distance between endpoints. Keeping the shortest collision per
pair handles the case where two corners are connected by more than one route.

### Fusing openings onto walls

This is the part that makes the output useful to a renderer rather than just
descriptive, and it's where most of the fiddly logic lives.

An opening is detected as a bounding box, but what a renderer needs is "on
which wall, how far along, how wide". `_gap_corners` searches within `SNAP_PX`
(40px) of the expanded detection box for the two graph corners that bound the
gap — prioritising degree-1 nodes, since a wall that terminates at a doorway
ends in an endpoint. It then requires the second corner to be on the *opposite*
side of the opening centre from the first, tested with a dot product, so the
pair actually spans the gap instead of both sitting on one side.

Then `graph_to_json` merges the wall segments on either side of the opening back
into a single span, but only when they're genuinely collinear — the direction
score has to exceed 0.85, roughly 32°. Each opening is projected onto that
merged wall to produce `offset` and `width` along the wall direction, clamped to
the wall length. The result is the schema the iOS app consumes:

```json
{
  "walls":    [{"id": "wall_1", "start": {"x": 285, "y": 996}, "end": {"x": 285, "y": 1406}}],
  "openings": [{"id": "opening_1", "wallId": "wall_1", "offset": 40.0, "width": 82.0, "type": "door"}]
}
```

### The iOS side

The app (~3,300 lines of Swift) posts a JPEG to `/process-floorplan`, decodes
the response into `Codable` DTOs, and builds a RealityKit entity graph:
`SemanticArchitectureBuilder` turns wall segments into geometry,
`ProceduralGeometryBuilder` extrudes them, and `WallStylingManager` reacts to
Combine publishers so material changes propagate without a scene rebuild.
Openings become gaps in the extruded wall using exactly the `offset`/`width`
values from the JSON.

Furniture arrives two ways: bundled `.usdz` assets, and meshes generated from a
photo. That second path is the Pixel2Mesh model — DINOv2 ViT-S/14 (frozen) with
a 4-level FPN feeding three coarse-to-fine graph-convolution stages that deform
an icosphere from 162 → 642 → 2,562 vertices. `Pix2MeshRunner.swift` runs it
on-device through onnxruntime, unrolling the 2,562 indexed vertices into 15,360
per-face vertices with flat normals for RealityKit.

## How I tried to make the evaluation honest

I have to be direct about this: **there is no ground truth in this project, so
there is no accuracy number anywhere in this article.** I never annotated a set
of plans with correct wall graphs. Every "is this right?" judgement I made
during development was me looking at an overlay image and deciding it looked
right, which is exactly the kind of evaluation that flatters the developer.

What I could do without labels is measure the pipeline's *internal consistency*
across the whole corpus, and specifically look for places where a later stage
destroys information an earlier stage produced. That's a weaker claim than
accuracy, but it has one useful property: it can produce a negative result about
my own code, which a visual check basically cannot. If stage N+1 emits less than
stage N, that's a defect regardless of whether stage N was correct.

So I ran all 90 plans through to the wall-graph stage, saved both the
undirected graph (`walls_json/`) and the DAG (`walls_dag_json/`), and compared
them edge for edge. The DAG export happens to record `edges_dropped` and
`is_dag` per plan, which let me cross-check my own differencing against the
pipeline's self-report. Those two numbers agree on all 90 plans, which at least
means the measurement itself isn't lying.

That comparison is what the Results section is about, and it is not flattering.

## Results

The pipeline completes on **90 of 90 plans** with no failures and no empty
graphs, producing a total of 7,216 corner nodes and 6,164 undirected wall edges.

| Metric | Min | Median | Mean | Max |
| --- | --- | --- | --- | --- |
| Nodes per plan | 29 | 78.5 | 80.2 | 192 |
| Edges per plan (DAG) | 20 | 63 | 65.2 | 163 |
| Edges dropped by DAG | 0 | 1 | 3.26 | 35 |

**The DAG conversion silently discards 293 of 6,164 wall edges — 4.8% of the
corpus — and 52 of the 90 plans (58%) lose at least one wall.** On the worst
plan, `Ib_CT0601_sommaire`, 35 of 164 edges vanish: 21% of that building's walls
are simply not in the exported geometry.

| Plan | Undirected edges | DAG edges | Lost |
| --- | --- | --- | --- |
| `Ib_CT0601_sommaire` | 164 | 129 | 21% |
| `Ic_JN0702_sommaire` | 98 | 83 | 15% |
| `Ia_TD0801_sommaire` | 135 | 115 | 15% |
| `IIa_TD0810` | 135 | 116 | 14% |
| `IIc_RE0701` | 95 | 82 | 14% |

The cause is not subtle once you look at it. `_build_dag` builds a DFS spanning
forest, and a spanning tree by definition contains no cycles. Every closed loop
in a floor plan — which is to say, every room — loses exactly one wall when it
becomes a tree. The 4.8% figure is therefore approximately a count of
independent cycles in the wall graph, and the plans that lose the most are the
ones with the most enclosed rooms. `is_dag` is `True` for all 90 plans, so the
code is doing precisely what it was written to do. It was written to do the
wrong thing.

This is the interpretation I'd defend: the DAG was introduced for traversal
convenience — the git history has `feat: implemented DAG traversal` right after
`feat: implemented graph BFS to find interconnected coordinate` — and nobody
asked whether the geometry survived it. A spanning tree is a reasonable
structure for *walking* a graph and a catastrophic one for *representing* a
building, because rooms are cycles. Fortunately the loss is confined to the
`walls_dag_json` export; `run_pipeline` and the API return the undirected graph,
so the shipped endpoint is unaffected. But every DAG artefact in `data/PNG/` is
missing walls.

The second result is about openings, and it's a documentation failure rather
than a code one. Both shipped YOLO checkpoints, `best_v2.pt` and `best_v3.pt`,
contain exactly two classes: `{0: '2door', 1: 'door'}`. **There is no `window`
class in either model**, despite `OPENING_CLASSES` in `pipeline.py` listing
`{"door", "2door", "window"}` and the project docs describing a 3-class door/
window detector and an 8-class furniture variant. I read this out of the pickle
inside both `.pt` files rather than trusting the docs, and they agree.

The consequence is that **every window the system reports comes from template
matching, not from YOLO.** `window_detect.py` builds a bank of 240 templates
(10 symbol PNGs × 4 rotations × 6 scales) and classifies wall gaps by
`TM_CCOEFF_NORMED`, accepting anything above 0.60. The fusion rule in
`run_pipeline` drops any template hit overlapping a YOLO box, which is described
as "YOLO wins" — but since YOLO can't emit windows, that rule only ever
suppresses template *doors*. The window path has no learned component and no
fallback at all.

I can't tell you how well that window detection works, because — and this is the
limitation that matters most — **the corpus stops at the wall-graph stage.**
There are zero saved outputs in the final `walls` + `openings` schema. All 90
plans were processed through skeletonisation and DAG export; none were saved
with openings attached. The opening detection and fusion logic, which is the
most intricate code in the project and the part the iOS app most depends on, has
never been run as a batch and never been measured. Every judgement I have about
it comes from single-image spot checks during development.

On the 3D side, the shipped chair model reached **epoch 22 of a configured 100**
(`best.pt` records epoch 22, `last.pt` epoch 23) — training was stopped at
roughly a quarter of the schedule, so the cosine annealing never completed and
the model never saw its final low-LR phase. It has 41.4M parameters, of which
the DINOv2 backbone is frozen. Exported to ONNX it runs in **109 ms on CPU**
(mean of 10 runs, min 107, max 113) for the full three-stage forward pass to
2,562 vertices. I have no Chamfer distance to report: the training loop prints
validation CD every epoch but nothing captures it to a file, so those numbers
scrolled past in a terminal and are gone.

<!-- TODO: if any training terminal log survived, the final val stage-3 Chamfer is the one number that would make the 3D section evaluable. Worth checking shell scrollback or notebook outputs before publishing. -->

## What didn't work

- **The DAG conversion destroyed rooms.** Converting the wall graph to a DFS
  spanning forest removes one edge per cycle, and rooms *are* cycles. Cost:
  4.8% of all wall edges across the corpus, up to 21% on a single plan. I found
  it by diffing the two saved JSON stages against each other — not by looking at
  renders, where a missing wall in a complex plan is genuinely hard to spot. The
  fix is to keep the undirected graph as the export format and derive a
  traversal order at consumption time if a consumer needs one.

- **The YOLO model never had a window class.** The pipeline, the class constant
  and every doc describe door/window detection. The weights contain `2door` and
  `door`. Windows fell through to template matching by accident rather than by
  design, and the "YOLO takes priority" fusion rule — which reads like a careful
  decision — is a no-op for windows. This is what happens when the model
  training lived in a notebook and the weights got copied to `Models/` by hand.

- **The opening pipeline was never batch-evaluated.** I built the corpus run to
  validate skeletonisation, got useful results, and never extended it to stages
  5 and 6. So the most complex logic in the codebase — gap-corner search,
  opposite-side dot product test, collinear wall merging at a 0.85 threshold —
  has zero corpus-level evidence behind it. The gap between "code I checked
  visually a few times" and "code I measured" is the whole difference, and I
  ended up on the wrong side of it for the part that mattered most.

- **Training the chair model stopped at epoch 22 of 100.** The LR schedule was
  3 epochs of linear warmup then cosine annealing over 100 epochs; stopping at
  23 means the model was still at a relatively high learning rate and never got
  the annealed refinement the schedule was designed around. I shipped that
  checkpoint anyway because it produced recognisable chairs.

- **Two earlier Pixel2Mesh attempts failed for diagnosable reasons.** The v3
  script's docstring is effectively a list of what broke in v2: the FPN was
  under-trained at 1e-4 while the GCN ran higher, there was double dropout right
  at the GCN input because both the projection and `GraphConv` applied it,
  off-image vertices clamped to the border and sampled features from the wrong
  place instead of getting zeros, `random.seed(42)` leaked into the augmentation
  RNG, and the best checkpoint was selected on weighted total loss rather than
  stage-3 Chamfer — which meant regularisation terms could win a checkpoint that
  had worse geometry.

- **The v3 ONNX export silently lost dynamic batching.** `runs/pix2mesh/best_v1.onnx`
  has `batch` as a symbolic dimension on every input and output. The shipped
  `runs/pix2mesh_chair_v3/model.onnx` is hard-coded to batch=1, because
  `export_pix2mesh_onnx.py` never passes `dynamic_axes` to `torch.onnx.export`.
  Worse, `best_v1.meta.json` still advertises `"batch"` for every tensor, so the
  metadata describes a model that no longer exists. It doesn't affect the iOS
  app, which only ever runs one image, but any batched server-side use would
  fail.

- **The docs drifted badly from the code.** `CLAUDE.md` documents
  `preprocessing/preprocessing.py` (the file is at the repo root), points at
  notebooks under names that no longer exist, describes a `data/SFPI/` dataset
  that isn't in the repo, and states `SNAP_PX = 20` where the code says 40. Any
  one of these is trivial; together they meant the docs couldn't be trusted for
  anything, which is why every number in this article came from reading files.

## What I'd do differently

**Delete the DAG export, or fix it properly.** This is first because it's the
only defect here that corrupts output data. The undirected graph is the correct
representation of a building; a spanning tree is not. If a downstream consumer
needs a traversal order it can compute one, and if something genuinely needs a
DAG it should record the removed edges as back-edges rather than dropping them.
Ten minutes of work, and it would have saved 293 walls.

**Annotate 20 plans and build a real evaluation harness.** Not 90 — 20 is
enough to compute wall precision/recall and opening precision/recall, and it's
a weekend of tracing. Every claim in this article is either a raw count or an
internal-consistency check, and the reason I found the DAG bug but not the
window-class bug is exactly that: I measured the thing that produced two saved
artefacts to compare, and couldn't measure the thing that produced one. A
labelled set would have caught both on day one, and would have told me whether
the template matcher is carrying the window detection competently or badly.

**Run the full pipeline over the corpus, not just the first four stages.** The
opening fusion logic is the most intricate and least verified code in the
project. Even without ground truth, batch-running stages 5 and 6 and looking at
the distribution — how many openings fail to find two gap corners and hit the
fallback path, how often collinear merging is rejected by the 0.85 threshold —
would surface systematic failures that single-image spot checks never will.

**Log training metrics to a file.** The chair model's validation Chamfer was
printed every epoch and captured nowhere, so the one number that would let
anyone judge the 3D reconstruction is unrecoverable without retraining. A
three-line CSV writer would have prevented that, and the same discipline applies
to the pipeline: if it prints a number worth reading, it should write it
somewhere.

---

**Repository:** [github.com/ssabrut/generational-bullshit](https://github.com/ssabrut/generational-bullshit)

<!-- TODO: the iOS app (c1_vision_floorplan_3) is a separate git repo with no remote configured — add its URL here, or say it's not public -->
<!-- TODO: confirm the project date range — first commit 2026-05-06, last 2026-05-22 on the pipeline repo. Frontmatter date is set to the last commit. -->
