#!/usr/bin/env python3
"""
Convert 7shifts trial export to ICP identification format.
"""

import csv
import sys
from pathlib import Path


def convert_trial_data(input_path: Path, output_path: Path, limit: int = None):
    """Convert 7shifts trial export to our format."""

    print(f"Reading trial data from: {input_path}")

    # Try different encodings
    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
        try:
            with open(input_path, 'r', encoding=encoding) as infile:
                reader = csv.DictReader(infile)
                rows = list(reader)
            print(f"✓ Successfully read file with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue
    else:
        print("Error: Could not decode file with any common encoding")
        sys.exit(1)

    if limit:
        rows = rows[:limit]
        print(f"Processing first {limit} trials")
    else:
        print(f"Processing all {len(rows)} trials")

    # Convert to our format
    converted = []
    for row in rows:
        company_name = row.get('Company / Account', '').strip()
        email = row.get('Email', '').strip()
        first_name = row.get('First Name', '').strip()
        last_name = row.get('Last Name', '').strip()

        # Build notes from available data
        notes_parts = []

        declared_locs = row.get('Declared Number of Locations', '').strip()
        actual_locs = row.get('Number of Locations', '').strip()
        if declared_locs:
            notes_parts.append(f"Declared locations: {declared_locs}")
        if actual_locs and actual_locs != '0':
            notes_parts.append(f"{actual_locs} locations")

        declared_emp = row.get('Declared Number Of Employees', '').strip()
        actual_emp = row.get('Employee Count', '').strip()
        if declared_emp:
            notes_parts.append(f"Declared employees: {declared_emp}")
        if actual_emp and actual_emp != '0':
            notes_parts.append(f"{actual_emp} employees")

        pos = row.get('POS', '').strip()
        if pos and pos != 'None':
            notes_parts.append(f"POS: {pos}")

        notes = '; '.join(notes_parts)

        converted.append({
            'company_name': company_name,
            'email': email,
            'contact_name': f"{first_name} {last_name}".strip(),
            'notes': notes
        })

    # Write output
    print(f"Writing converted data to: {output_path}")

    with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
        fieldnames = ['company_name', 'email', 'contact_name', 'notes']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(converted)

    print(f"✓ Converted {len(converted)} trials")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Convert 7shifts trial data')
    parser.add_argument('--input', required=True, help='Input CSV from 7shifts')
    parser.add_argument('--output', default='data/input/trials.csv', help='Output CSV')
    parser.add_argument('--limit', type=int, help='Limit number of trials to process')

    args = parser.parse_args()

    convert_trial_data(
        Path(args.input),
        Path(args.output),
        limit=args.limit
    )
