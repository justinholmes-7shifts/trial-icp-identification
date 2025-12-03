#!/usr/bin/env python3
"""
Trial ICP Identification Tool
Identifies and scores restaurant trial customers based on 7shifts ICP criteria.
"""

import csv
import sys
import argparse
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import time


class RestaurantIdentifier:
    """Identifies if a company is a restaurant and gathers details."""

    RESTAURANT_KEYWORDS = [
        'restaurant', 'cafe', 'coffee', 'bar', 'grill', 'bistro', 'eatery',
        'kitchen', 'diner', 'pizzeria', 'burger', 'taco', 'sushi', 'bbq',
        'steakhouse', 'brewery', 'pub', 'tavern', 'cantina', 'food', 'dining',
        'sandwich shop', 'bites'
    ]

    FSR_INDICATORS = [
        'fine dining', 'full service', 'steakhouse', 'upscale', 'casual dining',
        'sit down', 'table service', 'bistro', 'trattoria', 'brasserie',
        'italian', 'seafood', 'family-owned restaurant', 'grill'
    ]

    QSR_INDICATORS = [
        'quick service', 'fast food', 'qsr', 'counter service', 'drive-thru',
        'drive through', 'fast casual', 'sandwich', 'burger', 'pizza chain'
    ]

    def is_restaurant(self, company_name: str, website: str = None) -> bool:
        """Check if company appears to be a restaurant."""
        text = company_name.lower()
        if website:
            text += ' ' + website.lower()

        return any(keyword in text for keyword in self.RESTAURANT_KEYWORDS)

    def get_restaurant_type(self, company_name: str, notes: str = '') -> str:
        """Determine restaurant type (FSR/QSR/Fast Casual/etc.)."""
        text = (company_name + ' ' + notes).lower()

        if any(indicator in text for indicator in self.FSR_INDICATORS):
            return 'FSR'
        elif any(indicator in text for indicator in self.QSR_INDICATORS):
            return 'QSR'
        elif 'fast casual' in text or 'fast-casual' in text:
            return 'Fast Casual'
        elif 'cafe' in text or 'coffee' in text:
            return 'Cafe/Coffee'
        else:
            return 'Unknown'


class LocationCounter:
    """Estimates number of locations from available data."""

    MULTI_LOC_INDICATORS = [
        r'\d+\s*locations?',
        r'\d+\s*stores?',
        r'\d+\s*restaurants?',
        r'\d+\s*sites?'
    ]

    def estimate_locations(self, company_name: str, notes: str = '') -> str:
        """Estimate number of locations (1, 2-5, 6-15, 16+)."""
        text = (company_name + ' ' + notes).lower()

        # Look for explicit location counts
        for pattern in self.MULTI_LOC_INDICATORS:
            match = re.search(pattern, text)
            if match:
                num_str = re.search(r'\d+', match.group())
                if num_str:
                    num = int(num_str.group())
                    return self._categorize_location_count(num)

        # Check for multi-location indicators
        if any(word in text for word in ['chain', 'franchise', 'group', 'multiple locations']):
            return '6-15'  # Conservative estimate for chains

        return '1'  # Default to single location

    def _categorize_location_count(self, count: int) -> str:
        """Categorize location count into buckets."""
        if count == 1:
            return '1'
        elif 2 <= count <= 5:
            return '2-5'
        elif 6 <= count <= 15:
            return '6-15'
        else:
            return '16+'


class EmployeeEstimator:
    """Estimates employee count per location."""

    def estimate_employees_per_location(
        self,
        restaurant_type: str,
        num_locations: str,
        notes: str = ''
    ) -> int:
        """Estimate employees per location based on type and other signals."""
        text = notes.lower()

        # Look for explicit "per location" employee counts first
        per_loc_patterns = [
            r'(\d+)\s*(?:staff|employees?)\s*per\s*location',
            r'(\d+)\s*(?:staff|employees?)\/loc',
            r'(\d+)\s*(?:staff|employees?)\s*per\s*loc'
        ]
        for pattern in per_loc_patterns:
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))

        # Look for general employee counts
        emp_pattern = r'(\d+)\s*(?:employees?|staff)'
        match = re.search(emp_pattern, text)
        if match:
            total = int(match.group(1))
            # If we have location count, divide
            if num_locations == '1':
                return total
            elif num_locations == '2-5':
                return total // 3  # Rough estimate
            elif num_locations == '6-15':
                return total // 10

        # Use restaurant type defaults
        if restaurant_type == 'FSR':
            return 35  # FSR typically has more staff
        elif restaurant_type == 'QSR':
            return 20  # QSR has smaller crews
        elif restaurant_type == 'Fast Casual':
            return 25
        else:
            return 20  # Conservative default


class TierScorer:
    """Scores restaurants into Tier 1-4 based on 7shifts criteria."""

    def score(
        self,
        restaurant_type: str,
        num_locations: str,
        employees_per_loc: int
    ) -> Tuple[str, str]:
        """
        Returns (tier, reason) tuple.

        Tier 1: FSR Scale (2-5 locations, FSR, 30+ employees/loc)
        Tier 2: Multi-Loc (2-5 locations, any type, 15+ employees/loc, excluding Tier 1)
        Tier 3: Single Loc (1 location, any type, 15+ employees/loc)
        Tier 4: Franchise Multi-Loc (6-15 locations, QSR franchise or low customization)
        """

        # Not a fit criteria
        if num_locations == '1' and employees_per_loc <= 14:
            return 'Not a fit', 'Single location with 14 or fewer employees'

        if num_locations == '16+':
            return 'Not a fit', 'Groups with over 15 corporate stores'

        # Tier 1: FSR Scale
        if (num_locations == '2-5' and
            restaurant_type == 'FSR' and
            employees_per_loc >= 30):
            return 'Tier 1', 'FSR Scale: 2-5 locations, Full-Service, 30+ employees/loc'

        # Tier 2: Multi-Loc
        if (num_locations == '2-5' and
            employees_per_loc >= 15 and
            employees_per_loc < 30):  # Exclude Tier 1
            return 'Tier 2', f'Multi-Loc: 2-5 locations, {restaurant_type}, 15+ employees/loc'

        # Tier 3: Single Loc
        if num_locations == '1' and employees_per_loc >= 15:
            return 'Tier 3', f'Single Loc: 1 location, {restaurant_type}, 15+ employees/loc'

        # Tier 4: Franchise Multi-Loc
        if num_locations == '6-15':
            if restaurant_type == 'QSR':
                return 'Tier 4', 'Franchise Multi-Loc: 6-15 locations, QSR'
            else:
                return 'Tier 4', 'Franchise Multi-Loc: 6-15 locations, low customization group'

        # Edge case: 2-5 locations but less than 15 employees/loc
        if num_locations == '2-5' and employees_per_loc < 15:
            return 'Not a fit', 'Multi-location but fewer than 15 employees per location'

        return 'Not a fit', 'Does not meet tier criteria'


class TrialICPProcessor:
    """Main processor for trial ICP identification."""

    def __init__(self):
        self.restaurant_id = RestaurantIdentifier()
        self.location_counter = LocationCounter()
        self.employee_estimator = EmployeeEstimator()
        self.tier_scorer = TierScorer()

    def process_trial(self, row: Dict[str, str]) -> Dict[str, str]:
        """Process a single trial company and return enriched data."""
        company_name = row.get('company_name', '')
        website = row.get('website', '')

        # Start with input data
        result = row.copy()

        # Check if restaurant
        is_restaurant = self.restaurant_id.is_restaurant(company_name, website)
        result['is_restaurant'] = 'Yes' if is_restaurant else 'No'

        if not is_restaurant:
            result['tier'] = 'Not a fit'
            result['tier_reason'] = 'Non-restaurant business'
            return result

        # Gather restaurant details (will be enhanced with research)
        notes = row.get('notes', '')
        restaurant_type = self.restaurant_id.get_restaurant_type(company_name, notes)
        num_locations = self.location_counter.estimate_locations(company_name, notes)
        employees_per_loc = self.employee_estimator.estimate_employees_per_location(
            restaurant_type, num_locations, notes
        )

        # Calculate tier
        tier, tier_reason = self.tier_scorer.score(
            restaurant_type, num_locations, employees_per_loc
        )

        # Populate result
        result['restaurant_type'] = restaurant_type
        result['num_locations'] = num_locations
        result['employees_per_location'] = str(employees_per_loc)
        result['tier'] = tier
        result['tier_reason'] = tier_reason
        result['research_notes'] = 'Automated analysis - manual research recommended'

        return result

    def process_file(self, input_path: Path, output_path: Path):
        """Process entire CSV file of trials."""
        print(f"Reading trials from: {input_path}")

        with open(input_path, 'r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            rows = list(reader)

        print(f"Processing {len(rows)} trial companies...")

        results = []
        restaurants_found = 0

        for i, row in enumerate(rows, 1):
            result = self.process_trial(row)
            results.append(result)

            if result['is_restaurant'] == 'Yes':
                restaurants_found += 1
                print(f"  [{i}/{len(rows)}] {row.get('company_name', 'Unknown')} -> {result['tier']}")

        # Write results
        print(f"\nWriting results to: {output_path}")

        if results:
            fieldnames = list(results[0].keys())
            with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(results)

        # Summary
        tier_counts = {}
        for result in results:
            tier = result.get('tier', 'Unknown')
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        print(f"\n{'='*60}")
        print(f"SUMMARY")
        print(f"{'='*60}")
        print(f"Total trials processed: {len(rows)}")
        print(f"Restaurants identified: {restaurants_found}")
        print(f"\nTier Distribution:")
        for tier in ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Not a fit']:
            count = tier_counts.get(tier, 0)
            if count > 0:
                print(f"  {tier}: {count}")
        print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(
        description='Identify and score restaurant trial customers'
    )
    parser.add_argument(
        '--input',
        type=str,
        default='data/input/trials.csv',
        help='Input CSV file with trial companies'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='data/output/scored_trials.csv',
        help='Output CSV file for scored results'
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    # Create output directory if needed
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    # Process trials
    processor = TrialICPProcessor()
    processor.process_file(input_path, output_path)


if __name__ == '__main__':
    main()
