#!/usr/bin/env bash
# entropy-dashboard.sh — Portfolio PR entropy report and close-candidate prioritization
# Usage: ./scripts/entropy-dashboard.sh
# Requires: gh CLI authenticated, jq
# Output: ranked list of open PRs with scores for prune decisions
# Report-only. Does not close or merge anything.

set -euo pipefail

REPOS=("cknowlesbadluck/QuicksilverV1" "cknowlesbadluck/Resonance" "cknowlesbadluck/Conduit")
NOW=$(date +%s)

echo "=== Portfolio Entropy Dashboard — $(date -u +%Y-%m-%dT%H:%MZ) ==="
echo "Target: <10 open PRs per repo"
echo

for REPO in "${REPOS[@]}"; do
  echo "## $REPO"
  COUNT=$(gh pr list --repo "$REPO" --state open --json number --jq 'length')
  echo "Open PRs: $COUNT"
  if [ "$COUNT" -eq 0 ]; then
    echo "  (clean)"
    echo
    continue
  fi

  # Fetch open PRs with age, title, author, labels
  gh pr list --repo "$REPO" --state open --limit 100 --json number,title,createdAt,author,labels,isDraft \
    --jq '.[] | {number, title, createdAt, author: .author.login, labels: [.labels[].name], isDraft}' \
    | while IFS= read -r line; do
      NUM=$(echo "$line" | jq -r .number)
      TITLE=$(echo "$line" | jq -r .title)
      CREATED=$(echo "$line" | jq -r .createdAt)
      AUTHOR=$(echo "$line" | jq -r .author)
      LABELS=$(echo "$line" | jq -r '.labels | join(",")')
      DRAFT=$(echo "$line" | jq -r .isDraft)

      # Age in days
      CREATED_TS=$(date -d "$CREATED" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CREATED" +%s 2>/dev/null || echo 0)
      AGE_DAYS=$(( (NOW - CREATED_TS) / 86400 ))

      # Score: higher = stronger close candidate
      SCORE=0
      REASONS=()

      if echo "$TITLE" | grep -qi "bolt\|jules\|micro\|localeCompare\|sameRecord"; then
        SCORE=$((SCORE + 50))
        REASONS+=("Jules/Bolt micro-opt")
      fi
      if echo "$TITLE" | grep -qi "docs:\|audit\|roadmap\|portfolio"; then
        SCORE=$((SCORE + 30))
        REASONS+=("docs-only")
      fi
      if [ "$AGE_DAYS" -gt 14 ]; then
        SCORE=$((SCORE + 20))
        REASONS+=("age>${AGE_DAYS}d")
      elif [ "$AGE_DAYS" -gt 7 ]; then
        SCORE=$((SCORE + 10))
        REASONS+=("age>${AGE_DAYS}d")
      fi
      if [ "$DRAFT" = "true" ]; then
        SCORE=$((SCORE + 15))
        REASONS+=("draft")
      fi
      if [ "$AUTHOR" != "cknowlesbadluck" ]; then
        SCORE=$((SCORE + 5))
      fi

      # Flag as close-candidate if score >= 40
      FLAG=""
      if [ "$SCORE" -ge 40 ]; then
        FLAG=" [CLOSE-CANDIDATE score=$SCORE]"
      fi

      REASON_STR=$(IFS=", "; echo "${REASONS[*]:-}")
      echo "  #$NUM $TITLE$FLAG"
      if [ -n "$REASON_STR" ]; then
        echo "    age=${AGE_DAYS}d author=$AUTHOR reasons: $REASON_STR"
      fi
    done
  echo
done

echo "=== End of report. Review CLOSE-CANDIDATE items for manual prune. ==="
