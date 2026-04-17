---
name: difit-describe
description: Write a layered, rationale-first Markdown description of code changes (with Mermaid diagrams and a code walk-through) to a temp file, then launch difit with `--description <path>` so the human reviewer builds understanding in the right order before reading the alphabetical file diffs.
---

# Difit Describe

## Overview

Files in a diff are listed alphabetically, so a reviewer who opens difit and starts reading top-to-bottom does not build the right mental model. This skill asks you to produce a short Markdown description that leads the reviewer through the change **in the order that makes the diff easier to understand**: rationale first, then design, then the files grouped by logical reading flow.

Before running commands, choose `<difit-command>` using the same rule as the `difit` skill:

- If `command -v difit` succeeds, use `difit`.
- Otherwise, use `npx difit`.
- If falling back to `npx difit` would require network access in a sandboxed environment without network permission, request escalated permissions and user approval before running it.

Use this skill when the change is non-trivial — e.g. spans multiple files, introduces new concepts, changes architecture, or will need the human reviewer to understand _why_ before they can judge _what_. For single-file or mechanical changes, the plain `difit` skill is enough.

## Steps

### 1. Write the description to a temp Markdown file

Create the file in `$TMPDIR` (not in the working tree) so it does not get committed:

```bash
DESC_FILE=$(mktemp -t difit-desc.XXXXXX).md
```

Write the content with this layered structure. Each layer should **add detail on top of the previous one** — a reader who stops after layer 1 still has a coherent, if coarse, understanding.

1. **Rationale** (1–3 sentences). The problem this change solves, why it needs solving now, and the intended outcome. Top of the file, no heading needed above it.
2. **Approach**. A short paragraph explaining the chosen design and the main trade-off you made. Name alternatives only if they were seriously considered.
3. **Architecture diagram**. One Mermaid diagram (flowchart or component diagram) showing the parts of the system that are touched and how they relate.

   ````markdown
   ```mermaid
   flowchart LR
     CLI -->|--description| Server
     Server -->|/api/diff| WebUI
   ```
   ````

4. **Code walk-through**. Order the sections by **logical reading flow**, not by filename. For each step:
   - a heading with the _purpose_ of the step (not the filename),
   - a reference to the primary file and line with `path:line`,
   - one or two sentences on _what_ changed there and _why this step matters before the next_.

   Add further Mermaid sequence or flow diagrams whenever they clarify control flow (e.g. request lifecycle, state transitions).

5. **Risks and follow-ups**. Anything the reviewer should pay extra attention to: known edge cases, deferred work, migrations required, rollout concerns.

Keep the whole file well under 1 MB (difit rejects larger files). Short and layered is better than long and flat.

### 2. Launch difit

```bash
<difit-command> <target> [compare-with] --description "$DESC_FILE"
```

- Use the same target resolution as the `difit` skill: `.` for uncommitted changes, `staged`, `working`, a commit-ish, or `<target> <compare-with>`.
- You can combine `--description` with `--comment` when you also have specific review findings to preload.

If the user leaves review comments, they are printed to stdout when difit exits. Continue work and address them as with the `difit` skill.

## Content constraints

- **Never** put secrets, tokens, passwords, API keys, private keys, or credential-like material into the description.
- The description is ephemeral context for this one review. It is not a replacement for code comments, commit messages, or persistent documentation — do not paste content that belongs in those places.
- Write the body in the language the user is using.
- Refer to files with `path:line` so the reviewer can navigate quickly.

## When not to use this skill

- Single-file or trivial changes — the diff speaks for itself; use the plain `difit` skill.
- Changes where the rationale is already fully captured in the commit message and the commit message is being reviewed directly.
