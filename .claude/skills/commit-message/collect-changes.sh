#!/usr/bin/env bash
# collect-changes.sh — gather everything needed to write an accurate commit message.
#
# Prints a single structured report: branch/remote state, a file-level stat,
# the real diff of tracked files (noise excluded, byte-capped), and previews of
# untracked files (which `git add .` WILL commit but `git diff` never shows).
#
# Portable to bash 3.2 (macOS stock) — no mapfile, no associative arrays.
# Env knobs: MAX_DIFF_BYTES, MAX_NEW_FILES, MAX_NEW_FILE_LINES

set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository"
  exit 1
}
cd "$root" || exit 1

MAX_DIFF_BYTES="${MAX_DIFF_BYTES:-60000}"
MAX_NEW_FILES="${MAX_NEW_FILES:-15}"
MAX_NEW_FILE_LINES="${MAX_NEW_FILE_LINES:-40}"

# Shown in the stat, excluded from the diff body — lockfiles and generated
# output are noise in a commit message but still matter as "this changed".
set -- . \
  ':(exclude)pnpm-lock.yaml' \
  ':(exclude)package-lock.json' \
  ':(exclude)yarn.lock' \
  ':(exclude)bun.lockb' \
  ':(exclude)*.lock' \
  ':(exclude)*.tsbuildinfo' \
  ':(exclude)*.snap' \
  ':(exclude)dist' \
  ':(exclude)build' \
  ':(exclude).next'

untracked_list=$(mktemp "${TMPDIR:-/tmp}/collect-changes.XXXXXX")
trap 'rm -f "$untracked_list"' EXIT

# symbolic-ref (not rev-parse) — it reports the right branch on an unborn HEAD,
# where `rev-parse --abbrev-ref HEAD` both fails AND prints "HEAD".
branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "HEAD (detached)")
remote=$(git config --get "branch.$branch.remote" 2>/dev/null || true)
[ -n "$remote" ] || remote=origin
upstream=$(git rev-parse --abbrev-ref '@{upstream}' 2>/dev/null || echo "(none — first push needs -u)")

echo "===== REPO STATE ====="
echo "branch:          $branch"
echo "push remote:     $remote"
echo "upstream:        $upstream"
echo "push command:    git push $remote $branch"
echo
echo "recent subjects (match this style):"
git log --pretty=format:'  %s' -10 2>/dev/null || echo "  (no commits yet)"
echo
echo

# ---- what `git add .` would actually commit --------------------------------
git ls-files --others --exclude-standard >"$untracked_list" 2>/dev/null || true
# `grep -c` prints "0" AND exits 1 on no match, so `|| echo 0` would yield
# "0\n0" and poison every later `-eq` test. Swallow the status, not the output.
untracked_count=$(grep -c . "$untracked_list" 2>/dev/null || true)
[ -n "$untracked_count" ] || untracked_count=0
tracked_changes=$(git status --porcelain --untracked-files=no)

if [ -z "$tracked_changes" ] && [ "$untracked_count" -eq 0 ]; then
  echo "===== NO CHANGES ====="
  echo "Working tree is clean. There is nothing to commit — stop here."
  exit 0
fi

echo "===== STATUS (porcelain) ====="
git status --porcelain
echo
echo "===== STAT: staged (HEAD -> index) ====="
git diff --cached --stat || true
echo
echo "===== STAT: unstaged (index -> worktree) ====="
git diff --stat || true
echo
if [ "$untracked_count" -gt 0 ]; then
  echo "===== UNTRACKED ($untracked_count new file(s) — 'git add .' will commit these) ====="
  sed 's/^/  /' "$untracked_list"
  echo
fi

# ---- the actual content ----------------------------------------------------
echo "===== DIFF: tracked changes (staged + unstaged, noise excluded) ====="
diff_out=$(
  {
    git diff --cached -M -- "$@"
    git diff -M -- "$@"
  } 2>/dev/null
)
diff_bytes=${#diff_out}
if [ "$diff_bytes" -gt "$MAX_DIFF_BYTES" ]; then
  printf '%s' "$diff_out" | head -c "$MAX_DIFF_BYTES"
  echo
  echo "... [TRUNCATED: ${diff_bytes} bytes total, showed ${MAX_DIFF_BYTES}."
  echo "     Rely on the STAT sections above for the files you cannot see here.]"
elif [ "$diff_bytes" -eq 0 ]; then
  echo "(no tracked-file content changes — this commit is new files and/or excluded noise only)"
else
  printf '%s\n' "$diff_out"
fi
echo

if [ "$untracked_count" -gt 0 ]; then
  echo "===== PREVIEW: new file contents (first $MAX_NEW_FILE_LINES lines each) ====="
  shown=0
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if [ "$shown" -ge "$MAX_NEW_FILES" ]; then
      echo "... [$((untracked_count - shown)) more new files not previewed — see the list above]"
      break
    fi
    shown=$((shown + 1))
    echo "--- $f"
    if [ -d "$f" ]; then
      echo "    (directory)"
    elif [ ! -s "$f" ]; then
      echo "    (empty file)"
    elif ! grep -Iq . "$f" 2>/dev/null; then
      echo "    (binary — $(wc -c <"$f" | tr -d ' ') bytes)"
    else
      sed -n "1,${MAX_NEW_FILE_LINES}p" "$f" | sed 's/^/    /'
    fi
    echo
  done <"$untracked_list"
fi

echo "===== END ====="
