# Agent run protocol hardening

Status: implementation started on 2026-05-05.

## User intent

The agent loop should feel like a visible design collaborator, not a silent one-shot generator.
For open-ended design creation, the desired rhythm is:

1. Ask the user a small number of high-impact questions when the brief leaves material choices open.
2. Present a concrete plan with `set_todos` before the main build work.
3. Interleave short assistant text with tool calls so the user sees phase changes: inspect, write, preview, repair, finish.
4. Use `set_title` proactively so new designs do not remain as `Untitled design N`.

This is a product behavior contract, not just prompt flavor. The runtime and prompt should make the happy path easy for the model and observable in logs.

## Current evidence

Recent desktop logs for generation `moshk0qh-lqddh6` showed:

- `generate-title` succeeded in the renderer/main side path.
- The agent tool list included `set_title`, `set_todos`, `ask`, file edit, preview, and done.
- The actual agent sequence skipped `set_title`, then called `view frames/watch.jsx`, `set_todos`, `create App.jsx`, `preview`, and `done`.
- The session row and `design-store.json` still showed `Untitled design 1`.

So the gap is not tool availability. The gap is protocol strength:

- The agent did not know that the current design title was still an auto-generated placeholder.
- Existing source/scaffold guidance made the run look like continuation work, which weakened the `set_title` requirement.
- UI auto-title was asynchronous and could leave the design visibly untitled while the agent worked.
- `ask()` was available, but only prompt-encouraged; only the separate run-preferences router asked deterministic preference questions.

## Protocol decisions

### Naming

When the current design title is `Untitled design` or `Untitled design N`, the agent must call `set_title` once as the first tool call. This applies even if a scaffold, frame, or starter source already exists in the workspace.

The renderer should also apply a local fallback title immediately from the first prompt, then optionally replace it with the model-generated title. The visible app state should not wait on a network title request before leaving `Untitled`.

### Questions

Use `ask()` for high-impact ambiguity: visual direction, artifact type, audience, content source, reusable-system vs one-off, or expensive optional controls/assets.

Do not ask about details that can be inferred safely or revised cheaply. For narrow, fully specified briefs, proceed without a question.

### Planning

For any multi-step design creation, call `set_todos` early after title/clarification. The checklist should be concrete enough to explain the build sequence, not a generic "implement / polish / finish" list.

### Visible interleaving

The system prompt should continue requiring a short assistant sentence before major phase shifts. The testable signal is event order in session JSONL: assistant text or tool groups should make the loop legible without dumping source code into chat.

Host-generated phase notes remain allowed, but only as a restrained fallback:

- emit one note only when the current turn has not produced model text yet;
- use them for high-signal transitions such as `ask`, `set_todos`, first write, `preview`, and `done`;
- do not rely on them for state; they are visibility aids, not memory.

### Stream isolation

`fs_updated` handling must be keyed by `designId + generationId + path`, not by one global pending slot. A background run may update its own preview pool entry, but it must never overwrite another design's visible preview during the throttle window.

`agent_end` should flush only the ending generation's pending preview updates before snapshot persistence.

### Tool-result persistence

Session JSONL remains the source of truth for chat/tool rows, but persisted tool results must stay compact:

- keep visible text at or under the chat budget;
- strip or summarize large `details` payloads, especially `preview` screenshots and verbose `done` results;
- preserve structured fields needed for replay: tool name, command, path, status, duration, counts, and a short error preview.

### Unified scoped edits

Inline comment / point edits should use the same main generate path as ordinary follow-up prompts. Scope metadata (selector, tag, outerHTML, parent context when available) belongs in the user prompt/context pack, not in a separate weak-history revise pipeline.

## Next hardening targets

- Add a deterministic preflight policy for `ask()` when the router marks high-impact ambiguity, instead of relying only on model discretion.
- Add log/session tests that assert `set_title` appears before file edits for auto-named designs.
- Add evaluation fixtures covering concurrent design runs, compact tool-result persistence, and scoped point edits on top of existing source.
