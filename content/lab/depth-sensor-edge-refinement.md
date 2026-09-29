---
title: "Boundary-Preserving Depth Refinement for LiDAR Meshes"
date: "2026-05-10"
status: "Exploration"
tags: ["LiDAR", "Computer Vision", "Metal", "3D"]
summary: "An experiment applying bilateral guided filters on raw iPad LiDAR point clouds to eliminate 'flying pixels' around furniture edges."
highlight: "Guided filtering cleanly snaps jagged LiDAR boundaries to RGB edges in <8ms, but creates tearing artifacts on reflective metallic surfaces."
github: "https://github.com/ChronoStellar"
---

## The problem

The LiDAR scanner on modern iPads and iPhones provides accurate metric scale, but its resolution is coarse (typically $256 \times 192$ depth maps). When upsampling this depth map to match the $4\text{K}$ or $1080\text{p}$ RGB camera frame, naive bicubic or linear interpolation creates "flying pixels"—ghost depth samples hovering in mid-air between foreground object boundaries and the background wall.

When reconstructing furniture or indoor geometry (as explored in [Floorplan to AR](/projects/floorplan-to-ar)), these flying pixels turn straight table edges and chair legs into melted blobs.

## The approach: Bilateral Guided Image Filtering

Instead of generic neural depth upsampling (which was too heavy to run real-time at 60 FPS on-device), I implemented a fast Metal Compute kernel using a joint bilateral guided filter.

The high-resolution RGB image acts as the guide:
$$\text{Output}_i = \sum_{j \in \omega_k} W_{ij}(I) \cdot D_j$$

Where the filter weights $W_{ij}$ depend on spatial proximity and color similarity in the guide image $I$.

```metal
// Metal compute kernel snippet for joint edge-aware sampling
kernel void guidedDepthRefine(
    texture2d<float, access::read> lowResDepth [[texture(0)]],
    texture2d<float, access::read> highResColor [[texture(1)]],
    texture2d<float, access::write> refinedDepth [[texture(2)]],
    uint2 gid [[thread_position_in_grid]]
) {
    float3 centerColor = highResColor.read(gid).rgb;
    float sumWeights = 0.0;
    float weightedDepth = 0.0;
    
    // 5x5 bilateral neighborhood
    for (int dy = -2; dy <= 2; ++dy) {
        for (int dx = -2; dx <= 2; ++dx) {
            uint2 sampleCoord = gid + uint2(dx, dy);
            float3 neighborColor = highResColor.read(sampleCoord).rgb;
            float depthSample = lowResDepth.read(sampleCoord / 4).r;
            
            float colorDist = distance(centerColor, neighborColor);
            float weight = exp(-(dx*dx + dy*dy) / 8.0) * exp(-colorDist * colorDist / 0.04);
            
            weightedDepth += depthSample * weight;
            sumWeights += weight;
        }
    }
    refinedDepth.write(float4(weightedDepth / max(sumWeights, 1e-4), 0, 0, 1), gid);
}
```

## Findings and failure modes

### What worked:
- **Sharp boundaries:** Chair legs, picture frames, and sharp cabinet corners snapped crisply to their visible RGB contours.
- **Speed:** The Metal shader completed in **~6.8 ms** per frame on Apple M2, leaving plenty of overhead for ARKit tracking and rendering.

### What broke:
- **Specular highlights & shadows:** Because the filter assumes color discontinuities represent geometric edges, harsh specular reflections (e.g. sunlight glare on a glass table) caused artificial depth fractures.
- **Edge bleed on low contrast:** If a dark chair sits in front of a dark rug, color guidance fails and the coarse depth boundary remains blurred.

## Conclusion

Joint bilateral filtering is a fantastic lightweight tool for clean depth boundaries, but needs an adaptive threshold: it should fall back to standard depth smoothing when RGB gradient direction doesn't match surface normal expectations.
