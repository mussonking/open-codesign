# Vision — Open CoDesign

Locked product decisions. Update via PR, not in passing.

## One-line pitch

Open-source desktop design agent. It turns prompts, local files, skills, and brand systems into polished design artifacts on your laptop, with the model you choose.

## What we are building

Open CoDesign is a local-first Electron app for creating design artifacts with an agent that can see and edit a workspace. Each design is a long-running session backed by JSONL history and real files on disk.

The app serves founders, PMs, marketers, designers, and design engineers who want to make:

- Interactive web artifacts authored as HTML/JSX/CSS/SVG sources across mobile, desktop, tablet, and custom artifact sizes
- Slide decks, one-page reports, case studies, marketing pages, and export bundles
- Multi-artifact projects such as landing page + pricing page + onboarding email
- Brand-aware mockups driven by `DESIGN.md`, local files, and built-in brand references
- Design systems that can be exported, edited, and reused by other tools

The product started as an open-source counterpart to Anthropic's [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs). The v0.2 direction is broader: a local design agent that borrows proven coding-agent mechanics, then adds design-specific tools for scaffolds, skills, preview, tweaks, images, and brand acquisition.

## What we are NOT building

- Not a general software engineering agent. The agent may read, edit, run commands, and manage files, but the product boundary is design artifacts and design-system handoff.
- Not a Figma replacement — we don't do collaborative vector editing.
- Not a Canva replacement — we don't ship a stock asset library or template marketplace.
- Not hosted SaaS. No account, cloud sync, or telemetry is required.
- Not a plugin marketplace in v0.2. Community skill/scaffold installation is deferred.
- Not a bundled local-model distribution. Local models can be used through system installs or compatible endpoints.

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Form factor | Electron desktop (Mac + Win) | Local file access, codebase scan privacy, complements open-cowork |
| Agent runtime | `pi-coding-agent` + `pi-ai` | Use proven session, tool, provider, bash, and capability primitives instead of rebuilding them |
| Model layer | `pi-ai` | Multi-provider coverage for Anthropic, OpenAI, Gemini, DeepSeek, local, and compatible gateways |
| Authentication | BYOK, no hosted account | No backend, no liability for user keys |
| Storage | JSONL sessions + workspace filesystem | Design history is inspectable, backup-friendly, and aligned with pi sessions |
| Workspace model | Every design has a workspace | No sealed/open split; files are the source of truth |
| Design system format | Google `DESIGN.md` spec | Portable, editable by users, and usable by other tools |
| Design resources | Built-in skills, scaffolds, and brand refs | Improve taste through progressive disclosure rather than a huge prompt |
| Design language | Aligned with open-cowork and local `packages/ui` tokens | Keeps the shell coherent while artifacts bring their own style |
| Package manager | pnpm + Turborepo | Workspace, caching, fast |
| Lint/format | Biome (single tool) | Lessons learned from open-cowork's ESLint+Prettier complexity |
| License | MIT | Matches the public repo and keeps reuse simple |
| Contributor agreement | DCO (`Signed-off-by`) | Lower friction than CLA |

## Product pillars

### 1. Design as Session

A design is a pi session with a workspace. The sidebar shows sessions, not abstract projects. `cwd` points at the workspace; the session name is the design name. Multiple sessions can share one workspace.

### 2. Files Are Real

The agent writes source files such as `App.jsx`, CSS, `DESIGN.md`, assets, and exports to disk. The preview runtime turns source files into rendered web documents; the Files tab watches the filesystem rather than trusting tool-call logs. External edits from VS Code or Finder are first-class.

### 3. Agentic Loop, Soft Phases

The agent can plan, read files, edit files, run allowed commands, call design tools, preview output, ask structured questions, and finish through `done()`. The system prompt guides the loop; the runtime does not hard-code design phases.

The harness architecture for this loop is:

- **Run Controller** — owns `designId` + `generationId`, preflight questions, title/todo protocol, cancellation, timeout, and phase events.
- **Workspace Delta Bus** — streams file mutations, preview updates, and snapshot persistence per design/generation instead of through one global pending slot.
- **Context Pack / Session Memory** — workspace files plus compact brief are authoritative; model history stays bounded and excludes bulky tool payloads.
- **Verification Gate** — `preview(path)` is the mid-turn visual/runtime check, and `done(path)` is the finalization gate that either passes or returns compact repairable errors.

### 4. Progressive Disclosure

Skills and scaffolds are indexed in the prompt and loaded on demand. The base prompt stays small. Brand references and design techniques become tools the agent can pull when needed.

### 5. Brand Systems as Artifacts

`DESIGN.md` is both input and output. Users can bring one from another tool, edit it by hand, or ask Open CoDesign to create one. Brand values are extracted from authoritative files or URLs, not invented from model memory.

### 6. Local Control

The user owns model choice, API keys, workspace files, sessions, allowed commands, and exports. Networking is visible and tied to user intent.

## v0.2 Success Criteria

v0.2 is the shift from single-prompt generator to local design agent:

1. A new design creates or binds a workspace under the user's default workspace root.
2. Sessions persist as JSONL files through pi's `SessionManager`.
3. The app migrates v0.1 SQLite designs into workspaces and session history.
4. The agent uses pi built-ins for read, write, edit, bash, grep, find, and ls, with our permission hook.
5. Design-specific tools cover `ask`, `scaffold`, `skill`, `preview`, `gen_image`, `tweaks`, `todos`, and `done`.
6. `DESIGN.md` is loaded into context and can be produced as a design-system artifact.
7. Built-in scaffolds, skills, and brand references ship with license metadata and lazy loading.
8. Preview self-checks console errors, missing assets, DOM outline, and screenshots when the model supports vision.

## v1.0 Success Criteria

The v1.0 bar remains demo-driven, but the demos should run through the agentic workspace model:

1. Mobile app prototype with a device frame and real navigation
2. Client case study one-pager exportable as PDF
3. B2B SaaS pitch deck exportable as PPTX
4. Point-and-prompt revision through preview selection or comments
5. AI-emitted tweak controls across one or more files
6. Codebase or `DESIGN.md` driven design-system inheritance
7. Web or brand capture through the acquisition protocol
8. Handoff ZIP with artifacts, assets, `DESIGN.md`, and an intent README

## Differentiation vs Claude Design

| Axis | Claude Design | open-codesign |
|---|---|---|
| Model | Opus 4.7 only | Multi-provider via pi-ai and compatible gateways |
| Form | Web SaaS | Local desktop |
| Storage | Cloud-stored | JSONL sessions + local workspace files |
| Backend | Anthropic + Canva | None |
| Agent mechanics | Closed | pi-coding-agent primitives plus design tools |
| Brand systems | Internal | Portable `DESIGN.md` |
| Source | Closed | MIT |
| Cost | Subscription | BYOK token cost only |

## Non-goals (explicit)

- Real-time multi-user collaboration
- Built-in stock photo / icon library (link out instead)
- Mobile companion app
- Self-hosted server mode
- Custom in-house models
- MCP support in v0.2
- Session branching UI in v0.2
- Undo / version rollback in v0.2

## Ecosystem positioning (deferred)

Several axes stay deferred until the workspace agent is solid:

- **Claude ecosystem compat**: parse Claude Artifacts `<artifact>` tag protocol; expose ourselves as MCP server for Claude Code
- **open-cowork ecosystem**: shared `packages/ui`, shared sandbox runtime, artifact handoff conventions, and optional plugin integration
- **Stitch / DESIGN.md ecosystem**: import and export `DESIGN.md` cleanly enough that other tools can consume our design systems
- **Community resources**: user-installable skills, scaffolds, and brand refs

## Versioning milestones

- `0.1` — single-prompt design generation, local persistence, model setup, preview, comments, tweaks, and exporters
- `0.2` — agentic workspace loop using pi sessions, JSONL, permissioned tools, scaffolds, skills, preview, and `DESIGN.md`
- `0.3` — multi-artifact orchestration, richer brand/design-system workflows, and optional session branching UI
- `0.5` — all v1.0 demos work on the agentic workspace model
- `1.0` — installer budget green, distribution polished, migration reliable, all demos pass smoke tests
