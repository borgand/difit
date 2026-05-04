---
name: describe-changes
description: Write a layered, rationale-first Markdown description of code changes (rationale, approach, Mermaid diagram, code walk-through, risks) and show it to the user — either at a caller-supplied path or by opening a temp file in the user's detected editor.
---

# Describe Changes

## Overview

Files in a diff are listed alphabetically, so reviewers who start reading top-to-bottom do not build the right mental model first. This skill asks you to produce a short Markdown description that leads the reader through the change **in the order that makes the diff easier to understand**: rationale first, then design, then the files grouped by logical reading flow.

Use this skill when the change is non-trivial — e.g. spans multiple files, introduces new concepts, changes architecture, or will need the reviewer to understand _why_ before they can judge _what_. Also use it for small-but-surprising changes: a bug fix whose root cause lies far from the symptom, a contributing bug fixed along the way, or any change where a reader unfamiliar with the constraint would start asking questions.

For single-file or mechanical changes, the diff speaks for itself — skip this skill.

## Steps

### 1. Determine the output path

**If the caller supplies an output path**, write the description there and proceed to step 2. Skip the editor-open and preview steps below — the caller owns the file and will handle presentation.

**Otherwise**, create a temp file:

```bash
DESC_FILE=$(mktemp -t describe-changes.XXXXXX).md
```

After writing the description, help the user view it:

- Check whether `cursor` or `code` is on PATH. If found, open the file detached and non-blocking (e.g. `cursor "$DESC_FILE" &` or `code "$DESC_FILE"`). Do not wait for the editor to close.
- If neither is available but `$VISUAL` or `$EDITOR` is set and the session appears interactive, use that.
- In all cases, also print the file path clearly and output an **inline preview** (at minimum the Rationale and Approach paragraphs) so the user can copy-paste into a Markdown viewer if no editor opened.

Never block the agent waiting for the user to close the editor.

### 2. Write the description

Use this layered structure. Each layer should **add detail on top of the previous one** — a reader who stops after layer 1 still has a coherent, if coarse, understanding.

1. **Rationale** (1–3 sentences). The problem this change solves, why it needs solving now, and the intended outcome. Top of the file, no heading above it.
2. **Approach**. A short paragraph explaining the chosen design and the main trade-off. Name alternatives only if they were seriously considered.
3. **Architecture diagram**. One Mermaid diagram (flowchart or component diagram) showing the parts of the system touched and how they relate.

   ````markdown
   ```mermaid
   flowchart LR
     A --> B --> C
   ```
   ````

   **Mermaid syntax rules** — these prevent the most common parse failures:
   - Quote every label that isn't a single plain word: `A["My label: detail"]`, never `A[My label: detail]`. Colons, slashes, parentheses, and Unicode characters are safe inside quoted labels.
   - Use `\n` for line breaks inside a quoted label: `A["line one\nline two"]`. Do not use HTML.
   - Subgraphs with multi-word titles use the explicit form: `subgraph id ["Title with spaces"]`.
   - Edge labels: prefer `A -->|label| B`; if the label contains `|`, `]`, or quotes, use `A -- "label" --> B`.

4. **Code walk-through**. Order sections by **logical reading flow**, not by filename. For each step:
   - a heading with the _purpose_ of the step (not the filename),
   - a reference to the primary file and line with `path:line`,
   - one or two sentences on _what_ changed there and _why this step matters before the next_.

   Add further Mermaid sequence or flow diagrams whenever they clarify control flow (request lifecycle, state transitions, etc.). Follow the same syntax rules as step 3.

5. **Risks and follow-ups**. Anything the reviewer should pay extra attention to: known edge cases, deferred work, migrations needed, rollout concerns.

Keep the file well under 1 MB. Short and layered is better than long and flat. Write in the language the user is using.

## Content constraints

- **Never** put secrets, tokens, passwords, API keys, private keys, or credential-like material into the description.
- The description is ephemeral context for this one review — not a replacement for code comments, commit messages, or persistent documentation.
- Refer to files with `path:line` so readers can navigate quickly.

## Related skills

- **difit-review** — for non-trivial diffs, calls this skill with an explicit output path, then opens the result in difit via `--description`.
