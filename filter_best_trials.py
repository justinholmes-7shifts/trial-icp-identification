#!/usr/bin/env python3
"""
Filter & Prioritize Trials for Manual Research

Since we don't have website URLs in the trial data, this tool identifies
the highest-value leads that are worth manual research effort.
"""

import csv
from pathlib import Path


def score_research_priority(trial: dict) -> int:
    """
    Score trial for research priority (0-100).

    Higher score = more worth researching.
    """
    score = 0

    # Tier priority (40 points max)
    tier = trial.get('tier', '')
    if tier == 'Tier 1':
        score += 40
    elif tier == 'Tier 2':
        score += 35
    elif tier == 'Tier 3':
        score += 20
    elif tier == 'Tier 4':
        score += 10

    # Multi-location (+15 points)
    num_locs = trial.get('num_locations', '1')
    if num_locs in ['2-5', '6-15', '16+']:
        score += 15

    # Professional email domain (+10 points)
    email = trial.get('email', '')
    if email and '@' in email:
        domain = email.split('@')[1].lower()
        # Not Gmail/Yahoo/AOL/Outlook
        if domain not in ['gmail.com', 'yahoo.com', 'aol.com', 'outlook.com', 'hotmail.com']:
            score += 10

    # Has POS system in notes (+5 points)
    notes = trial.get('notes', '')
    if 'POS:' in notes and 'POS: Other' not in notes and 'POS: None' not in notes:
        score += 5

    # High employee count declared in notes (+10 points)
    if '31 To 50' in notes or '51 Plus' in notes:
        score += 10

    # Identified restaurant type (+5 points)
    restaurant_type = trial.get('restaurant_type', '')
    if restaurant_type and restaurant_type != 'Unknown':
        score += 5

    # Has actual employees in notes (look for "X employees" pattern) (+20 points)
    import re
    emp_match = re.search(r'(\d+)\s*employees', notes)
    if emp_match and int(emp_match.group(1)) > 0:
        score += 20

    return score


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Filter and prioritize trials for research')
    parser.add_argument('--input', default='data/input/first_500_trials.csv', help='Input CSV')
    parser.add_argument('--output', default='data/output/priority_research_queue.csv', help='Output CSV')
    parser.add_argument('--min-score', type=int, default=30, help='Minimum priority score')
    parser.add_argument('--limit', type=int, help='Limit number of results')

    args = parser.parse_args()

    print("=" * 70)
    print("TRIAL RESEARCH PRIORITY FILTER")
    print("=" * 70)
    print()

    # Read trials
    with open(args.input, 'r', encoding='utf-8') as f:
        trials = list(csv.DictReader(f))

    print(f"📊 Total trials: {len(trials)}")

    # Score each trial
    scored_trials = []
    for trial in trials:
        # Skip non-restaurants
        if trial.get('is_restaurant') != 'Yes':
            continue

        # Skip "your restaurant" test accounts
        if trial.get('company_name', '').lower() == 'your restaurant':
            continue

        score = score_research_priority(trial)
        if score >= args.min_score:
            trial['research_priority_score'] = score
            scored_trials.append(trial)

    # Sort by score (highest first)
    scored_trials.sort(key=lambda x: x['research_priority_score'], reverse=True)

    # Apply limit
    if args.limit:
        scored_trials = scored_trials[:args.limit]

    print(f"✅ Filtered to {len(scored_trials)} high-priority trials (score >= {args.min_score})")
    print()

    # Show tier breakdown
    tier_counts = {}
    for trial in scored_trials:
        tier = trial.get('tier', 'Unknown')
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

    print("Tier Breakdown:")
    for tier in ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']:
        count = tier_counts.get(tier, 0)
        if count > 0:
            print(f"  {tier}: {count}")

    # Show score distribution
    print()
    print("Score Distribution:")
    score_ranges = {'80-100': 0, '60-79': 0, '40-59': 0, '30-39': 0}
    for trial in scored_trials:
        score = trial['research_priority_score']
        if score >= 80:
            score_ranges['80-100'] += 1
        elif score >= 60:
            score_ranges['60-79'] += 1
        elif score >= 40:
            score_ranges['40-59'] += 1
        else:
            score_ranges['30-39'] += 1

    for range_name, count in score_ranges.items():
        if count > 0:
            print(f"  {range_name}: {count}")

    # Show top 10
    print()
    print("=" * 70)
    print("TOP 10 PRIORITY LEADS FOR RESEARCH")
    print("=" * 70)
    print()

    for i, trial in enumerate(scored_trials[:10], 1):
        print(f"{i}. {trial['company_name']} (Score: {trial['research_priority_score']})")
        print(f"   Tier: {trial['tier']}")
        print(f"   Email: {trial.get('email', 'N/A')}")
        print(f"   Declared: {trial.get('Declared Number of Locations', 'N/A')} locations, {trial.get('Declared Number Of Employees', 'N/A')} employees")

        employee_count = trial.get('Employee Count', '0')
        if employee_count and int(employee_count) > 0:
            print(f"   ⭐ Has {employee_count} actual employees in system")

        print()

    # Write output
    if scored_trials:
        fieldnames = list(scored_trials[0].keys())
        with open(args.output, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(scored_trials)

    print("=" * 70)
    print(f"📄 Output saved to: {args.output}")
    print()
    print("NEXT STEPS:")
    print("1. Review the top 20-50 leads in the output file")
    print("2. Use Task tool with research agent to investigate each one")
    print("3. For each lead, research:")
    print("   - Find website")
    print("   - Validate location count")
    print("   - Count job postings")
    print("   - Detect parent company")
    print("   - Assign confidence score")
    print("=" * 70)


if __name__ == '__main__':
    main()
