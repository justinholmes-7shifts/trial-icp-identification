# Research Tool Limitation - No Website Data

## Problem Discovered

The 7shifts trial export **does not include website URLs** for restaurants.

### What We Have:
- Company name
- Email
- Contact name
- Declared locations/employees
- POS system

### What We DON'T Have:
- ❌ Website URLs
- ❌ Physical addresses
- ❌ Phone numbers
- ❌ Social media links

## Impact on Automated Research

Without website URLs, the automated scraper cannot:
- Validate location counts
- Count job postings
- Detect parent companies
- Scrape locations pages

## Solutions

### Option 1: Use Google Custom Search API (Requires API Key)
**Pros:**
- Can find websites automatically
- Scalable to 500+ trials

**Cons:**
- Requires Google Cloud account
- Costs money ($5 per 1,000 queries)
- Need to set up API key

**Implementation:**
```python
from googleapiclient.discovery import build

def google_search_website(company_name):
    service = build("customsearch", "v1", developerKey=API_KEY)
    result = service.cse().list(q=f"{company_name} restaurant", cx=SEARCH_ENGINE_ID).execute()
    # Return first result URL
```

### Option 2: Use Task Tool with Research Agent (Recommended for Now)
**Pros:**
- Can use existing restaurant-staffing-researcher agent
- No API costs
- Can find websites + do full research in one step

**Cons:**
- Slower (manual/semi-manual)
- Limited to smaller batches

**Process:**
1. Export Tier 1-2 leads (17 total)
2. Use Task tool to research each one
3. Agent finds website + validates data
4. Get confidence scores

### Option 3: Manual Website Lookup + Automated Research
**Pros:**
- One-time manual effort
- Then can run automated tool

**Cons:**
- Need to manually find 500 websites first
- Time-consuming

**Process:**
1. Export company names to spreadsheet
2. Manually Google each one and add website
3. Import back with websites
4. Run automated_researcher.py

## Recommendation

For the **first 500 trials**, I recommend:

1. **Immediate (Today):** Focus on Tier 1-2 leads (2 total in first 500)
   - Use Task tool with research agent
   - Full manual research on these high-value leads

2. **This Week:** Top 20-30 Tier 3 leads with best indicators
   - Prioritize by:
     - Actual employee count in system (not "0")
     - Multi-location declared
     - Professional email domains
   - Use Task tool for batch research

3. **Next Week:** Consider Google Custom Search API
   - If we want to scale to all 500
   - Set up API key and automate website finding

## Current Tool Status

The `automated_researcher.py` tool is **functional** but needs:
- Website URLs to be effective
- OR Google Custom Search API integration

Without websites, it can only:
- ✅ Skip non-restaurants
- ✅ Skip test accounts ("your restaurant")
- ❌ Cannot scrape locations
- ❌ Cannot count job postings
- ❌ Cannot detect parent companies

## Updated Workflow

Since automated research requires websites, let's use a hybrid approach:

### Step 1: Filter & Prioritize (Automated)
```bash
python filter_best_trials.py --input first_500_trials.csv --output priority_research_queue.csv
```

Filters for:
- Tier 1-2 (highest priority)
- Tier 3 with actual employee data in system
- Not "your restaurant" test accounts
- Has professional email domain

### Step 2: Research Priority Leads (Semi-Manual)
Use Task tool to research top 20-50 leads:
- Finds website
- Validates locations
- Counts job postings
- Detects parent companies
- Assigns confidence score

### Step 3: Compile Results
Merge research findings back into spreadsheet for sales team.

---

*Discovered: December 3, 2025*
*Impact: Limits scalability of automated tool without API investment*
