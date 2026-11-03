#!/usr/bin/env python3
"""
Portfolio Entropy Dashboard (innovate)
Scores open PRs for close-candidate prioritization.
Run with GitHub token in env for live counts.
This is a stub that documents the scoring model; full automation requires PAT.
"""
import os
import sys

def score_pr(age_days: int, ci_green: bool, file_overlap: bool, docs_only: bool, jules: bool) -> float:
    """Higher score = higher priority close or merge candidate."""
    score = 0.0
    if age_days > 14:
        score += 2.0
    if age_days > 30:
        score += 3.0
    if not ci_green:
        score += 1.5  # needs attention
    if file_overlap:
        score -= 2.0  # do not auto-merge
    if docs_only:
        score += 3.0  # easy prune
    if jules:
        score += 1.0  # micro-opt candidate
    return max(0.0, score)

def main():
    print("Portfolio Entropy Dashboard — scoring model")
    print("Target open PRs <10 per repo.")
    print("Sample scoring (age, ci_green, overlap, docs_only, jules):")
    samples = [
        (20, True, False, True, False),
        (5, True, False, False, True),
        (45, False, True, False, False),
    ]
    for s in samples:
        print(f"  {s} -> score {score_pr(*s)}")
    print("Full live run requires GITHUB_TOKEN and repo list: QuicksilverV1, Conduit, Resonance.")
    print("Do not auto-close without owner review. Innovate under constraints.")

if __name__ == "__main__":
    main()
