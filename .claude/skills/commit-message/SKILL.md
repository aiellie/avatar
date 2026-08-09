---
name: commit-message
description: Inspect the current code changes and write a git commit message, returned as a ready-to-run `git add . / git commit -m / git push origin main` block. Use when asked to commit, write a commit message, stage and push, "what should I commit this as", or wrap up work with a git message.
---

# Commit message from the current changes

Reads the working tree, then returns **one bash block** the user can run.
This skill **writes the message; it does not run the commands** — see [Do not auto-run](#do-not-auto-run).

Paths below are relative to the repo root (`/Users/stashd/Desktop/designellie.ai`).

## Step 1 — Run the collector (always; never skip)

```bash
./.claude/skills/commit-message/collect-changes.sh
```

That is the whole harness. It prints, in one pass: branch + exact push
command, the last 10 commit subjects (to match style), porcelain status,
staged and unstaged stats, **the list and contents of untracked files**,
and the tracked diff with lockfiles/build output excluded and capped at
60 000 bytes.

**Do not substitute `git diff`.** `git diff` shows nothing for untracked
files. In this repo that meant a bare `git diff` displayed a spinner tweak
and a deleted page while completely missing 14 new files — the actual
change. `git add .` commits those files; your message must describe them.

If the output is `===== NO CHANGES =====`, stop and say the tree is clean.
Do not invent a commit.

Knobs, if a diff is huge or has many new files:

```bash
MAX_DIFF_BYTES=20000 MAX_NEW_FILE_LINES=15 ./.claude/skills/commit-message/collect-changes.sh
```

## Step 2 — Write the message

Read the report and describe **what changed and why**, not the file list.

- Conventional-commit prefix. This repo's history uses them (`feat: initial commit`).
  `feat:` `fix:` `refactor:` `style:` `chore:` `docs:` `perf:` `test:`
- Imperative mood: "add", not "added"/"adds".
- Subject ≤ 72 characters, no trailing period.
- One line. Everything goes in the single `-m` subject.
- Pick the prefix for the *dominant* change. New feature + incidental
  formatting is `feat:`, not `style:`.
- Ignore files the report excluded as noise (lockfiles, `.next`, `*.tsbuildinfo`).
  They are consequences, not intent.

**Characters that are forbidden in the message** — it is interpolated inside
double quotes, so these execute or break the command. Verified, not theoretical:

| Never use | Why |
|---|---|
| `` ` `` backtick | **Executes as a shell command.** ``git commit -m "fix: update `useAuth` hook"`` commits as `fix: update  hook` after running `useAuth`. Backticking a code identifier is the natural thing to write here and it silently corrupts the message. |
| `"` double quote | Terminates the string early. |
| `$(...)` or `$VAR` | Substituted by the shell. |
| `!` | History expansion in interactive shells. |

Write `useAuth` bare, with no quoting of any kind.

## Step 3 — Return this block

Use the **`push command:`** line from the report for the third line. On this
repo that is `git push origin main`, matching the requested format. If the
report shows a different branch, use that branch — never push a feature
branch to `main`.

````
```bash
git add .
git commit -m "feat: add design system data table with filtering and pagination"
git push origin main
```
````

Keep all three lines in the one block, as shown. Add one short sentence
above it saying what the commit covers. Nothing else.

If the report showed `upstream: (none — first push needs -u)`, use
`git push -u origin main` on the last line instead.

## Do not auto-run

Return the block; let the user run it. `git push` publishes to
`github.com/aiellie/designellie.ai` and is not something to do unprompted.
Run the commands yourself only if the user explicitly says to commit and
push (e.g. "commit and push it"), and confirm the message with them first.

## Gotchas

- **The working tree moves while you work.** During this skill's own
  authoring, the untracked count went 7 → 14 between two runs of the
  collector, seconds apart, because files were still being written. If more
  than a moment has passed since Step 1, re-run the collector before
  emitting the block.
- **`.claude/` is untracked here**, so `git add .` commits this skill too.
  That is usually fine — just don't let it drive the message. A commit that
  is 14 feature files plus this script is still `feat:`.
- **Empty files are invisible in a diff but real in a commit.** The report
  flags them as `(empty file)` — `app/(home)/components/columns.tsx` was
  0 bytes and would still have been committed.
- **A stale `git status` from earlier in the conversation is not evidence.**
  This session began with a snapshot showing one modified file; by the time
  the collector ran, a whole feature directory existed.
- **Deletions matter.** ` D app/page.tsx` in porcelain status means the file
  is gone and `git add .` stages that removal. If a deletion is the point of
  the change, say so in the message.

## Troubleshooting

Errors actually hit while building this, with the fixes already applied to
the script — listed so you recognize them if you edit it.

| Symptom | Cause / fix |
|---|---|
| `mapfile: command not found`, then `untracked: unbound variable` | macOS ships **bash 3.2**; `mapfile` is a bash 4 builtin. The script is deliberately array-free — keep it that way. |
| `[: 0\n0: integer expression expected`, and a clean tree never reports `NO CHANGES` | `grep -c` prints `0` *and* exits 1, so `|| echo 0` yielded two lines. Swallow the exit status (`|| true`), not the output. |
| Branch prints as `HEAD` twice on a repo with no commits | `git rev-parse --abbrev-ref HEAD` fails *and* prints `HEAD` on an unborn branch. The script uses `git symbolic-ref --short HEAD`. |
| `ERROR: not inside a git repository` | Exit 1. `cd` into the repo. |
| `Permission denied` running the script | `chmod +x .claude/skills/commit-message/collect-changes.sh` |
