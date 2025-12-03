# Trial Research Implementation Guide

**Goal:** Validate the 17 Tier 1-2 leads through external research

---

## What You Have Now

### ✅ Baseline Tool (Working)
- Processes 8,440 trials
- Identifies restaurants (50.7% accuracy)
- Scores into Tiers 1-5
- **Problem:** Based on self-reported data (not validated)

### ✅ Research Methodologies (Proven)
From your other projects:
1. **Sister Locations** - Parent company detection
2. **Restaurant Research** - Evidence-based validation
3. **Restaurant Group Mapping** - Structured research prompt

### ⚠️ Research Tool (Framework Only)
- `research_trial.py` is a template
- Needs actual web scraping implementation
- Requires API integrations

---

## Recommended Approach

### Option 1: Use Existing Agent (FASTEST - Recommended)

**Use your `restaurant-staffing-researcher` agent** from the Restaurant Research project.

#### Step-by-Step Process:

1. **Export Top 17 Leads to JSON**
   ```bash
   # Create input file for research
   python3 -c "
   import csv, json

   with open('data/output/scored_trials.csv') as f:
       trials = list(csv.DictReader(f))

   top_leads = [t for t in trials if t['tier'] in ['Tier 1', 'Tier 2']]

   # Format for research agent
   research_input = []
   for lead in top_leads:
       research_input.append({
           'company_name': lead['company_name'],
           'website': lead.get('website', ''),
           'declared_locations': lead.get('declared_locations', ''),
           'declared_employees': lead.get('declared_employees', ''),
           'contact': lead.get('email', '')
       })

   with open('data/input/top_17_leads_for_research.json', 'w') as f:
       json.dump(research_input, f, indent=2)

   print(f'Created research input with {len(research_input)} leads')
   "
   ```

2. **Research Each Lead Manually**

   For each of the 17 leads, use Claude/agent to research:

   **Research Prompt Template:**
   ```
   Research this restaurant trial lead:

   Company: [Name]
   Website: [URL if available]
   Declared: [X locations, Y employees]

   Please research and provide:

   1. ACTUAL LOCATION COUNT
      - How many locations do they really have?
      - List addresses if possible
      - Source: Website locations page, Yelp, Google Business

   2. ACTUAL EMPLOYEE COUNT ESTIMATE
      - Check Indeed for active job postings
      - Check Glassdoor for employee counts
      - Estimate based on type of operation

   3. RESTAURANT TYPE
      - FSR, QSR, Fast Casual, Cafe, etc.
      - Price range ($, $$, $$$, $$$$)
      - Source: Menu, Yelp, Google reviews

   4. PARENT COMPANY DETECTION
      - Check website footer for copyright
      - Check About page for company info
      - Check Privacy Policy for legal entity
      - Look for "Family of Restaurants" or sister concepts
      - Search LinkedIn for company page

   5. HIRING SIGNALS
      - Count active job postings (Indeed, career page)
      - Any urgency language? ("Apply today, start this week")
      - Walk-in interviews?

   6. VALIDATION
      - Does declared location count match? (Yes/No/Close)
      - Does declared employee count seem accurate? (Yes/No/Inflated)
      - Confidence score: High/Medium/Low

   7. PRIORITY RECOMMENDATION
      - Should we pursue? (Yes/No/Maybe)
      - Why or why not?

   Format as structured JSON.
   ```

3. **Create Research Reports**

   For each lead, create a file: `research/[company_name]_research.json`

   Example output:
   ```json
   {
     "company_name": "BlackJax American Pub & Grill",
     "research_date": "2025-12-03",
     "website": "https://blackjaxamity.com",

     "declared_data": {
       "locations": "2",
       "employees": "31-50"
     },

     "actual_data_found": {
       "locations": 2,
       "location_addresses": [
         "123 Main St, Amity, PA",
         "456 Oak Ave, Pittsburgh, PA"
       ],
       "employee_estimate": 40,
       "restaurant_type": "FSR - Full Service Bar & Grill",
       "price_range": "$$",
       "active_job_postings": 8
     },

     "parent_company": {
       "detected": false,
       "name": "None - Appears to be independent",
       "sister_restaurants": []
     },

     "validation": {
       "locations_match": "Exact match",
       "employees_match": "Close match (40 actual vs 31-50 declared)",
       "confidence_score": 95,
       "confidence_tier": "High"
     },

     "evidence": {
       "hiring_urgency": "Medium - 8 active postings",
       "scheduling_pain_found": false,
       "sources_checked": [
         "https://blackjaxamity.com/about",
         "https://blackjaxamity.com/careers",
         "https://www.indeed.com/q-blackjax-jobs.html",
         "https://www.yelp.com/biz/blackjax-amity"
       ]
     },

     "recommendation": {
       "pursue": true,
       "priority": "High",
       "reasoning": "Perfect ICP match - 2 location FSR with validated employee count in target range. Actively hiring (8 postings). Data declared in trial is accurate."
     }
   }
   ```

4. **Compile Research Summary**

   After researching all 17, create summary report:
   ```bash
   python3 compile_research_summary.py
   ```

   Outputs: `research/VALIDATED_LEADS_SUMMARY.md`

---

### Option 2: Build Automated Tool (LONGER TERM)

If you want to scale to all 3,878 Tier 3 leads, you'll need automation.

#### Required Components:

1. **Web Scraping**
   ```python
   # Install dependencies
   pip install requests beautifulsoup4 selenium

   # For structured scraping:
   - requests: Basic HTTP requests
   - BeautifulSoup: HTML parsing
   - selenium: For JavaScript-heavy sites
   ```

2. **Business Data APIs**
   - **Yelp Fusion API** (free tier: 500 calls/day)
     - Get business info, review count, ratings
     - Location data
   - **Google Places API** (paid)
     - Business details, reviews
     - Multiple locations detection
   - **Indeed API** (no official API)
     - Need to scrape (rate limited)
     - Alternative: Pay for job posting data service

3. **Rate Limiting & Proxies**
   ```python
   import time
   from ratelimit import limits, sleep_and_retry

   # Limit to 1 request per second
   @sleep_and_retry
   @limits(calls=1, period=1)
   def scrape_website(url):
       # Your scraping code
       pass
   ```

4. **Data Storage**
   - SQLite database for caching
   - Avoid re-researching same companies
   - Track research timestamps

---

## Immediate Next Steps (This Week)

### Day 1-2: Research Tier 1 Lead
- **BlackJax American Pub & Grill**
- Full deep-dive research
- Create template report
- Validate data accuracy

### Day 3-5: Research All Tier 2 Leads (11 companies)
- Use research template from Tier 1
- Focus on:
  - JMVR Restaurants (5 locations, 51+ employees)
  - Solenne Catering (50 actual employees in system)
  - Sweet Tea Express (4 locations)
- Create individual research reports

### Day 5: Compile & Share
- Create "Top 10 Validated Leads" doc for sales team
- Include:
  - Contact info
  - Validated data (locations, employees)
  - Why they're a good fit
  - Recommended talking points
  - Evidence of pain/hiring needs

---

## Starter Script: Export Top Leads

Save this as `export_top_leads.py`:

```python
#!/usr/bin/env python3
import csv
import json

def export_top_leads(input_csv, output_json, tiers=['Tier 1', 'Tier 2']):
    """Export top tier leads for manual research."""

    with open(input_csv, 'r', encoding='utf-8') as f:
        trials = list(csv.DictReader(f))

    top_leads = [t for t in trials if t.get('tier') in tiers]

    # Format for research
    research_list = []
    for i, lead in enumerate(top_leads, 1):
        research_list.append({
            'id': i,
            'company_name': lead['company_name'],
            'contact_name': lead.get('contact_name', ''),
            'email': lead.get('email', ''),
            'website': lead.get('website', ''),
            'tier': lead['tier'],
            'declared_locations': lead.get('num_locations', ''),
            'declared_employees': lead.get('employees_per_location', ''),
            'notes': lead.get('notes', ''),
            'research_status': 'Pending',
            'research_file': f"research/{lead['company_name'].replace(' ', '_')}_research.json"
        })

    with open(output_json, 'w') as f:
        json.dump(research_list, f, indent=2)

    print(f"✅ Exported {len(research_list)} leads for research")
    print(f"📄 Saved to: {output_json}")

    # Print list
    print("\n" + "="*70)
    print("TOP PRIORITY LEADS FOR RESEARCH")
    print("="*70 + "\n")

    for lead in research_list:
        print(f"{lead['id']}. {lead['company_name']} ({lead['tier']})")
        print(f"   Contact: {lead['contact_name']} <{lead['email']}>")
        print(f"   Declared: {lead['declared_locations']} locations, {lead['declared_employees']} employees")
        print()

if __name__ == '__main__':
    export_top_leads(
        'data/output/scored_trials.csv',
        'data/input/top_leads_research_queue.json'
    )
```

Run it:
```bash
python3 export_top_leads.py
```

---

## Questions to Answer

1. **Scope:** Research all 17 Tier 1-2 leads, or just top 5?
2. **Timeline:** Need results this week, or can wait for automation?
3. **Resources:** Do you have budget for APIs (Yelp, Google Places)?
4. **Integration:** How should validated data feed into sales process?
5. **Ongoing:** One-time research or recurring validation?

---

## Success Criteria

By end of week, you should have:
- ✅ All Tier 1-2 leads researched and validated
- ✅ Confidence scores assigned (High/Medium/Low)
- ✅ Top 10 validated leads doc for sales team
- ✅ Evidence of which declared data was accurate vs inflated
- ✅ Hidden multi-location groups identified (if any)

---

*Created: December 3, 2025*
*Ready to start with manual research of top 17 leads*
