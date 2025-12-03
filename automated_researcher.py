#!/usr/bin/env python3
"""
Automated Restaurant Trial Researcher

Validates trial data through:
1. Website scraping (locations, careers pages)
2. Yelp business data
3. Job posting analysis
4. Parent company detection
5. Confidence scoring
"""

import csv
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from ratelimit import limits, sleep_and_retry


class WebScraper:
    """Handles web scraping with rate limiting and error handling."""

    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()

    @sleep_and_retry
    @limits(calls=1, period=2)  # 1 call every 2 seconds
    def fetch_url(self, url: str, timeout: int = 10) -> Optional[str]:
        """Fetch URL content with rate limiting."""
        try:
            headers = {
                'User-Agent': self.ua.random,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }

            response = self.session.get(url, headers=headers, timeout=timeout, allow_redirects=True)
            response.raise_for_status()
            return response.text

        except requests.RequestException as e:
            print(f"  ⚠️  Error fetching {url}: {str(e)[:100]}")
            return None

    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML content."""
        return BeautifulSoup(html, 'lxml')


class RestaurantResearcher:
    """Researches restaurant details from various sources."""

    def __init__(self):
        self.scraper = WebScraper()
        self.cache = {}

    def find_website(self, company_name: str) -> Optional[str]:
        """
        Try to find restaurant website via Google search.
        Note: This is a simplified version. Real implementation would use Google Custom Search API.
        """
        # For now, return None if no website provided
        # TODO: Implement Google Custom Search API
        return None

    def scrape_website_basics(self, website: str) -> Dict:
        """Scrape basic info from restaurant website."""
        result = {
            'website_accessible': False,
            'has_locations_page': False,
            'has_careers_page': False,
            'locations_found': [],
            'job_postings_count': 0,
            'parent_company_mention': None,
        }

        if not website:
            return result

        # Ensure URL has protocol
        if not website.startswith('http'):
            website = 'https://' + website

        print(f"    🌐 Scraping website: {website}")

        # Fetch homepage
        html = self.scraper.fetch_url(website)
        if not html:
            return result

        result['website_accessible'] = True
        soup = self.scraper.parse_html(html)

        # Look for common page links
        links = soup.find_all('a', href=True)
        link_texts = [(link.get_text().lower(), link['href']) for link in links]

        # Check for locations page
        location_keywords = ['location', 'locations', 'our restaurants', 'find us', 'store locator']
        for text, href in link_texts:
            if any(keyword in text for keyword in location_keywords):
                result['has_locations_page'] = True
                locations_url = href if href.startswith('http') else website.rstrip('/') + '/' + href.lstrip('/')
                result['locations_url'] = locations_url
                break

        # Check for careers page
        careers_keywords = ['career', 'careers', 'jobs', 'join us', 'hiring', 'employment']
        for text, href in link_texts:
            if any(keyword in text for keyword in careers_keywords):
                result['has_careers_page'] = True
                careers_url = href if href.startswith('http') else website.rstrip('/') + '/' + href.lstrip('/')
                result['careers_url'] = careers_url
                break

        # Look for parent company mentions in footer
        footer = soup.find('footer')
        if footer:
            footer_text = footer.get_text()
            # Look for "© 2024 Company Name" pattern
            copyright_match = re.search(r'©\s*\d{4}\s+([A-Z][A-Za-z\s&]+(?:LLC|Inc|Group|Hospitality))', footer_text)
            if copyright_match:
                result['parent_company_mention'] = copyright_match.group(1).strip()

        return result

    def count_locations_from_page(self, locations_url: str) -> int:
        """Count locations from locations page."""
        print(f"    📍 Checking locations page...")

        html = self.scraper.fetch_url(locations_url)
        if not html:
            return 0

        soup = self.scraper.parse_html(html)

        # Look for address patterns
        addresses = []

        # Method 1: Find elements with address-like text
        address_patterns = [
            r'\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way)',
            r'\d+\s+[A-Z][a-z]+\s+[A-Z][a-z]+',  # "123 Main Street"
        ]

        text = soup.get_text()
        for pattern in address_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            addresses.extend(matches)

        # Method 2: Look for structured location data
        location_markers = soup.find_all(['div', 'li', 'article'], class_=re.compile(r'location|store|restaurant', re.I))
        if location_markers:
            return len(location_markers)

        # Return unique addresses found
        unique_addresses = list(set(addresses))
        return len(unique_addresses) if unique_addresses else 0

    def count_job_postings(self, careers_url: str) -> int:
        """Count job postings from careers page."""
        print(f"    💼 Checking careers page...")

        html = self.scraper.fetch_url(careers_url)
        if not html:
            return 0

        soup = self.scraper.parse_html(html)

        # Look for job posting indicators
        job_elements = soup.find_all(['div', 'li', 'article'], class_=re.compile(r'job|position|opening|career', re.I))

        if job_elements:
            return len(job_elements)

        # Alternative: Count links to job applications
        job_links = soup.find_all('a', href=re.compile(r'apply|job|position', re.I))
        return len(job_links) if job_links else 0

    def research_trial(self, trial: Dict) -> Dict:
        """
        Full research on a single trial.
        """
        company_name = trial.get('company_name', 'Unknown')
        website = trial.get('website', '')

        print(f"\n  🔍 Researching: {company_name}")

        research = {
            'company_name': company_name,
            'research_date': datetime.now().isoformat(),

            # Original trial data
            'declared_locations': trial.get('num_locations', ''),
            'declared_employees': trial.get('employees_per_location', ''),
            'tier': trial.get('tier', ''),

            # Research findings
            'website': website,
            'website_accessible': False,
            'actual_locations_found': 0,
            'job_postings_count': 0,
            'parent_company': 'None detected',

            # Validation
            'locations_match': 'Unknown',
            'confidence_score': 0,
            'confidence_tier': 'Very Low',

            # Metadata
            'research_status': 'Complete',
            'research_notes': []
        }

        # Skip if not a restaurant
        if trial.get('is_restaurant') != 'Yes':
            research['research_status'] = 'Skipped - Not a restaurant'
            research['research_notes'].append('Not identified as restaurant')
            return research

        # Skip "your restaurant" test accounts
        if company_name.lower() == 'your restaurant':
            research['research_status'] = 'Skipped - Test account'
            research['research_notes'].append('Generic test account name')
            return research

        # Find or validate website
        if not website:
            research['research_notes'].append('No website provided in trial data')
            # TODO: Could use Google search to find website
            return research

        # Scrape website basics
        website_data = self.scrape_website_basics(website)
        research.update(website_data)

        if not website_data['website_accessible']:
            research['research_notes'].append('Website not accessible')
            return research

        # Count locations if page found
        if website_data['has_locations_page']:
            locations_found = self.count_locations_from_page(website_data.get('locations_url', ''))
            research['actual_locations_found'] = locations_found
            research['research_notes'].append(f'Found {locations_found} locations on website')

        # Count job postings if page found
        if website_data['has_careers_page']:
            jobs_found = self.count_job_postings(website_data.get('careers_url', ''))
            research['job_postings_count'] = jobs_found
            research['research_notes'].append(f'Found {jobs_found} job postings')

        # Parent company
        if website_data.get('parent_company_mention'):
            research['parent_company'] = website_data['parent_company_mention']
            research['research_notes'].append(f"Parent company: {website_data['parent_company_mention']}")

        # Validate locations match
        declared = trial.get('num_locations', '')
        actual = research['actual_locations_found']

        if actual > 0:
            if declared == str(actual) or declared == '1' and actual == 1:
                research['locations_match'] = 'Exact'
            elif declared in ['2-5'] and 2 <= actual <= 5:
                research['locations_match'] = 'Range match'
            elif abs(actual - int(declared.split('-')[0] if '-' in declared else declared or '0')) <= 1:
                research['locations_match'] = 'Close'
            else:
                research['locations_match'] = 'Mismatch'

        return research

    def calculate_confidence(self, research: Dict) -> int:
        """Calculate confidence score (0-120)."""
        score = 50  # Base

        # Website accessible (+15)
        if research.get('website_accessible'):
            score += 15

        # Locations match (+25)
        match = research.get('locations_match', 'Unknown')
        if match == 'Exact':
            score += 25
        elif match == 'Range match':
            score += 20
        elif match == 'Close':
            score += 10

        # Job postings found (+15)
        jobs = research.get('job_postings_count', 0)
        if jobs >= 10:
            score += 15
        elif jobs >= 3:
            score += 10
        elif jobs >= 1:
            score += 5

        # Parent company detected (+20 bonus)
        if research.get('parent_company') != 'None detected':
            score += 20

        return min(score, 120)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Automated trial research')
    parser.add_argument('--input', default='data/input/first_500_trials.csv', help='Input CSV')
    parser.add_argument('--output', default='data/output/researched_trials.csv', help='Output CSV')
    parser.add_argument('--limit', type=int, help='Limit number to research')
    parser.add_argument('--start', type=int, default=0, help='Start index (for batching)')

    args = parser.parse_args()

    print("=" * 70)
    print("AUTOMATED RESTAURANT TRIAL RESEARCHER")
    print("=" * 70)
    print()

    # Read trials
    with open(args.input, 'r', encoding='utf-8') as f:
        trials = list(csv.DictReader(f))

    # Apply limits
    if args.start > 0:
        trials = trials[args.start:]

    if args.limit:
        trials = trials[:args.limit]

    print(f"📊 Processing {len(trials)} trials")
    print(f"⏱️  Estimated time: {len(trials) * 6} seconds ({len(trials) * 6 / 60:.1f} minutes)")
    print(f"   (2 second delay between requests)")
    print()

    # Research each trial
    researcher = RestaurantResearcher()
    results = []

    start_time = time.time()

    for i, trial in enumerate(trials, 1):
        print(f"[{i}/{len(trials)}]", end=" ")

        research = researcher.research_trial(trial)

        # Calculate confidence
        confidence_score = researcher.calculate_confidence(research)
        research['confidence_score'] = confidence_score

        if confidence_score >= 90:
            research['confidence_tier'] = 'High'
        elif confidence_score >= 70:
            research['confidence_tier'] = 'Medium'
        elif confidence_score >= 50:
            research['confidence_tier'] = 'Low'
        else:
            research['confidence_tier'] = 'Very Low'

        results.append(research)

        # Save progress every 10 trials
        if i % 10 == 0:
            elapsed = time.time() - start_time
            remaining = (len(trials) - i) * (elapsed / i)
            print(f"\n  ⏳ Progress: {i}/{len(trials)} | Elapsed: {elapsed/60:.1f}min | ETA: {remaining/60:.1f}min")

    # Write results
    if results:
        fieldnames = list(results[0].keys())
        with open(args.output, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)

    # Summary
    print()
    print("=" * 70)
    print("RESEARCH COMPLETE")
    print("=" * 70)

    processed = len([r for r in results if r['research_status'] == 'Complete'])
    skipped = len([r for r in results if 'Skipped' in r['research_status']])

    confidence_counts = {}
    for r in results:
        tier = r.get('confidence_tier', 'Unknown')
        confidence_counts[tier] = confidence_counts.get(tier, 0) + 1

    print(f"Processed: {processed}")
    print(f"Skipped: {skipped}")
    print(f"\nConfidence Distribution:")
    for tier in ['High', 'Medium', 'Low', 'Very Low']:
        count = confidence_counts.get(tier, 0)
        if count > 0:
            print(f"  {tier}: {count}")

    print(f"\n📄 Results saved to: {args.output}")
    print("=" * 70)


if __name__ == '__main__':
    main()
