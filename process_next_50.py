#!/usr/bin/env python3
"""
Get next 50 leads from priority queue (leads 51-100) and process them with Apify.
Then re-tier them based on actual Google Maps data instead of declared data.
"""

import csv
import sys

def get_next_50_leads():
    """Extract leads 51-100 from priority research queue"""

    input_file = 'data/output/priority_research_queue.csv'
    output_file = 'data/output/next_50_leads.csv'

    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        all_trials = list(reader)

    # Get leads 51-100 (indices 50-99)
    next_50 = all_trials[50:100] if len(all_trials) >= 100 else all_trials[50:]

    print(f"📊 Total trials in queue: {len(all_trials)}")
    print(f"🎯 Extracting next batch: {len(next_50)} trials")
    print(f"   Range: #{51} to #{50 + len(next_50)}")

    # Write to new CSV
    if next_50:
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=next_50[0].keys())
            writer.writeheader()
            writer.writerows(next_50)

        print(f"\n✅ Saved to: {output_file}")

        # Show preview
        print(f"\nPreview of next 50 leads:")
        print("="*70)
        for i, trial in enumerate(next_50[:10], 51):
            print(f"{i}. {trial['company_name']} ({trial['tier']}, {trial['num_locations']} locs)")

        if len(next_50) > 10:
            print(f"... and {len(next_50) - 10} more")
    else:
        print("❌ No more trials available")
        sys.exit(1)

if __name__ == '__main__':
    get_next_50_leads()
