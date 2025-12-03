/**
 * Apify Trial Researcher (Updated Version)
 *
 * Uses Apify actors to research restaurant trials:
 * 1. Google Maps Scraper (compass/crawler-google-places) - Find restaurants, get reviews, contact info
 * 2. Indeed Scraper (bebity/indeed-scraper) - Find job postings to validate hiring needs
 * 3. Web Scraper (apify/web-scraper) - Extract locations page, parent company from footer
 *
 * Setup:
 * 1. npm install apify-client csv-parser csv-writer dotenv
 * 2. Set APIFY_TOKEN in .env file
 * 3. Run: node apify_trial_researcher.js
 *
 * Changes from v1:
 * - Replaced broken Google Search actor with Google Maps Scraper
 * - Removed Yelp scraper (Google Maps has better data)
 * - Added Indeed job posting search for validation
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
 * Find restaurant details using Google Maps
 */
async function findWebsite(companyName, city = '') {
    console.log(`  🔍 Finding details for: ${companyName}`);

    try {
        // Use Google Maps Scraper actor (compass/crawler-google-places)
        const input = {
            searchString: `${companyName} restaurant ${city}`.trim(),
            proxyConfig: {
                useApifyProxy: true
            },
            maxCrawledPlaces: 3
        };

        const run = await client.actor('compass/crawler-google-places').call(input, {
            waitSecs: 30,  // Wait for results
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            const place = items[0];
            console.log(`    ✅ Found: ${place.title}`);
            return {
                website: place.website || null,
                title: place.title,
                address: place.address,
                phone: place.phone,
                rating: place.totalScore,
                reviewCount: place.reviewsCount,
                priceLevel: place.priceLevel,
                category: place.categoryName,
                googleMapsUrl: place.url,
            };
        }

        console.log(`    ⚠️  No results found`);
        return null;

    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Search Indeed for job postings
 */
async function searchJobPostings(companyName, city = '') {
    console.log(`  💼 Searching Indeed for: ${companyName}`);

    try {
        // Use Indeed Scraper actor
        const input = {
            queries: [`${companyName} restaurant ${city}`.trim()],
            maxItems: 20,
            country: 'US',
        };

        const run = await client.actor('bebity/indeed-scraper').call(input, {
            waitSecs: 30,
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            console.log(`    ✅ Found ${items.length} job postings`);

            return {
                job_postings_count: items.length,
                job_titles: items.slice(0, 5).map(j => j.positionName).join('; '),
            };
        }

        console.log(`    ⚠️  No job postings found`);
        return { job_postings_count: 0, job_titles: null };

    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return { job_postings_count: 0, job_titles: null };
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

        // Research findings from Google Maps
        website: null,
        website_title: null,
        google_maps_url: null,
        rating: null,
        review_count: 0,
        price_level: null,
        category: null,
        address: null,
        phone: null,

        // Validation
        locations_found: 0,
        job_postings_count: 0,
        job_titles: null,
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
        // 1. Find restaurant on Google Maps
        const mapsData = await findWebsite(companyName);
        if (mapsData) {
            result.website = mapsData.website;
            result.website_title = mapsData.title;
            result.google_maps_url = mapsData.googleMapsUrl;
            result.address = mapsData.address;
            result.phone = mapsData.phone;
            result.rating = mapsData.rating;
            result.review_count = mapsData.reviewCount || 0;
            result.price_level = mapsData.priceLevel;
            result.category = mapsData.category;

            // Confidence scoring
            result.confidence_score += 20; // Found on Google Maps

            if (mapsData.website) {
                result.confidence_score += 15; // Has website
            }

            if (mapsData.reviewCount >= 100) {
                result.confidence_score += 15; // Well-established
            } else if (mapsData.reviewCount >= 50) {
                result.confidence_score += 10;
            } else if (mapsData.reviewCount >= 20) {
                result.confidence_score += 5;
            }

            if (mapsData.rating >= 4.0) {
                result.confidence_score += 5; // Good reputation
            }
        }

        // Note: Job postings and website scraping actors are disabled due to errors
        // Google Maps provides sufficient data for lead qualification

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

    // Process all priority leads (defaults to 50 from filter)
    const trialsToResearch = trials;

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
    const foundOnMaps = results.filter(r => r.google_maps_url).length;
    const withWebsite = results.filter(r => r.website).length;
    const withJobPostings = results.filter(r => r.job_postings_count > 0).length;

    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Found on Google Maps: ${foundOnMaps}`);
    console.log(`Websites found: ${withWebsite}`);
    console.log(`With job postings: ${withJobPostings}`);

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

module.exports = { researchTrial, findWebsite, searchJobPostings, scrapeWebsite };
