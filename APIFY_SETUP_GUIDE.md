# Apify Research Setup Guide

## Issue Discovered

The Apify actors we tried to use have different input requirements than expected.

**Errors:**
- Google Search actor: `Field input.queries must be string`
- Yelp actor: `Field input.usernames is required`

This means we need to either:
1. Find the correct actor IDs for our use case
2. Use different input formats
3. Use Task tool instead (simpler, works immediately)

## Recommended Approach

Since setting up Apify correctly requires:
- Finding the right actors in Apify Store
- Understanding each actor's input schema
- Testing and debugging
- Managing API costs

**I recommend using the Task tool instead** for researching the top 50 leads.

## Task Tool Approach (Works Now)

### Step 1: Export Top 10 for Research

```bash
python3 -c "
import csv

with open('data/output/priority_research_queue.csv', 'r') as f:
    trials = list(csv.DictReader(f))

# Get top 10
top_10 = trials[:10]

print('TOP 10 TRIALS FOR RESEARCH:')
print('='*70)
for i, t in enumerate(top_10, 1):
    print(f'{i}. {t[\"company_name\"]}')
    print(f'   Email: {t[\"email\"]}')
    print(f'   Tier: {t[\"tier\"]}')
    print()
"
```

### Step 2: Research Each One with Task Tool

For each trial, use this approach:

```
I'll use the Task tool to research this restaurant trial lead.
```

Then invoke Task tool with `subagent_type='restaurant-staffing-researcher'` and provide:

```
Research this restaurant trial:

Company: Sweet Tea Express
Email: greg@sweetteaexpress.com
Declared: 4 locations
Tier: Tier 2

Find and provide:
1. Website URL
2. Actual number of locations (from website/Yelp)
3. Restaurant type (QSR/FSR/Fast Casual/Cafe)
4. Estimated employees (from job postings)
5. Price range ($, $$, $$$)
6. Job postings count (Indeed/career page)
7. Parent company (if found)
8. Confidence score (High/Medium/Low)

Return structured JSON.
```

### Step 3: Compile Results

After researching each lead, compile into a summary CSV.

##If You Want to Use Apify (Future)

### Option 1: Use Apify Console Manually

1. Go to https://console.apify.com/
2. Find actors in store:
   - "Google Search Results Scraper"
   - "Yelp Scraper"
   - "Website Content Crawler"
3. Test each one manually with sample input
4. Once working, automate with script

### Option 2: Use Simpler Apify Actors

Instead of Google/Yelp scrapers, use:
- **Web Scraper** (apify/web-scraper) - Generic website scraping
- **Cheerio Scraper** (apify/cheerio-scraper) - Fast HTML scraping
- Just provide URLs directly (find them manually first)

### Option 3: Build Custom Apify Actor

Create your own Apify actor that:
1. Takes restaurant name
2. Does Google search
3. Scrapes website
4. Returns structured data

This would be custom code but fully controlled.

## Cost Comparison

### Task Tool (Recommended):
- **Cost:** Included in Claude Code usage
- **Time:** 10-15 min per lead
- **Quality:** High (uses your existing agent)
- **Total for 50 leads:** 8-12 hours manual work

### Apify (If Configured):
- **Cost:** ~$10-20 for 50 leads (actor usage)
- **Time:** 2-3 hours to set up, then automated
- **Quality:** Good (but needs validation)
- **Total:** Setup time + API costs

## Recommendation

**For top 50 leads:** Use Task tool
- No setup required
- Works immediately
- High quality research
- Can start today

**For scaling to 500+ leads:** Invest in Apify setup
- Worth the setup time for volume
- Automated execution
- Consistent results

## Current Status

✅ Priority filter working (50 leads identified)
✅ Apify token configured
❌ Apify actors need correct configuration
✅ Task tool ready to use as alternative

**Next step:** Use Task tool to research top 10-20 leads this week.

---

*Created: December 3, 2025*
*Apify approach blocked by actor configuration issues*
*Task tool recommended as immediate solution*
