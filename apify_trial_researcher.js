/**
 * Apify Trial Researcher
 *
 * Uses Apify actors to research restaurant trials:
 * 1. Google Search Actor - Find restaurant websites
 * 2. Web Scraper - Extract locations, job postings
 * 3. Yelp Scraper - Get business info, reviews
 *
 * Setup:
 * 1. npm install apify-client csv-parser csv-writer dotenv
 * 2. Set APIFY_TOKEN in .env file
 * 3. Run: node apify_trial_researcher.js
 */

require('dotenv').config();
const { ApifyClient } = require('apify-client');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

/**
 * Find restaurant website using Google Search
 */
async function findWebsite(companyName, city = '') {
    console.log(`  🔍 Finding website for: ${companyName}`);

    try {
        // Use Google Search Scraper actor
        const input = {
            queries: [`${companyName} restaurant ${city}`.trim()],
            maxPagesPerQuery: 1,
            resultsPerPage: 5,
            mobileResults: false,
        };

        const run = await client.actor('nFJndFXA5zjCTuudP').call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            // Return first organic result URL
            const firstResult = items[0].organicResults?.[0];
            if (firstResult) {
                console.log(`    ✅ Found: ${firstResult.url}`);
                return {
                    website: firstResult.url,
                    title: firstResult.title,
                    description: firstResult.description,
                };
            }
        }

        console.log(`    ⚠️  No website found`);
        return null;

    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Scrape Yelp for restaurant details
 */
async function scrapeYelp(companyName, city = '') {
    console.log(`  🍽️  Searching Yelp for: ${companyName}`);

    try {
        // Use Yelp Scraper actor
        const input = {
            searchTerms: [`${companyName} ${city}`.trim()],
            maxItems: 5,
        };

        const run = await client.actor('dSCLg0C3YEZ83HzYX').call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            const business = items[0];
            console.log(`    ✅ Found on Yelp`);

            return {
                yelp_url: business.url,
                rating: business.rating,
                review_count: business.reviewCount,
                price_range: business.priceRange,
                categories: business.categories?.join(', '),
                address: business.address,
                phone: business.phone,
            };
        }

        console.log(`    ⚠️  Not found on Yelp`);
        return null;

    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Scrape website for locations and job postings
 */
async function scrapeWebsite(websiteUrl) {
    console.log(`  🌐 Scraping website: ${websiteUrl}`);

    try {
        // Use Web Scraper actor
        const input = {
            startUrls: [{ url: websiteUrl }],
            linkSelector: 'a[href]',
            pageFunction: async function pageFunction(context) {
                const { page, request } = context;

                const title = await page.title();
                const url = request.url;

                // Look for locations page link
                const locationsLink = await page.$eval(
                    'a[href*="location"], a[href*="store"]',
                    el => el.href
                ).catch(() => null);

                // Look for careers page link
                const careersLink = await page.$eval(
                    'a[href*="career"], a[href*="job"], a[href*="hiring"]',
                    el => el.href
                ).catch(() => null);

                // Look for footer copyright (parent company)
                const footer = await page.$eval(
                    'footer',
                    el => el.textContent
                ).catch(() => null);

                return {
                    title,
                    url,
                    locationsLink,
                    careersLink,
                    footer,
                };
            },
            maxRequestsPerCrawl: 5,
            maxConcurrency: 1,
        };

        const run = await client.actor('apify/web-scraper').call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            console.log(`    ✅ Scraped website`);
            return items[0];
        }

        console.log(`    ⚠️  Could not scrape website`);
        return null;

    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Research a single trial
 */
async function researchTrial(trial) {
    const companyName = trial.company_name;
    console.log(`\n🔬 Researching: ${companyName}`);

    const result = {
        company_name: companyName,
        email: trial.email,
        tier: trial.tier,
        declared_locations: trial.num_locations,

        // Research findings
        website: null,
        website_title: null,
        yelp_url: null,
        rating: null,
        review_count: 0,
        price_range: null,
        address: null,
        phone: null,

        // Validation
        locations_found: 0,
        job_postings_found: 0,
        parent_company: null,

        // Confidence
        confidence_score: 50,
        confidence_tier: 'Low',

        research_status: 'Complete',
        research_date: new Date().toISOString(),
    };

    // Skip non-restaurants
    if (trial.is_restaurant !== 'Yes') {
        result.research_status = 'Skipped - Not a restaurant';
        return result;
    }

    // Skip test accounts
    if (companyName.toLowerCase() === 'your restaurant') {
        result.research_status = 'Skipped - Test account';
        return result;
    }

    try {
        // 1. Find website via Google
        const websiteData = await findWebsite(companyName);
        if (websiteData) {
            result.website = websiteData.website;
            result.website_title = websiteData.title;
            result.confidence_score += 15;
        }

        // 2. Get Yelp data
        const yelpData = await scrapeYelp(companyName);
        if (yelpData) {
            Object.assign(result, yelpData);
            result.confidence_score += 10;

            if (yelpData.review_count >= 100) {
                result.confidence_score += 10;
            } else if (yelpData.review_count >= 50) {
                result.confidence_score += 5;
            }
        }

        // 3. Scrape website if found
        if (result.website) {
            const websiteContent = await scrapeWebsite(result.website);
            if (websiteContent) {
                // Check for parent company in footer
                if (websiteContent.footer) {
                    const copyrightMatch = websiteContent.footer.match(/©\s*\d{4}\s+([A-Z][A-Za-z\s&]+(?:LLC|Inc|Group|Hospitality))/);
                    if (copyrightMatch) {
                        result.parent_company = copyrightMatch[1].trim();
                        result.confidence_score += 20; // Bonus for multi-brand group
                    }
                }
            }
        }

        // Calculate confidence tier
        if (result.confidence_score >= 90) {
            result.confidence_tier = 'High';
        } else if (result.confidence_score >= 70) {
            result.confidence_tier = 'Medium';
        } else if (result.confidence_score >= 50) {
            result.confidence_tier = 'Low';
        } else {
            result.confidence_tier = 'Very Low';
        }

    } catch (error) {
        console.error(`  ❌ Research failed: ${error.message}`);
        result.research_status = `Error: ${error.message}`;
    }

    return result;
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(70));
    console.log('APIFY TRIAL RESEARCHER');
    console.log('='.repeat(70));
    console.log();

    // Check for API token
    if (!process.env.APIFY_TOKEN) {
        console.error('❌ Error: APIFY_TOKEN not found in environment');
        console.error('Please set APIFY_TOKEN in your .env file');
        process.exit(1);
    }

    // Read priority queue
    const inputFile = 'data/output/priority_research_queue.csv';
    const outputFile = 'data/output/apify_researched_trials.csv';

    console.log(`📊 Reading trials from: ${inputFile}`);

    const trials = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('data', (row) => trials.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    // Process only top 10 for now (to avoid excessive API usage)
    const trialsToResearch = trials.slice(0, 10);

    console.log(`🎯 Researching ${trialsToResearch.length} trials`);
    console.log(`⏱️  Estimated time: ${trialsToResearch.length * 30} seconds\n`);

    const results = [];

    for (let i = 0; i < trialsToResearch.length; i++) {
        const trial = trialsToResearch[i];
        console.log(`[${i + 1}/${trialsToResearch.length}]`);

        const result = await researchTrial(trial);
        results.push(result);

        // Add delay to avoid rate limiting
        if (i < trialsToResearch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Write results to CSV
    if (results.length > 0) {
        const csvWriter = createObjectCsvWriter({
            path: outputFile,
            header: Object.keys(results[0]).map(key => ({ id: key, title: key }))
        });

        await csvWriter.writeRecords(results);
    }

    // Summary
    console.log();
    console.log('='.repeat(70));
    console.log('RESEARCH COMPLETE');
    console.log('='.repeat(70));

    const processed = results.filter(r => r.research_status === 'Complete').length;
    const skipped = results.filter(r => r.research_status.includes('Skipped')).length;
    const withWebsite = results.filter(r => r.website).length;
    const withYelp = results.filter(r => r.yelp_url).length;

    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Websites found: ${withWebsite}`);
    console.log(`Yelp profiles found: ${withYelp}`);

    console.log(`\nConfidence Distribution:`);
    const confidenceCounts = {};
    results.forEach(r => {
        confidenceCounts[r.confidence_tier] = (confidenceCounts[r.confidence_tier] || 0) + 1;
    });

    ['High', 'Medium', 'Low', 'Very Low'].forEach(tier => {
        const count = confidenceCounts[tier] || 0;
        if (count > 0) {
            console.log(`  ${tier}: ${count}`);
        }
    });

    console.log(`\n📄 Results saved to: ${outputFile}`);
    console.log('='.repeat(70));
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { researchTrial, findWebsite, scrapeYelp, scrapeWebsite };
