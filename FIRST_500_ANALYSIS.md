# First 500 Trials - Research Analysis

**Date:** December 3, 2025
**Source:** First 500 rows from 8,440 trial export

---

## Summary

- **Total Trials:** 500
- **Restaurants:** 255 (51%)
- **Tier 1:** 0
- **Tier 2:** 2 ⭐⭐ (HIGH PRIORITY)
- **Tier 3:** 234 ⭐ (Strong fit)
- **Tier 4:** 0
- **Tier 5:** 264 (Not a fit)

---

## Key Challenge Discovered

### Website URLs Not in Trial Data ❌

The 7shifts trial export **does not include website URLs**, which limits automated research capabilities.

**What we have:**
- Company name ✅
- Email ✅
- Contact name ✅
- Declared locations/employees ✅

**What we need but don't have:**
- Website URLs ❌
- Physical addresses ❌
- Social media links ❌

**Impact:** Automated web scraping cannot work without URLs to scrape.

---

## Solution Implemented

### Priority Filter Tool

Created `filter_best_trials.py` to identify the highest-value leads worth manual research.

**Scoring System (0-100 points):**
- Tier 1: +40 pts
- Tier 2: +35 pts
- Tier 3: +20 pts
- Multi-location: +15 pts
- Professional email domain: +10 pts
- High employee count declared: +10 pts
- Has actual employees in system: +20 pts
- Identified restaurant type (FSR): +5 pts
- Has POS system: +5 pts

---

## Top 50 Priority Leads Identified

Filtered from 500 trials → **50 high-priority leads** (score >= 30)

**Breakdown:**
- **2 Tier 2 leads** (multi-location)
- **48 Tier 3 leads** (single-location, strong fit)

**Score Distribution:**
- 60-79 points: 3 leads (HIGHEST PRIORITY)
- 40-59 points: 21 leads (HIGH PRIORITY)
- 30-39 points: 26 leads (MEDIUM PRIORITY)

---

## Top 10 Leads for Immediate Research

### 1. Sweet Tea Express (Score: 65) ⭐⭐⭐
- **Tier 2** - Multi-location
- Email: greg@sweetteaexpress.com
- 4 locations declared
- Professional email domain

### 2. Hareloom Cafe LLC (Score: 60) ⭐⭐⭐
- **Tier 2** - Multi-location
- Email: jmiceli74@gmail.com
- 2 locations
- Toast POS

### 3. Hunt's Oyster Bar and Seafood (Score: 60) ⭐⭐
- **Tier 3** - Single location
- Email: abrams.collinspc@yahoo.com
- Seafood restaurant
- High value single-loc

### 4. Flying Pig Tavern & Tap Riverside (Score: 55) ⭐⭐
- **Tier 3**
- Email: massimo@themadison.net
- Professional domain (@themadison.net)
- Toast POS

### 5. Andys Pizza Kentlands (Score: 55) ⭐⭐
- **Tier 3**
- Email: billiejo@eatandyspizza.com
- Professional domain
- Part of Andy's Pizza chain

### 6. Bae Restaurant and Lounge (Score: 55) ⭐⭐
- **Tier 3**
- Toast POS
- Full-service restaurant

### 7. Armando's Pizza Amherstburg (Score: 50) ⭐
- **Tier 3**
- Email: john@armandos.ca
- 16 actual employees in system
- Canadian location

### 8. Meraki Greek Bistro (Score: 50) ⭐
- **Tier 3**
- Greek cuisine
- Downtown location

### 9. Pierce Ave Bar & Grill (Score: 50) ⭐
- **Tier 3**
- Bar & Grill concept

### 10. Mulligan's Pub & Grill (Score: 50) ⭐
- **Tier 3**
- Email: nate@golfthecrown.com
- Golf-themed pub

---

## Recommended Next Steps

### Option A: Manual Research (Recommended for Now)

**Focus on Top 20 leads** from priority queue.

For each lead:
1. Google search to find website
2. Check locations page
3. Count job postings
4. Look for parent company
5. Validate declared data
6. Assign confidence score

**Timeline:** 10-15 minutes per lead = 3-5 hours total for top 20

**Tool to use:** Task tool with restaurant-staffing-researcher agent

---

### Option B: Google Custom Search API (For Scaling)

To automate website finding for all 50+ leads.

**Requirements:**
- Google Cloud account
- Custom Search API key
- Cost: ~$5 per 1,000 queries

**Implementation:**
1. Set up Google Custom Search API
2. Update `automated_researcher.py` to find websites first
3. Then scrape found websites
4. Run on all 50 priority leads

**Timeline:** 1-2 hours setup + automated execution

---

### Option C: Hybrid Approach (Best Balance)

1. **Immediate:** Manually research Top 2 Tier 2 leads (30 minutes)
   - Sweet Tea Express
   - Hareloom Cafe LLC

2. **This Week:** Use Task tool for Top 20 Tier 3 leads (3-5 hours)
   - Batch research in groups of 5
   - Document findings

3. **Next Week:** If valuable, set up Google API for remaining 30 leads

---

## Tools Created

### 1. `automated_researcher.py`
- Full web scraping implementation
- **Limitation:** Requires website URLs (not in trial data)
- **Future use:** Once websites are found/provided

### 2. `filter_best_trials.py` ✅ READY TO USE
- Filters and prioritizes trials for research
- Scores based on tier, data quality, indicators
- **Output:** `data/output/priority_research_queue.csv` (50 leads)

### 3. `requirements-research.txt`
- All dependencies installed
- Ready for web scraping when URLs available

---

## Key Insights from First 500

### 1. High "Your Restaurant" Count
- Many test/demo accounts in data
- Filter tool removes these automatically

### 2. Limited Website Data
- Major blocker for automation
- Need to find websites manually or via API

### 3. Multi-Location Trials Are Rare
- Only 2 Tier 2 leads in first 500 (0.4%)
- Matches overall dataset pattern (0.2% across all 8,440)

### 4. Tier 3 Dominates
- 234 Tier 3 leads (47% of trials)
- Single-location restaurants are the primary trial demographic

### 5. Professional Email Domains Correlate with Quality
- Leads with company domain emails score higher
- Gmail/Yahoo emails more likely to be smaller operations

---

## Files Generated

- ✅ `data/input/first_500_trials.csv` - Input data
- ✅ `data/output/priority_research_queue.csv` - 50 prioritized leads
- ✅ `data/output/researched_test_10.csv` - Test run results
- ✅ `RESEARCH_LIMITATION.md` - Technical constraints documentation
- ✅ `filter_best_trials.py` - Priority filtering tool
- ✅ `automated_researcher.py` - Web scraper (needs URLs)

---

## Success Metrics

**If we research top 20 leads:**
- Expected: 15-18 validated restaurants (75-90% accuracy)
- Expected: 3-5 "hidden" multi-location groups discovered
- Expected: 8-12 high-confidence leads for sales outreach

**ROI:**
- 3-5 hours research time
- 10-15 qualified leads with validated data
- Better than cold calling 500 trials with no validation

---

## Next Action

**Recommended:** Start with Top 2 Tier 2 leads today.

Use this prompt with Task tool:

```
Research this restaurant trial:

Company: Sweet Tea Express
Email: greg@sweetteaexpress.com
Declared: 4 locations, 1-10 employees

Find:
1. Website URL
2. Actual location count
3. Employee estimate (from job postings)
4. Restaurant type (QSR/FSR/Fast Casual)
5. Parent company (if any)
6. Job posting count
7. Confidence score (High/Medium/Low)

Format as JSON.
```

---

*Analysis complete: December 3, 2025*
*Priority queue ready for research*
