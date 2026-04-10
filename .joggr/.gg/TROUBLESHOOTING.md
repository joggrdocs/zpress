<!-- Auto-synced from plugin. Do not edit manually. -->

# GG Troubleshooting Guide

Reference for diagnosing and recovering broken GG sessions. Covers the most common failure modes with concrete recovery steps.

---

## Quick Diagnostic

Run this first to understand the current state before doing anything else:

```bash
# What project is active?
jog gg state get active_project

# What's the phase status?
jog gg phase list {project-slug}

# Is the working tree clean?
git status
```

---

## Common Failures

### 1. Phase is stuck at `running`

**Symptom:** A phase shows `step: execute, status: running` (or any step/running combination) but no agent is actively working.

**Cause:** An executor agent was interrupted mid-session (crash, timeout, manual stop) without updating the phase file.

**Fix:**

```bash
# Reset phase back to the previous completed step
jog gg phase state {project-slug} {phase-number} --step execute --status error
```

Then re-run the skill that was in progress (e.g. `/gg-execute`). It will pick up from the last completed wave.

If tasks were partially completed, check the phase file first:

```bash
cat .joggr/.gg/projects/{project-slug}/phases/{N}-{slug}/phase.md
```

Mark completed tasks as `done` manually if needed, then re-run the skill.

---

### 2. Agent spawned but did nothing

**Symptom:** A skill says "Spawning researcher/executor/verifier agent..." but nothing happens, or the agent returns immediately without output.

**Cause:** Usually one of:

- Codebase docs missing (for research/plan/execute/verify)
- Agent hit a tool permission error
- Context window exceeded mid-session

**Fix — check codebase docs first:**

```bash
ls .joggr/.gg/codebase/*.md 2>/dev/null | head -1
```

If empty → run `/gg-codebase` before retrying the skill.

**Fix — retry the skill:**

Re-run the skill. Background agents (researcher, executor, verifier) are stateless — retrying is always safe.

---

### 3. Codebase docs are missing or stale

**Symptom:** Skills stop at Step 0 with "Codebase docs not found. Run `/gg-codebase` first."

**Or:** Research/plan output seems wrong for the current codebase state.

**Fix:**

```bash
# Regenerate codebase docs
/gg-codebase
```

This is safe to re-run at any time. It overwrites existing docs in `.joggr/.gg/codebase/`.

---

### 4. Wrong project is active

**Symptom:** A skill is operating on the wrong project, or you see "no active project" when you expect one.

**Fix:**

```bash
# See all projects
jog gg project list

# Set the active project manually
jog gg state set active_project "{project-slug}"

# Verify
jog gg state get active_project
```

---

### 5. Phase can't move forward (state machine error)

**Symptom:** `jog gg phase state` fails with "Cannot move phase backward" or "Invalid step transition."

**Cause:** The phase is already at or past the step you're trying to set.

**Fix — check current phase status:**

```bash
jog gg phase list {project-slug}
```

Phase steps move in order: `scaffold → discuss → research → plan → execute → verify`. You cannot go backward. If a phase needs to be re-done, manually edit the phase file frontmatter:

```bash
# Edit the phase file directly
open .joggr/.gg/projects/{project-slug}/phases/{N}-{slug}/phase.md
```

Change `step` and `status` to the desired values, save, then re-run the skill.

---

### 6. `state.json` is corrupted or missing

**Symptom:** GG commands fail with JSON parse errors, or `jog gg state get` returns nothing.

**Fix:**

```bash
# Reset state to empty
echo '{"active_project":null}' > .joggr/.gg/state.json
```

Then set the active project again:

```bash
jog gg state set active_project "{project-slug}"
```

---

### 7. Skills aren't showing up in Claude Code / Cursor

**Symptom:** `/gg-new`, `/gg-plan`, etc. don't appear in the slash command menu.

**Cause:** GG was not initialized, or skills were written to the wrong provider directory.

**Fix:**

```bash
# Re-run init to regenerate all skill files
jog init
```

Select "Set up guided workflows (GG)" and choose your provider. This regenerates all skill and agent files.

Verify skills exist:

```bash
ls ~/.claude/skills/gg-*/SKILL.md
```

---

### 8. An executor agent made incorrect changes

**Symptom:** `/gg-execute` completed but the changes are wrong or broke something.

**Fix — revert the wave:**

```bash
# See checkpoint commits from this session
jog gg checkpoint log

# Revert to before the bad wave
git revert HEAD~N  # N = number of commits to undo
```

Then mark the affected tasks back to `todo` in the phase file, and re-run `/gg-execute`.

---

### 9. Plan looks wrong after `/gg-plan`

**Symptom:** The generated phase tasks don't match what you wanted, or phases are structured incorrectly.

**Fix — re-plan:**

Re-run `/gg-plan` on the same phase. The planner will re-read `discussion.md` and `research.md` and regenerate the plan. Existing phase files are overwritten.

If the discussion itself is wrong, run `/gg-discuss` first to update it, then re-run `/gg-plan`.

---

### 10. Phase stuck at `running` after cancelling `/gg-plan`

**Symptom:** You cancelled `/gg-plan` mid-session (closed the terminal, hit escape, or chose "cancel" when the planner asked for approval). Now the phase shows `step: plan, status: running` and `/gg-plan` won't re-enter.

**Cause:** The plan skill sets the phase to `running` before spawning the planner agent. If the session is cancelled before the planner finishes, the phase is never reset.

**Fix:**

```bash
jog gg phase state {project-slug} {phase-number} --step plan --status error
```

Then re-run `/gg-plan`.

---

### 11. `/gg-discuss` ended too early

**Symptom:** The discussion ended before you finished giving requirements. The skill exited after you said something like "move on" or "done with that" in a normal response, and now `discussion.md` is incomplete.

**Cause:** The skill watches for exit signals in your responses ("enough", "move on", "done", "skip"). These words can appear in legitimate discussion responses and trigger an early exit.

**Fix:**

Re-run `/gg-discuss` on the same project. The skill appends to `discussion.md` — it will not overwrite previous entries. Just continue from where you left off.

```bash
# Verify the current discussion state
cat .joggr/.gg/projects/{project-slug}/discussion.md
```

---

### 12. Research or codebase docs look empty or incomplete

**Symptom:** `/gg-research` or `/gg-codebase` completed successfully, but when you read the output files they contain mostly template placeholders, section headers with no content, or very little actual information about the codebase.

**Cause:** The agent wrote the file (passing validation) but didn't populate it with meaningful findings — usually because it couldn't find relevant code, hit a file limit, or the codebase docs were too sparse to work from.

**Fix for research:**

```bash
cat .joggr/.gg/projects/{project-slug}/research.md
```

If mostly empty, re-run `/gg-research`. Before retrying, make sure `/gg-codebase` has been run and the codebase docs have real content.

**Fix for codebase docs:**

```bash
ls -la .joggr/.gg/codebase/*.md
cat .joggr/.gg/codebase/stack.md
```

If files are tiny (< 1KB) or mostly headers, re-run `/gg-codebase`. You can optionally point it at a specific focus area (e.g., `tech`, `testing`) to get more targeted output.

---

### 13. Wave aborted — partial commits left in repo

**Symptom:** You chose "Abort phase" during `/gg-execute` after some tasks in a wave succeeded and were committed, but others failed. The phase is now at `error` but there are partial commits in your git history that don't represent a complete feature.

**Fix — view what was committed:**

```bash
jog gg checkpoint log
git log --oneline -10
```

**Option A — keep the partial work and continue:**

Fix the failed task manually, mark it done, and re-run `/gg-execute`:

```bash
jog gg task set {project-slug} {phase-number} {task-id} --status done
jog gg phase state {project-slug} {phase-number} --step execute --status error
```

Then re-run `/gg-execute`.

**Option B — revert the partial wave and start over:**

```bash
# Revert N commits (N = number of checkpoint commits from the partial wave)
git revert HEAD~N --no-commit
git commit -m "revert: undo partial wave for {project-slug}"
```

Then reset task statuses back to `todo` and re-run `/gg-execute`.

---

### 14. Task is stuck at `skip` but needs to be retried

**Symptom:** A task was marked `skip` (either by you or automatically during a failed wave), but you want to run it now. `/gg-execute` skips over it because its status is `skip`.

**Fix:**

```bash
jog gg task set {project-slug} {phase-number} {task-id} --status todo
```

Then re-run `/gg-execute`. The task will be included in the next wave grouping.

Verify the task ID first:

```bash
jog gg phase get {project-slug} {phase-number}
```

---

## Manual State Recovery Reference

| Problem              | Command                                                      |
| -------------------- | ------------------------------------------------------------ |
| Check active project | `jog gg state get active_project`                            |
| Set active project   | `jog gg state set active_project "{slug}"`                   |
| List all projects    | `jog gg project list`                                        |
| List phases + status | `jog gg phase list {slug}`                                   |
| Reset a stuck phase  | `jog gg phase state {slug} {N} --step {step} --status error` |
| Retry a skipped task | `jog gg task set {slug} {N} {task-id} --status todo`         |
| View checkpoint log  | `jog gg checkpoint log`                                      |
| Squash checkpoints   | `jog gg checkpoint squash "{message}"`                       |
| Check codebase docs  | `ls .joggr/.gg/codebase/*.md`                                |
| Regenerate GG files  | `jog init` → select GG setup                                 |

---

## When to Ask for Help

If none of the above fixes work, the most useful context to share is:

```bash
jog gg info
jog gg phase list {project-slug}
cat .joggr/.gg/projects/{project-slug}/phases/{N}-{slug}/phase.md
git log --oneline -10
```
