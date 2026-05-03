---
name: difit
description: Ask the user for a code review through difit after code changes.
---

# Difit

## Overview

This skill requests a code review from the user using difit.
Before running commands, choose `<difit-command>` using the following rule:

- If `command -v difit` succeeds, use `difit`.
- Otherwise, use `npx difit`.
- If falling back to `npx difit` would require network access in a sandboxed environment without network permission, request escalated permissions and user approval before running it.

## Review output

Set up a review output file so that user comments are captured automatically when difit closes:

```bash
REVIEW_OUTPUT="${TMPDIR}difit-review-$$.txt"
```

Pass `--review-output "$REVIEW_OUTPUT"` when launching difit. After the command exits, read the file:

```bash
cat "$REVIEW_OUTPUT"
```

- **If the file contains comments** — address each one and continue work.
- **If the file contains `(no comments)` or is absent** — ask the user: _"difit closed without any comments. Was that intentional, or did the browser close by accident? I can reopen it if needed."_ Do not silently assume the review is complete.

## Commands

- Review uncommitted changes before commit: `<difit-command> . --review-output "$REVIEW_OUTPUT"`
- Review the HEAD commit: `<difit-command> --review-output "$REVIEW_OUTPUT"`
- Review staging area changes: `<difit-command> staged --review-output "$REVIEW_OUTPUT"`
- Review unstaged changes only: `<difit-command> working --review-output "$REVIEW_OUTPUT"`

## Argument order

**`<difit-command> <target> [compare-with]` is reversed from `git diff from to`.** The first positional is the **target** (what is being reviewed, right side); the optional second positional is the **base** (what to compare against, left side). So `difit feature main` ≈ `git diff main feature`.

Basic Usage:

```bash
<difit-command> <target> --review-output "$REVIEW_OUTPUT"                    # View single commit diff. ex: difit 6f4a9b7
<difit-command> <target> [compare-with] --review-output "$REVIEW_OUTPUT"     # Compare two commits/branches. ex: difit feature main
```

## Optional Startup Comments

If there is something you want to tell the user when difit opens, attach it as startup comments with `--comment`.
This is useful for review findings, explanations, and any context the user should see directly on the diff.

```bash
<difit-command> <target> [compare-with] \
  --review-output "$REVIEW_OUTPUT" \
  --comment '{"type":"thread","filePath":"src/foobar.ts","position":{"side":"old","line":102},"body":"line 1\nline 2"}' \
  --comment '{"type":"thread","filePath":"src/example.ts","position":{"side":"new","line":{"start":36,"end":39}},"body":"Range comment for L36-L39"}'
```

- Use `type: "thread"` for each comment.
- Write comment bodies in the language the user is using.
- Use `position.side: "new"` for lines that exist on the target side of the diff.
- Use `position.side: "old"` for lines that exist only on the deleted side.
- Use range comments for issues that span multiple lines.
- Never copy secrets, tokens, passwords, API keys, private keys, or other credential-like material from the diff into `--comment` bodies or any command-line arguments.

## Including Untracked Files

For uncommitted changes, if files not yet added to git should also appear in the diff, add `--include-untracked`.

```bash
<difit-command> . --include-untracked --review-output "$REVIEW_OUTPUT"
```

## Rationale-first description (optional)

For non-trivial changes — multi-file edits, architectural changes, anything where the reviewer needs to understand _why_ before they can judge _what_ — use the `describe-changes` skill to write a layered Markdown description (rationale → approach → Mermaid diagram → code walk-through) to a temp file and pass it to difit with `--description <path>`. It renders as a Description tab that opens by default.

## Constraints

Can only be used inside a Git-managed directory.
