---
name: difit-review
description: A skill for reviewing a specific diff and showing the findings as comments inside difit (the diff viewer). Use it to review branch diffs, commit diffs, or GitHub PRs, then preload findings or code explanations into difit with `--comment` before launching it for the user.
metadata:
  internal: true
---

# Difit Review (project-local)

Follow the distributable `difit-review` skill at `skills/difit-review/SKILL.md` exactly, with these two substitutions:

- Replace every `<difit-command>` with `pnpm run dev`.
- **Do not insert `--` after `pnpm run dev`.** `pnpm run dev -- ...` breaks argument parsing in this repository.
