---
title: "Speculative Decoding on Apple Silicon with MLX"
date: "2026-08-14"
status: "Prototype"
tags: ["MLX", "Apple Silicon", "LLM", "Optimization"]
summary: "Testing whether draft model speculation with a 0.5B model can accelerate 4B on-device token generation without blowing through the thermal envelope."
highlight: "Draft model speculative decoding achieved a 1.8x speedup on freeform text, but collapsed under heavy verification rollbacks during structured JSON generation."
github: "https://github.com/ChronoStellar"
---

## The hypothesis

Running on-device LLMs on macOS and iOS is memory-bandwidth bound. Every decoded token requires streaming billions of model weights through unified memory. Speculative decoding promises to break this memory-bandwidth bottleneck: a fast, tiny "draft" model (e.g. Qwen 0.5B or Gemma 270M) speculates $K$ tokens ahead, and the larger "target" model (e.g. Gemma 4B) verifies all $K$ candidates in a single parallel forward pass.

If the draft acceptance rate $\alpha$ is high enough, we should see substantial wall-clock speedups while retaining the exact output distribution of the 4B target model.

## The experiment setup

Using Apple's MLX framework on an M-series Mac:
- **Target model:** Gemma 2 4B (4-bit quantized)
- **Draft model:** Qwen 2.5 0.5B (4-bit quantized)
- **Evaluation tasks:**
  1. Freeform creative & analytical prose (meeting summarization, reasoning)
  2. Constrained structured output (JSON schema extraction with function calls)

```python
# Simplified speculative verification loop
def speculative_step(target_model, draft_model, prefix, gamma=4):
    draft_tokens = draft_generate(draft_model, prefix, steps=gamma)
    target_logits = target_model.forward_parallel(prefix + draft_tokens)
    
    accepted = []
    for i, token in enumerate(draft_tokens):
        p_target = softmax(target_logits[i])
        p_draft = draft_model.prob(token)
        
        # Modified acceptance rejection sampling
        if random() < min(1.0, p_target[token] / p_draft[token]):
            accepted.append(token)
        else:
            resampled = sample_residual(p_target, p_draft)
            accepted.append(resampled)
            break
            
    return accepted
```

## Observations & outcomes

### 1. Freeform prose: 1.78x speedup
On conversational responses and note summaries, the draft model achieved an average acceptance length of $2.9$ tokens per verification cycle ($K=4$). Because MLX takes advantage of unified memory, evaluating a batch of 4 tokens on the target model took only ~18% more time than evaluating a single token. Overall generation jumped from 24 tokens/sec to **42.7 tokens/sec**.

### 2. Structured JSON: Complete collapse
When prompting the model for strict JSON schemas or code ASTs, the speed advantage completely vanished:
- Small 0.5B models lack strong instruction tuning for strict formatting syntax.
- The draft model frequently mismatched punctuation tokens (e.g. predicting a newline or space instead of `"` or `,`).
- Acceptance rate plunged to **under 0.4 tokens per step**.
- The constant rejection and rollback incurred a 25% net *slowdown* compared to standard greedy decoding on the target model alone.

| Mode | Target Only (tok/s) | Speculative (tok/s) | Net Speedup |
|---|---|---|---|
| Prose / Summaries | 24.1 | 42.7 | **+77.2%** |
| Code / Regex | 23.8 | 31.2 | **+31.1%** |
| Strict JSON Schemas | 24.5 | 18.2 | **-25.7%** |

## Key takeaway

Speculative decoding is not a free lunch on edge devices. While memory bandwidth permits batched verification cheaply, the draft model must share the same structural grammar tendencies as the target model. For agentic workflows that rely heavily on JSON tool calls (like [Tickit](/projects/tickit)), speculative decoding actively degrades latency unless paired with a grammar-constrained draft sampler.
