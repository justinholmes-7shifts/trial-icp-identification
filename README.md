# Trial ICP Identification

Automated workflow for identifying and scoring restaurant trial customers based on 7shifts ICP criteria.

## Overview

This tool processes a list of companies who have started trials for workforce management software, identifies which are restaurants, researches their details, and scores them according to the 7shifts tiering system.

## Tiering System

### Tier 1 - FSR Scale (Best Fit)
- **2-5 locations**
- **Full-Service Restaurant**
- **30+ employees per location**

### Tier 2 - Multi-Loc (Strong Fit)
- **2-5 locations**
- **Any service type**
- **15+ employees per location**
- *Note: Excludes 30+ employees/loc FSR (those are Tier 1)*

### Tier 3 - Single Loc (Strong Fit)
- **Single location**
- **Any service type**
- **15+ employees per location**

### Tier 4 - Franchise Multi-Loc (Neutral/Not a fit)
- **6-15 locations**
- **QSR Franchise Groups OR Groups with low customization**

### Tier 5 - Neutral/Not a Fit
- **Single location with 14 or fewer employees**
- **Non-restaurants**
- **Multi-location or enterprise with high customization**
- **Groups with over 15 corporate stores**

## Workflow

1. **Upload trial list** - CSV with company names and any available contact/website info
2. **Identify restaurants** - Filter for restaurant businesses
3. **Research details** - Gather:
   - Restaurant type (FSR/QSR/Fast Casual/etc.)
   - Number of locations
   - Estimated employees per location
   - Location(s)
4. **Score & tier** - Assign Tier 1-4 based on criteria above
5. **Export results** - Prioritized list with research findings

## Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Run the identifier
python identify_trial_icps.py --input trials.csv --output scored_trials.csv
```

## Input Format

CSV with columns:
- `company_name` (required)
- `website` (optional)
- `contact_name` (optional)
- `email` (optional)
- `phone` (optional)

## Output Format

CSV with enriched data:
- All input columns
- `is_restaurant` (Yes/No)
- `restaurant_type` (FSR/QSR/Fast Casual/etc.)
- `num_locations` (1, 2-5, 6-15, 16+)
- `employees_per_location` (estimated)
- `total_employees` (estimated)
- `locations` (city/state)
- `tier` (1-5)
- `tier_reason` (explanation)
- `research_notes` (key findings)
- `research_sources` (URLs)

## Research Sources

The tool automatically checks:
- Company website
- Yelp listings
- Google Business listings
- Indeed job postings (for employee count signals)
- Public review sites

## Project Structure

```
trial-icp-identification/
├── README.md
├── identify_trial_icps.py      # Main script
├── requirements.txt            # Python dependencies
├── data/
│   ├── input/                  # Upload trial lists here
│   └── output/                 # Scored results saved here
└── examples/
    ├── sample_input.csv        # Example input format
    └── sample_output.csv       # Example output format
```
