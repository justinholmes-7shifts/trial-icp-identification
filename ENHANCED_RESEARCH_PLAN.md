# Enhanced Trial ICP Research Plan

**Goal:** Validate trial data through external research and confidence scoring

---

## Current Problem

### What We're Doing Now (Baseline Tool):
- ❌ Trusting self-reported data (declared locations, employees)
- ❌ Using keyword matching for restaurant type
- ❌ Defaulting to estimates when data is missing
- ❌ No validation of actual business details

### The Risk:
**Restaurants lie or exaggerate in trial signups:**
- Declare "31-50 employees" but actually have 10
- Say "4 locations" but only operate 1
- Claim to be FSR but are actually food trucks
- Misrepresent their business to access features

---

## Enhanced Research Methodology

### Inspiration from Your Other Projects:

**1. Sister Locations Project** - Finding multi-brand restaurant groups
- Research parent companies
- Check website footers for "Family of Restaurants"
- LinkedIn company page analysis
- Identify multi-concept hospitality groups

**2. Restaurant Research Project** - Evidence-based lead qualification
- Job postings (Indeed, company website) → Employee count signals
- Employee reviews (Glassdoor, Indeed) → Scheduling pain evidence
- Customer reviews (Yelp, Google) → Understaffing mentions
- Social media → Hiring urgency signals

---

## Enhanced Trial Validation Process

### Phase 1: Web Research (Automated)

For each trial (starting with Tier 1-2 leads):

#### A. **Company Website Analysis**
- **Find website** (if not provided in trial data)
- **Scrape key pages:**
  - About page → Company story, year founded, ownership
  - Locations page → Actual location count and addresses
  - Careers page → Job postings count and urgency
  - Footer → Look for "Part of [Group Name]" or sister restaurants

#### B. **Google Business / Yelp Research**
- **Search company name**
- **Extract:**
  - Number of locations (Yelp business profiles)
  - Restaurant type (FSR, QSR, Fast Casual) from menus/photos
  - Price range ($, $$, $$$, $$$$)
  - Customer review count and rating
  - Recent reviews mentioning staff/service

#### C. **Job Posting Signals** (Indeed/Career Page)
- **Count active job postings**
  - 0-2 postings = Stable/small
  - 3-10 postings = Growing/some turnover
  - 10+ postings = High turnover/rapid growth
  - 50+ postings = Chain with significant hiring needs
- **Check for urgency language:**
  - "Apply today, start THIS WEEK"
  - "Walk-in interviews"
  - "Immediate hire"
  - "Hiring bonus"

#### D. **Social Media Signals**
- **Instagram/Facebook:** Check for hiring posts
- **LinkedIn:** Company size, employees, ownership structure

#### E. **Parent Company Research**
- **Check for restaurant groups:**
  - Multi-brand hospitality groups (like Ford Fry, Castellucci)
  - Franchise operators (operating multiple locations of chains)
  - Website footer mentions
  - LinkedIn "Parent Organization"

---

### Phase 2: Validation & Confidence Scoring

#### Compare Declared vs. Actual Data:

| Data Point | Declared (Trial) | Actual (Research) | Match Score |
|------------|------------------|-------------------|-------------|
| # Locations | What they told us | What we found | 0-100% |
| # Employees | Declared range | Estimated from job postings | 0-100% |
| Restaurant Type | Keyword guess | Menu/photos analysis | Match/No Match |
| Multi-location Group | Unknown | Research finding | Bonus points |

#### Confidence Score Formula:

```
Base Confidence = 50 points

+ Location Match (0-25 pts):
  - Exact match = +25
  - Within 1 location = +15
  - Within 2-3 = +10
  - Mismatch = 0

+ Employee Match (0-25 pts):
  - Job postings suggest similar range = +25
  - Some evidence of size = +15
  - No data found = +10 (neutral)
  - Contradictory evidence = 0

+ Website Quality (0-15 pts):
  - Professional website found = +15
  - Basic website = +10
  - No website = 0

+ Job Posting Signals (0-15 pts):
  - 10+ active postings = +15
  - 3-10 postings = +10
  - 1-2 postings = +5
  - 0 postings = 0

+ Social Proof (0-10 pts):
  - 100+ reviews = +10
  - 50-99 reviews = +7
  - 20-49 reviews = +5
  - < 20 reviews = 0

+ Parent Company Discovery (BONUS):
  - Part of multi-brand group = +20 (HUGE value)
  - Part of franchise org = +10

Total: 0-120 points
```

#### Confidence Tiers:
- **90-120**: High Confidence - Data validated, pursue immediately
- **70-89**: Medium Confidence - Generally accurate, worth pursuing
- **50-69**: Low Confidence - Questionable data, manual review needed
- **0-49**: Very Low Confidence - Likely exaggerated, deprioritize

---

### Phase 3: Prioritization Matrix

Combine **Tier Score** + **Confidence Score** + **Bonus Signals**:

#### Priority 1 (IMMEDIATE OUTREACH):
- Tier 1-2 leads with 90+ confidence
- Tier 3 leads that are secretly multi-location groups (discovered via research)
- Any lead with 10+ job postings (hiring urgency)

#### Priority 2 (THIS WEEK):
- Tier 1-2 leads with 70-89 confidence
- Tier 2-3 leads part of parent company/hospitality groups
- Tier 3 with strong job posting signals (5+ postings)

#### Priority 3 (THIS MONTH):
- Tier 1-2 with 50-69 confidence (manual review)
- Tier 3 with validated data and professional operations
- Any lead with evidence of scheduling pain in reviews

#### Deprioritize:
- Tier 3+ with <50 confidence (likely exaggerated data)
- Tier 5 regardless of confidence
- Test accounts ("your restaurant")

---

## Implementation Phases

### Phase 1: Manual Research (Immediate - This Week)
**Targets:** 17 Tier 1-2 leads

**Process:**
1. Use restaurant-staffing-researcher agent (from your other project)
2. Manually validate each Tier 1-2 lead
3. Document findings and confidence scores
4. Create "validated leads" list for sales team

**Deliverable:** Top 10 validated leads with research reports

---

### Phase 2: Semi-Automated Research (Next 2 Weeks)
**Targets:** Top 100 Tier 3 leads

**Build:**
1. Website scraper for basic info (locations page, careers page)
2. Yelp/Google Business API integration (if available)
3. Indeed job posting counter
4. Automated confidence scoring

**Deliverable:** Tool that takes trial data → outputs enriched + scored data

---

### Phase 3: Full Automation (Next Month)
**Targets:** All 3,878 Tier 3 leads

**Build:**
1. Scheduled batch processing (100 leads/day)
2. Parent company detection (multi-brand groups)
3. Social media signals scraping
4. Employee/customer review analysis for scheduling pain
5. Integration with CRM

**Deliverable:** Daily-updated scored lead list with research

---

## Data Structure: Enhanced Trial Output

```csv
company_name,
email,
contact_name,
tier,

# Original declared data
declared_locations,
declared_employees,

# Researched actual data
actual_locations_found,
actual_employee_estimate,
restaurant_type_validated,
price_range,

# Parent company discovery
parent_company,
sister_restaurants,
multi_brand_group,

# Job posting signals
active_job_postings,
hiring_urgency_score,
job_posting_urls,

# Social proof
yelp_url,
google_business_url,
review_count,
rating,

# Validation
locations_match_score,
employees_match_score,
confidence_score,
priority_rank,

# Evidence of pain
scheduling_pain_found,
understaffing_mentions,
turnover_signals,

# Research metadata
research_date,
data_sources_used,
manual_review_needed
```

---

## Recommended Next Steps

### Week 1: Validate Top Leads Manually
1. Research all 17 Tier 1-2 leads using existing agent
2. Document confidence scores
3. Create validated outreach list for sales

### Week 2: Build Semi-Automated Tool
1. Website scraper for locations/careers pages
2. Job posting counter (Indeed)
3. Yelp business info scraper
4. Confidence scoring calculator

### Week 3: Test & Refine
1. Run on top 100 Tier 3 leads
2. Compare manual vs automated findings
3. Tune confidence scoring weights

### Week 4: Scale to Full Dataset
1. Batch process all Tier 3 leads
2. Generate prioritized outreach list
3. Set up recurring research updates

---

## Technical Considerations

### Web Scraping Challenges:
- Rate limiting (need delays between requests)
- Website structure variations
- Anti-bot protections
- Need proxies for large-scale scraping

### Data Sources:
- **Free:** Company websites, Yelp (public data), Google Business
- **Potentially Paid:** Indeed API, Glassdoor data, restaurant data providers
- **Already Have:** Your existing restaurant-staffing-researcher agent

### Integration:
- Export enriched CSV for CRM import
- Flag high-confidence leads for immediate outreach
- Schedule weekly re-research for Tier 1-2 leads

---

## Success Metrics

### Lead Quality Improvement:
- **Current:** 46% of trials are "strong fit" (Tiers 1-3) based on assumptions
- **Target:** 70%+ of outreach targets are validated strong fits
- **Measure:** Conversion rate from outreach to demo booking

### Data Accuracy:
- **Current:** Unknown accuracy (no validation)
- **Target:** 80%+ confidence score on pursued leads
- **Measure:** % of leads where research confirms declared data

### Hidden Opportunities:
- **Current:** Missing multi-brand groups in single-location data
- **Target:** Identify 5-10 "hidden" multi-location groups per quarter
- **Measure:** # of Tier 3 → Tier 2 promotions via research

---

## Questions to Answer

1. **Automation level:** Fully automated vs human-in-the-loop?
2. **Budget:** Can we pay for data (Indeed API, restaurant databases)?
3. **Volume:** Research all 4,282 restaurants or just top tiers?
4. **Recurring:** One-time research or continuous monitoring?
5. **Integration:** How does this feed into sales workflow/CRM?

---

*Plan created: December 3, 2025*
*Based on learnings from: Sister Locations project + Evidence-Based Restaurant Research*
