#!/usr/bin/env python3
"""
Get next 50 restaurant trials (leads 51-100) from all scored trials
and save them for Apify processing.
"""

import csv

def get_next_50_restaurant_trials():
    """Extract next 50 restaurant trials from scored trials"""

    input_file = 'data/output/scored_trials.csv'
    output_file = 'data/output/next_50_restaurant_leads.csv'

    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        all_trials = list(reader)

    # Filter to restaurants only
    restaurants = [t for t in all_trials if t['is_restaurant'] == 'Yes']

    print(f"📊 Total trials: {len(all_trials)}")
    print(f"🍽️  Total restaurants: {len(restaurants)}")

    # Get the next 50 (indices 50-99)
    next_50 = restaurants[50:100] if len(restaurants) >= 100 else restaurants[50:]

    print(f"🎯 Extracting next batch: {len(next_50)} restaurants")
    print(f"   Range: #{51} to #{50 + len(next_50)}")

    # Write to new CSV
    if next_50:
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=next_50[0].keys())
            writer.writeheader()
            writer.writerows(next_50)

        print(f"\n✅ Saved to: {output_file}")

        # Show preview with tiers
        print(f"\nPreview of next 50 restaurant leads:")
        print("="*70)

        tier_counts = {}
        for trial in next_50:
            tier = trial.get('tier', 'Unknown')
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        print("\nTier Distribution:")
        for tier in ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5']:
            count = tier_counts.get(tier, 0)
            if count > 0:
                print(f"  {tier}: {count}")

        print("\nFirst 10:")
        for i, trial in enumerate(next_50[:10], 51):
            tier = trial.get('tier', 'Unknown')
            locs = trial.get('num_locations', '?')
            name = trial['company_name']
            print(f"{i}. {name} ({tier}, {locs} locs)")

        if len(next_50) > 10:
            print(f"... and {len(next_50) - 10} more")
    else:
        print("❌ No more restaurants available")

if __name__ == '__main__':
    get_next_50_restaurant_trials()
