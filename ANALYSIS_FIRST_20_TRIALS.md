# Analysis: First 20 Trials

Date: 2025-12-03

## Summary

- **Total Trials**: 20
- **Restaurants Identified**: 13 (65%)
- **Non-Restaurants**: 7 (35%)

## Tier Distribution

| Tier | Count | Percentage | Description |
|------|-------|------------|-------------|
| **Tier 1** | 0 | 0% | FSR Scale (2-5 locs, FSR, 30+ emp/loc) |
| **Tier 2** | 1 | 5% | Multi-Loc (2-5 locs, any type, 15+ emp/loc) |
| **Tier 3** | 10 | 50% | Single Loc (1 loc, any type, 15+ emp/loc) |
| **Tier 4** | 0 | 0% | Franchise Multi-Loc (6-15 locs) |
| **Tier 5** | 9 | 45% | Neutral/Not a fit |

## Key Insights

### Strong Leads (Tiers 1-3): 11 trials (55%)

**Tier 2 - Multi-Location (1 trial):**
1. **Sweet Tea Express** - 4 locations, "1 To 10" employees declared

**Tier 3 - Single Location (10 trials):**
1. **SouthernEaze Bar and Grill** - FSR, bar & grill
2. **Carbones Pizza** - Pizza restaurant, 31-50 employees declared
3. **Chop Steakhouse & Bar** - FSR, 51+ employees declared
4. **Steve Short Culinary Team** - Culinary/catering, 51+ employees declared
5. **your restaurant** - Generic trial signup (likely testing)
6. **Spoon and Stable** - High-end restaurant (Minneapolis)
7. **Nagisa Sushi** - Sushi restaurant
8. **Beto's Mexican Restaurant and Catering** - Mexican restaurant, 11-30 employees
9. **Cool Beerwerks** - Brewery/restaurant, 11-30 employees
10. **Armando's Pizza Amherstburg** - Pizza restaurant, 16 actual employees

### Notable Cases

**High Potential - Needs Manual Review:**
- **Carbones Pizza** - Declared 31-50 employees, single location, using Clover POS
- **Chop Steakhouse & Bar** - Part of larger hospitality group (eatzhospitality.com), 51+ employees
- **Spoon and Stable** - Famous Minneapolis restaurant, needs actual employee count
- **Armando's Pizza** - Has 16 actual employees in system

**Likely Too Small (Tier 5):**
- **3Natives - Abacoa** - Only 5 employees, smoothie/acai bowl concept
- **Gold Room F&B** - Only 5 employees despite declaring 31-50

**Non-Restaurants Filtered:**
- Neighbor
- Crickle's and Co.
- Frank Inc.
- East Greenwich Yacht Club
- Studio@Mainstreet
- Verde (might be restaurant - needs review)
- Timber Creek Camp

## Observations

1. **Most trials are single-location restaurants** - 77% of restaurants (10/13) are single location
2. **Very few multi-location trials** - Only 1 trial in Tier 2, none in Tier 1 or 4
3. **Employee count accuracy varies** - Some declare high counts but have low actual employees
4. **POS integration common** - Most have declared POS (Toast, Clover, Other, etc.)

## Recommendations

1. **Focus on Tier 2-3 leads** - These are the current sweet spot
2. **Manually verify Carbones and Chop** - High employee counts suggest strong fit
3. **Review "Verde"** - May be restaurant that was mis-classified
4. **Consider multi-location targeting** - Very low representation in trial data

## Data Quality Notes

- "your restaurant" entries are likely test/demo accounts
- Declared employee counts don't always match actual counts
- Some famous restaurants (Spoon and Stable) lack complete data in system
- POS field is strong indicator of restaurant vs non-restaurant
