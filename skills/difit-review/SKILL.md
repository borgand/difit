---
name: difit-review
description: A skill for reviewing a specific diff and showing the findings as comments inside difit (the diff viewer). Use it to review branch diffs, commit diffs, or GitHub PRs, then preload findings or code explanations into difit with `--comment` before launching it for the user.
---

# Difit Review

## Overview

This skill launches a requested git diff in a viewer that is easy for humans to read. At the same time, the agent can attach arbitrary comments via the `--comment` option and, for non-trivial changes, a rationale-first description via `--description`.

Before running commands, choose `<difit-command>` using the following rule:

- If `command -v difit` succeeds, use `difit`.
- Otherwise, use `npx difit`.
- If falling back to `npx difit` would require network access in a sandboxed environment without network permission, request escalated permissions and user approval before running it.

## Steps

1. **Identify the target diff and run code review.**
   - Inspect the diff specified by the user. This may be a local git revision, a GitHub URL, a patch file, or something similar.
   - Check which code reviewer skills are available (e.g. `code-reviewer`, `security-reviewer`, `silent-failure-hunter`). These apply to code changes only — skip this step for diffs that are purely non-code (Markdown, YAML, skill definitions, config files). If applicable, invoke them now and collect their findings as the basis for `--comment` entries.
   - For PR reviews, inspect the PR locally and keep the review result limited to difit output. Do not post comments back to remote GitHub.

2. **Judge whether the change is non-trivial.**

   A change is non-trivial if any of these apply:
   - More than ~20–50 lines changed across the diff.
   - Spans multiple files in a non-mechanical way.
   - Introduces or removes a concept, changes architecture, or alters a shared interface.
   - Small-but-surprising: the bug fix root cause lies outside the obvious spot, a contributing bug is fixed alongside the stated change, or there are non-obvious ordering or invariant constraints a reviewer unfamiliar with the codebase would question.

   If non-trivial, continue to step 3. Otherwise skip to step 4.

3. **Generate a description using the `describe-changes` skill.**

   Create a temp file path and pass it to `describe-changes` as the output path:

   ```bash
   DESC_FILE="${TMPDIR}difit-desc-$$.md"
   ```

   Invoke the `describe-changes` skill, passing `output_path="$DESC_FILE"` as the args string. It will write a layered Markdown description (rationale → approach → diagram → code walk-through → risks) to that file and skip the editor-open/preview step since a path was supplied.

4. **Attach the prepared comments and launch difit.**

   Set up the review output path first:

   ```bash
   REVIEW_OUTPUT="${TMPDIR}difit-review-$$.txt"
   ```

   When a description was generated:

   ```bash
   <difit-command> <target> [compare-with] \
     --review-output "$REVIEW_OUTPUT" \
     --description "$DESC_FILE" \
     --comment '{"type":"thread","filePath":"src/foobar.ts","position":{"side":"old","line":102},"body":"line 1\nline 2"}' \
     --comment '{"type":"thread","filePath":"src/example.ts","position":{"side":"new","line":{"start":36,"end":39}},"body":"Range comment for L36-L39"}'
   ```

   Without a description (trivial change):

   ```bash
   <difit-command> <target> [compare-with] \
     --review-output "$REVIEW_OUTPUT" \
     --comment '...'
   ```

   - **Argument order** — `<difit-command> <target> [compare-with]` is **reversed from `git diff from to`**. The first positional is the **target** (what is being reviewed, right side); the optional second positional is the **base** (what to compare against, left side). So `difit feature main` ≈ `git diff main feature`.
   - **difit launch options**
     - For uncommitted changes use `<difit-command> .`, for working tree changes use `<difit-command> working`, and for staged changes use `<difit-command> staged`.
     - For stdin input, use a form such as `diff -u file1.txt file2.txt | <difit-command>`.
   - **Comment arguments**
     - Use `type: "thread"` for each comment.
     - Write comment bodies in the language the user is using.
     - Use `position.side: "new"` for lines that exist on the target side of the diff.
     - Use `position.side: "old"` for lines that exist only on the deleted side.
     - Use range comments for issues that span multiple lines.
     - Never copy secrets, tokens, passwords, API keys, private keys, or other credential-like material from the diff into `--comment` bodies or any command-line arguments.
   - **Additional argument for files not yet added to git**
     - For uncommitted changes, if you decide files not yet added to git should also appear in the diff, add `--include-untracked`.

5. **Read the review output and react.**

   After difit exits, read the output file:

   ```bash
   cat "$REVIEW_OUTPUT"
   ```

   - **If the file contains comments** — integrate every comment and reply into your work. Address each point, then summarize what was done.
   - **If the file contains `(no comments)` or is absent** — ask the user: _"difit closed without any comments. Was that intentional, or did the browser close by accident? I can reopen it if needed."_ Do not silently assume the review is complete.
