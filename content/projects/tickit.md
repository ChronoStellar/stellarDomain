---
title: "Tickit"
date: "2026-06-11"
summary: "A macOS app that turns raw meeting notes into a kanban board of tasks, running a 4B model entirely on-device with no server and no API keys. It works, but we never built a way to measure how well — the honest result is a strong architecture with an unmeasured accuracy claim."
tags: ["Swift", "SwiftUI", "MLX", "on-device", "LLM", "agents", "NLP", "macOS"]
coverImage: /projects/tickit/tickit_hero.png
---

## The problem

Meeting notes are where tasks go to die. You type them fast, in whatever mix of languages and punctuation your brain is running that day, and then either you transcribe them into a task manager by hand or you never look at them again. The obvious fix is to throw the note at an LLM and ask for JSON. That works until you try to do it without sending your client notes to somebody else's server.

The constraint we picked was on-device only. No API keys, no network at runtime, no note ever leaving the machine. That constraint is the whole project, because it immediately takes the good models away from you. A 4-billion-parameter quantized model running in unified memory on a MacBook is not Claude. It forgets instructions, it emits JSON with a paragraph of apology wrapped around it, and — our favourite failure — it silently translates Indonesian notes into English task titles because English is what its instruction tuning rewards.

There was a second constraint that isn't in the README. The notes we actually cared about are Indonesian, or more precisely Indonesian with English loanwords dropped in wherever the speaker felt like it: `deploy fix ke staging besok pagi`. Every date library and every off-the-shelf extraction heuristic assumes English. `besok` is tomorrow, `lusa` is the day after, `kamis depan` is next Thursday, and `minggu depan` means next calendar week rather than next Sunday — which is a distinction that matters and that nothing off the shelf gets right.

<div class="video-embed">
  <iframe src="https://drive.google.com/file/d/15dDMzoO4VK-73JbZ1Zxz9rTZssQ__DGe/view?usp=drive_link" allow="autoplay" allowfullscreen title="Rulaa demo"></iframe>
</div>

Tickit is a macOS app. You paste a note into a project, hit Process, and an agent running a 4-bit Gemma 4 E4B locally reads the note block by block and writes tasks — "ticks" — straight onto a kanban board, grouped into columns it either reuses or creates. Dated ticks show up in a deadline-sorted agenda. A global hotkey (⌥N) opens a floating capture bar from anywhere. It was built by four of us over ten days.

## Key learnings and technical outcomes

- **A tool-calling ReAct loop beats one-shot JSON extraction on small models.** The model never returns a document we have to parse and validate. It emits one JSON tool call per turn, we execute it, and we feed the observation back. Eleven tools: six read, three write, `ask_user`, and `finish`.
- **Deterministic NLP carries the parts the model is bad at.** `TemporalResolver.swift` is 1,403 lines — the largest file in the project by nearly 3× — and it contains no inference at all. Date phrases are resolved to absolute ISO dates *before* the model sees the block, and handed to it as authoritative.
- **Rules live in JSON, not Swift.** Four rule packs per locale (extraction, temporal, lexicon, clarification) with a full `en-US` and `id-ID` set — 289 and 352 extraction entries respectively, 98 and 125 action verbs. Adding a language is a new set of JSON files, not a code change.
- **Guardrails for small-model failure modes are their own subsystem.** Per-block step cap scaled to estimated task count (`min(40, 10 + tasks × 2)`), duplicate-call suppression via canonical arg signatures, no-progress exit after 2–3 dead turns, and idempotent writes so a re-run can't double-post.
- **Swapping models is a config edit.** `model_config.json` pins the HF repo and token budgets; `MLXRunner.swift` is the only file in the codebase that imports MLX.
- **Memory is managed explicitly.** The model stays resident between calls and is unloaded 20 seconds after the last run, which releases several GB of unified memory back to the machine.

## Key considerations and trade-offs

- **On-device only, which caps model quality at ~4B.** Everything else in the architecture is compensation for that ceiling.
- **The board is the vocabulary.** There is no separate tag taxonomy — the project's existing columns are what the agent groups against, so its category space is whatever the user already made.
- **Live writes, not a staged diff.** Tools mutate `AppStore` immediately and persist. That makes the run observable as it happens, and it makes a bad run something you undo rather than something you approve.
- **Two questions per note, hard cap.** `ask_user` decrements a budget of 2 for the whole note; past that the tool tells the model to make its best inference and proceed.
- **A 15-word floor on the project description before Process unlocks.** The description is the agent's stable context, and an empty one produced garbage columns.
- **Indonesian is the default locale**, with English as the parity port — the reverse of most projects, and the reason the temporal work is as heavy as it is.

## Why the dates never go through the model

The most contested decision was refusing to let the model resolve dates, and it cost us the largest file in the repo to enforce.

The tempting design is to tell the model today's date and let it work out that `kamis depan` is the 18th. Small models are bad at this in a specific and dangerous way: they produce a plausible, confidently-formatted, wrong date. A hallucinated task title is obvious. A task dated three days off is invisible until you miss it.

So `TemporalResolver` resolves every date phrase in a block *before* the prompt is built, and the resolutions go into the prompt under a heading that reads `### Pre-resolved dates (authoritative — use these, do not ask)`. The workflow rules add: "use the pre-resolved dates given with the block. Output due as YYYY-MM-DD or null. Never output a relative phrase." The model's job is reduced from computing a date to copying one.

The resolver handles relative days, weekday rules, period anchors, day-parts, prayer times, and compound phrases, built from `temporal_rules.json` (57 leaf entries for `id-ID`, 43 for `en-US`). It prefers the rightmost forward-looking date when a clause has several, which is what makes `bug checkout kemarin, fix besok` resolve to tomorrow rather than yesterday. There is also a `resolve_date` tool the model can call, but it exists as a fallback — the pre-resolution pass is designed to make calling it unnecessary.

The cost is honest: 1,403 lines of hand-written date logic that a frontier model would handle in a prompt line. That is the price of the on-device constraint, and it is paid in Swift.

## How the agent actually runs

`NoteAnalyzer` is the facade the UI binds to — it owns the model load phase and the processing phase, and suspends on a `CheckedContinuation` while the user answers a clarification. Underneath, `AgentRuntime` does the work.

A note is split into blocks on blank lines, then markdown fragments are merged back so headings and quoted copy lines stay attached to their bullets. Each block gets its own bounded ReAct loop against a shared session, so columns created in block 1 are visible to block 7.

| Step | What happens |
|---|---|
| 1 | `AgentPromptBuilder.turnPrompt` renders header, tool catalogue, writing rules, workflow rules, five worked examples, the block, its pre-resolved dates, and the scratchpad so far |
| 2 | `AgentReasoner.decide` calls `runRaw` — no JSON extraction, so tool-call objects survive intact |
| 3 | `ToolCallParser.parse` scans for the first balanced `{…}` object, tolerating preamble, code fences and trailing reasoning, and normalizes alias keys (`tool`/`action`/`name`, `args`/`arguments`/`input`/`parameters`) |
| 4 | The tool executes against `AgentBoard`, which writes through to `AppStore` and persists |
| 5 | `THOUGHT / ACTION / OBSERVATION` is appended to the transcript and the loop repeats until `finish` or a guardrail fires |

The tolerance in step 3 is not defensive programming for its own sake — it is a direct response to what a 4B model does when asked for exactly one JSON object.

### The guardrails

| Guardrail | Mechanism |
|---|---|
| Step cap | `min(40, 10 + estimatedTasks × 2)` per block, so long lists aren't truncated but short blocks can't spin |
| Duplicate suppression | `ToolCall.signature` canonicalizes tool + sorted args; a repeat is ignored and counts as no-progress |
| No-progress exit | 2 consecutive invalid/repeat turns, or 3 consecutive errors, ends the block |
| Idempotency | `tickExists` compares canonical title keys; `column(named:)` reuses before creating |
| Note locking | The note is only marked locked and linked to its ticks if the run produced ticks — so a failed run stays retryable |
| Undo | `AgentBoard.undo()` removes every column and tick the run created |

### The deterministic layer underneath

Independent of the model, a rules-driven pipeline segments the note into `CandidateSpan`s, classifies each as action / noise / context / completed / ambiguous with a confidence, and reconciles duplicates. Spans above the `action_confidence_threshold` of 0.72 are actionable; gray-zone spans get promoted locally when a list marker, a verb, a commitment marker or a forward temporal hint is present, specifically to avoid spending an LLM round-trip on something heuristics can settle.

`ActionItemPipeline` then standardizes whatever lands on the board — unicode normalization, list-prefix and colon splitting, trailing-clause and parenthetical stripping, noise rejection, column case consolidation. It carries two title tiers, and the reason is a lesson: `standardizeTitle` is tuned for noisy regex output and over-strips faithful agent output, so `standardizeAgentTitle` was added to preserve the model's wording — parentheticals like `(0/2)`, arrows, colons — while still stripping checkbox markers.

## How we evaluated it, and why that section is short

**We did not build an automated evaluation, and there are no accuracy numbers in this repo.**

What exists is 37 note fixtures under `Tickit/Tests/Fixtures/notes/` — clean bullets, messy 1-on-1s, WhatsApp fragments, punctuation chaos, a single-paragraph voice-dictation wall, a three-day Slack thread paste, three clients in one note — and `TickitTests/english_test_cases.json`, which catalogues ten of the English ones into a `baseline` and a `chaos` suite with difficulty labels and parity mappings to their Indonesian counterparts. The fixtures README carries a manual checklist with expected tick counts per case: TC-27 should yield 3 ticks, TC-34 should yield 15+ from the voice wall while skipping personal and networking chatter, TC-33 should yield 10+ from the Slack dump while skipping FYI lines.

That is a well-designed test set with a human in the loop and no harness attached. Its own description says "for Tickit manual and future XCTest" — the future XCTest was never written. `MockMLXRunner` exists and makes the pipeline runnable offline and deterministically, which is exactly the seam an automated eval would have hooked into, and nothing hooked into it.

So every claim about extraction quality in this project rests on four people pasting notes into an app and looking at the board. That is not nothing — it caught real bugs, including the translation bug below — but it is not a measurement, and this section is short because the honest version of it is short.

## Results

**The result we can report is that the architecture works and that we never measured how well it works.** There is no pass rate, no precision or recall on task extraction, no date-accuracy figure, no latency benchmark. Those numbers do not exist in the repository and we are not going to invent them.

What is measurable, from the code and the commit history:

| Quantity | Value | Source |
|---|---|---|
| Active model | Gemma 4 E4B, 4-bit OptiQ, ≈6 GB | `model_config.json`, `ModelConfig.sizeLabel` |
| Agent tools | 11 (6 read, 3 write, `ask_user`, `finish`) | `AgentRuntime.init` |
| Step budget per block | `min(40, 10 + tasks × 2)` | `AgentRuntime.runBlock` |
| Question budget per note | 2 | `AgentRuntime.questionBudget` |
| Idle model unload | 20 s | `NoteAnalyzer.idleReleaseDelay` |
| Action confidence threshold | 0.72 | `*.extraction_rules.json` defaults |
| Temporal resolver | 1,403 lines, 0 inference calls | `TemporalResolver.swift` |
| Rule pack entries (id-ID / en-US) | extraction 352 / 289, lexicon 152 / 154, temporal 57 / 43 | `Resources/locales/*.json` |
| Action verbs (id-ID / en-US) | 125 / 98 | `*.extraction_rules.json` |
| Test fixtures | 37 notes, 10 catalogued into 2 English suites | `Tests/Fixtures/notes/`, `english_test_cases.json` |
| Persistence | JSON, debounced 250 ms | `AppStore` |
| Project span | 50 commits, 4 contributors, 2026-06-02 → 2026-06-11 | `git log` |

The one before/after number in the history is the chunker. The commit `da69208 — "feat: split note chunker from 44 block to 14 block"` records that merging markdown fragments back into their parent blocks cut a test note from 44 blocks to 14. Since the ReAct loop runs once per block and each block costs at least two inference calls, that is roughly a 3× reduction in inference calls on markdown-style notes — and it is the closest thing to a performance measurement we produced.

<!-- TODO: if you ran the manual QA checklist and recorded pass/fail per test case anywhere — even a notebook or a chat log — that belongs here as a table. Without it this section stays as-is. -->
<!-- TODO: wall-clock time to process one note end-to-end on your machine was never recorded. One timed run on TC-27 and TC-34 would give this section two real latency numbers. -->

### The shape of what we know

The interpretation, flagged as interpretation: the architecture is shaped by which failures we actually hit, and the shape is legible. The heaviest engineering went into dates and title fidelity, which says those were the two places a small model failed hardest. The lightest engineering went into the tool loop itself, which suggests ReAct with a tolerant parser was close to right on the first try — the loop's own code is short, and what surrounds it is all compensation.

The claim we cannot support is the one a reader most wants: that this is better than pasting the note into a hosted model. We never ran that comparison. On the on-device constraint the project delivers exactly what it promised; on the quality question it has an argument and no evidence.

## What didn't work

**The original two-pass orchestrator was replaced entirely.** The first design — `AgentOrchestrator` driving a clarify pass, then a parse pass, then schema validation with up to 3 retries that injected the validation error back into the prompt — was deleted in `ad2ff30`. The root cause is that a small model asked for a complete JSON array of every task in a note gets progressively worse as the note gets longer: it truncates, it drops items from the middle, and the retry loop can only tell it *that* the schema failed, not which task went missing. Splitting the note into blocks and letting the model commit one tool call at a time removed the failure mode instead of retrying through it. The README still documents the deleted design.

**The model translated Indonesian notes into English titles, and English notes into Indonesian ones.** Fixed in `904aac1` by adding a symmetric language rule and a matched pair of few-shot examples. The root cause is instruction tuning: asked to write a task title, the model reaches for the language it was mostly trained to be helpful in. Telling it "don't translate" once was insufficient; it needed the rule stated in both directions plus a worked example each way, including a pair that differs only in whether the connective is "then" or "lalu".

**Notes were being over-chunked into 44 blocks.** Splitting on blank lines alone tore markdown notes apart — a heading became its own block, its bullets became another, a quoted copy line became a third. Each fragment then went through the full ReAct loop with no idea what it belonged to. `NoteChunker.mergeMarkdownFragments` merges heading-only fragments and quoted copy lines back into their parent, cutting the same note to 14 blocks.

**The model stayed loaded after processing finished, holding several GB.** Two commits, `469e06e` and `81ef0c0`, and the resolution was the 20-second idle release rather than an immediate unload — because unloading immediately made the next note pay the full reload cost. What looked like a leak was a caching decision that had never been made deliberately.

**The agent invented placeholder tasks.** It emitted backend-style stubs like `Customer_service`, bare markdown headings, and section labels with no verb. `ActionItemPipeline.isAgentPlaceholderTitle` now rejects titles matching `^[A-Za-z][A-Za-z0-9]*_service$`, titles that are markdown headings, and short verbless fragments with no arrow or quoted copy. The prompt also says it explicitly. Both were needed — the prompt rule alone did not hold.

**The clarification loop asked the same question every time.** Fixed in `be7d0cb`, alongside a tag-display bug. This is what the 2-question budget and the `#clarified:…#` answer markers in the temporal resolver exist to prevent: without state, "which Thursday?" is just as unanswered on turn 9 as on turn 1.

**The generic title cleaner damaged good agent output.** `standardizeTitle` was written for noisy regex extraction and stripped parentheticals and trailing clauses that the agent had put there deliberately. It took a second, lighter code path to fix rather than a tweak, because the two sources genuinely need different handling.

## What I'd do differently

Write the eval harness first, before any prompt tuning. `MockMLXRunner` and the 37 fixtures already sit exactly where a harness would attach, and `english_test_cases.json` already declares expected tick counts per case. A script that runs all 37 fixtures through the real runner and diffs tick counts and titles against expectations would have been perhaps a day's work at the start, and it would have converted every claim in the Results section above from an argument into a number. It would also have let us answer the question the project cannot currently answer — whether the deterministic layer is worth 1,403 lines, which you can only know by turning it off and re-running.

Fix the documentation drift, or delete the stale docs. The README describes an architecture that no longer exists — `AgentOrchestrator.swift`, `ReasoningAgent.swift`, `MemoryStore.swift`, a `Tools/` directory — while `ARCHITECTURE.md` describes the current one and says so explicitly. `ARCHITECTURE.md` has its own drift: it documents a WidgetKit extension and an App Group container that are not in this repository. Three documents disagreeing about the same codebase is worse than one thin document that is true.

Run the comparison we skipped. One frontier-model baseline over the same 37 fixtures would tell us the real cost of the on-device constraint. It might well show the gap is small, which would be the strongest possible argument for the whole design — or that it is large, which is worth knowing before recommending this approach to anyone.

Reconsider whether the deterministic layer should be this large before knowing it's necessary. It was built in response to real failures, so it is not speculative. But it was built against a model that was current in June 2026, and the sensible order — measure, then decide how much scaffolding the model actually needs — is the reverse of the order we used.

---

**Repository:** [github.com/AIML-C1-NLP/tickit](https://github.com/AIML-C1-NLP/tickit)

<!-- TODO: confirm the repo should be linked publicly — it's an org repo (AIML-C1-NLP), check whether it's public before shipping this link. -->
<!-- TODO: the project ran 2026-06-02 to 2026-06-11 per git log; the date in frontmatter is the last commit. Change if you want the publication date instead. -->
<!-- TODO: no screenshots referenced. The app has a kanban board, agenda view and Quick Capture panel — 2-3 screenshots would carry this article a long way. -->
