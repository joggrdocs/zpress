<!-- Auto-synced from plugin. Do not edit manually. -->

# .joggr/.gg/

A structured workflow system for managing development projects through a phased pipeline.

## Workflow Pipeline

```
/gg-new → /gg-discuss → /gg-research → /gg-plan → /gg-execute → /gg-verify
```

Each step advances the workflow. `.joggr/.gg/state.json` tracks only the active project. Phase status is tracked in phase file YAML frontmatter.

## Skills

Skills are slash commands that drive the workflow. Each skill manages state transitions, user interaction, and agent orchestration.

| Skill         | Description                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `gg-new`      | Scaffold a project from a Linear issue/project or free-text description                                         |
| `gg-status`   | Read-only tree view of project progress                                                                         |
| `gg-discuss`  | Interview user to gather requirements (goals, constraints, preferences, edge cases, acceptance criteria)        |
| `gg-research` | Spawn background agent to explore codebase and web for technical context                                        |
| `gg-plan`     | Create phase plan with tasks, file targets, acceptance criteria, and dependencies                               |
| `gg-execute`  | Group tasks into parallel waves and spawn executor agents                                                       |
| `gg-verify`   | Spawn verifier agent to check acceptance criteria with concrete evidence                                        |
| `gg-codebase` | Analyze repo and maintain `.joggr/.gg/codebase/` docs (stack, architecture, conventions, testing, integrations) |
| `gg-help`     | Display all available commands and usage                                                                        |

## Agents

Agents are subagents spawned by skills to do the actual work.

| Agent                 | Interactive?    | Description                                                                                           |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `researcher`          | No (background) | Codebase + web researcher — explores code, maps dependencies, finds existing patterns                 |
| `planner`             | Yes             | Task decomposer — breaks phases into tasks with file targets and acceptance criteria                  |
| `executor`            | No (background) | Task implementer — executes one task, validates with typecheck/lint/test                              |
| `verifier`            | No (background) | Acceptance verifier — checks every criterion with concrete evidence                                   |
| `codebase-researcher` | No (background) | Codebase analyst — explores repo with Serena MCP tools, writes focused docs to `.joggr/.gg/codebase/` |

## Docs

Internal documentation for agent authors.

| File                          | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `docs/core/architecture.md`   | Overview, definitions, component interaction diagram                  |
| `docs/core/state.md`          | State tracking, workflow artifacts, session persistence               |
| `docs/standards/interface.md` | How skills pass context to agents and how agents return results       |
| `docs/standards/agent.md`     | Agent file structure, required/optional sections, example skeleton    |
| `docs/standards/skill.md`     | Skill file structure, common patterns, example skeleton               |
| `docs/guides/linear.md`       | Linear integration — ingestion, data flow, outcome vs. implementation |
| `docs/core/principles.md`     | Behavioral principles for building skills and agents                  |

## Troubleshooting

If GG is behaving unexpectedly, see `TROUBLESHOOTING.md` in this directory for common failure modes and recovery steps.

## Templates

Templates scaffolded by `gg-new` into `.joggr/.gg/projects/{project-slug}/`.

| File                       | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `input.md`                 | Raw requirements and user intent                      |
| `discussion.md`            | Timestamped interview log                             |
| `research.md`              | Technical research findings                           |
| `overview.md`              | Project overview and phase breakdown                  |
| `plan.md`                  | Project-level plan with phase/task XML                |
| `phase.md`                 | Per-phase task plan with XML format                   |
| `codebase/stack.md`        | Technology stack reference template                   |
| `codebase/architecture.md` | Architecture and structure reference template         |
| `codebase/conventions.md`  | Code conventions and style reference template         |
| `codebase/testing.md`      | Testing patterns and framework reference template     |
| `codebase/integrations.md` | External integrations and services reference template |

## Runtime Directory

When a project is active, the working directory looks like:

```
.joggr/.gg/
├── state.json              # Workflow state
├── settings.json           # GG configuration
├── settings.local.json     # Local overrides (gitignored)
├── codebase/               # Shared codebase documentation
│   ├── stack.md
│   ├── architecture.md
│   ├── conventions.md
│   ├── testing.md
│   └── integrations.md
└── projects/               # All project directories
    └── {project-slug}/     # Per-project directory
        ├── input.md
        ├── discussion.md
        ├── research.md
        ├── overview.md
        ├── plan.md
        └── phases/
            └── <N>-<slug>/
                └── phase.md   # Per-phase task plans
```
