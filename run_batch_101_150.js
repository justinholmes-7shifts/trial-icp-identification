require('dotenv').config();
const { ApifyClient } = require('apify-client');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

/**
 * Research restaurant using Google Maps and RE-TIER based on actual findings
 */
async function researchAndRetier(trial) {
    const companyName = trial.company_name;
    console.log(`\n🔬 Researching: ${companyName}`);

    const result = {
        company_name: companyName,
        email: trial.email,
        original_tier: trial.tier,
        new_tier: null,
        declared_locations: trial.num_locations,

        // Google Maps findings
        website: null,
        google_maps_title: null,
        google_maps_url: null,
        rating: null,
        review_count: 0,
        price_level: null,
        category: null,
        address: null,
        phone: null,

        // Re-tiering logic
        appears_multi_location: false,
        appears_fsr: false,
        estimated_size: null,

        confidence_score: 50,
        confidence_tier: 'Low',
        research_status: 'Complete',
        research_date: new Date().toISOString(),
    };

    // Skip test accounts
    if (companyName.toLowerCase() === 'your restaurant') {
        result.research_status = 'Skipped - Test account';
        result.new_tier = 'Tier 5';
        return result;
    }

    try {
        // Find restaurant on Google Maps
        console.log(`  🔍 Finding on Google Maps...`);

        const input = {
            searchString: `${companyName} restaurant`.trim(),
            proxyConfig: { useApifyProxy: true },
            maxCrawledPlaces: 5
        };

        const run = await client.actor('compass/crawler-google-places').call(input, {
            waitSecs: 30,
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            const place = items[0];
            console.log(`    ✅ Found: ${place.title}`);

            result.website = place.website || null;
            result.google_maps_title = place.title;
            result.google_maps_url = place.url;
            result.address = place.address;
            result.phone = place.phone;
            result.rating = place.totalScore;
            result.review_count = place.reviewsCount || 0;
            result.price_level = place.priceLevel;
            result.category = place.categoryName;

            // Confidence scoring
            result.confidence_score += 20;

            if (place.website) result.confidence_score += 15;
            if (place.reviewsCount >= 100) result.confidence_score += 15;
            else if (place.reviewsCount >= 50) result.confidence_score += 10;
            else if (place.reviewsCount >= 20) result.confidence_score += 5;
            if (place.totalScore >= 4.0) result.confidence_score += 5;

            // Check if multiple locations found
            if (items.length >= 3) {
                result.appears_multi_location = true;
                console.log(`    🏢 Multiple locations detected: ${items.length} found`);
            }

            // Detect FSR
            const fsrCategories = ['restaurant', 'seafood', 'steakhouse', 'italian', 'fine dining'];
            const isFSR = fsrCategories.some(cat => place.categoryName?.toLowerCase().includes(cat)) &&
                         (place.priceLevel === '$$$' || place.priceLevel === '$$$$');

            if (isFSR) {
                result.appears_fsr = true;
                console.log(`    🍽️  Appears to be FSR (${place.categoryName}, ${place.priceLevel})`);
            }

            // Estimate size
            if (place.reviewsCount >= 1000) {
                result.estimated_size = 'Large (1000+ reviews)';
            } else if (place.reviewsCount >= 500) {
                result.estimated_size = 'Medium-Large (500+ reviews)';
            } else if (place.reviewsCount >= 100) {
                result.estimated_size = 'Medium (100+ reviews)';
            } else if (place.reviewsCount >= 20) {
                result.estimated_size = 'Small-Medium (20+ reviews)';
            } else {
                result.estimated_size = 'Small (< 20 reviews)';
            }

            // RE-TIER
            if (result.appears_multi_location && isFSR && place.reviewsCount >= 100) {
                result.new_tier = 'Tier 1';
                console.log(`    ⭐ RE-TIERED: Tier 1 (FSR Scale)`);
            } else if (result.appears_multi_location && place.reviewsCount >= 50) {
                result.new_tier = 'Tier 2';
                console.log(`    ⭐ RE-TIERED: Tier 2 (Multi-Location)`);
            } else if (place.reviewsCount >= 50 || (place.reviewsCount >= 20 && isFSR)) {
                result.new_tier = 'Tier 3';
                console.log(`    ⭐ RE-TIERED: Tier 3 (Single Location)`);
            } else {
                result.new_tier = 'Tier 5';
                console.log(`    ⭐ RE-TIERED: Tier 5 (Not a fit)`);
            }

        } else {
            console.log(`    ⚠️  Not found on Google Maps`);
            result.new_tier = 'Tier 5';
        }

        // Calculate confidence tier
        if (result.confidence_score >= 90) result.confidence_tier = 'High';
        else if (result.confidence_score >= 70) result.confidence_tier = 'Medium';
        else if (result.confidence_score >= 50) result.confidence_tier = 'Low';
        else result.confidence_tier = 'Very Low';

    } catch (error) {
        console.error(`  ❌ Research failed: ${error.message}`);
        result.research_status = `Error: ${error.message}`;
        result.new_tier = 'Tier 5';
    }

    return result;
}

async function main() {
    console.log('='.repeat(70));
    console.log('RESEARCH & RE-TIER BATCH 101-150');
    console.log('='.repeat(70));
    console.log();

    const inputFile = 'data/output/batch_101_150.csv';
    const outputFile = 'data/output/researched_batch_101_150.csv';

    console.log(`📊 Reading trials from: ${inputFile}`);

    const trials = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('data', (row) => trials.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    const validTrials = trials.filter(t => t.company_name.toLowerCase() !== 'your restaurant');

    console.log(`🎯 Processing ${validTrials.length} valid trials (${trials.length - validTrials.length} test accounts skipped)`);
    console.log(`⏱️  Estimated time: ~${Math.round(validTrials.length * 45 / 60)} minutes\n`);

    const results = [];

    for (let i = 0; i < validTrials.length; i++) {
        const trial = validTrials[i];
        console.log(`[${i + 1}/${validTrials.length}]`);

        const result = await researchAndRetier(trial);
        results.push(result);

        if (i < validTrials.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Write results
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
    console.log('RESEARCH & RE-TIERING COMPLETE - BATCH 101-150');
    console.log('='.repeat(70));

    const tierChanges = results.filter(r => r.new_tier !== r.original_tier);

    console.log(`\nTotal processed: ${results.length}`);
    console.log(`Tier changes: ${tierChanges.length}`);

    const newTierCounts = {};
    results.forEach(r => {
        newTierCounts[r.new_tier] = (newTierCounts[r.new_tier] || 0) + 1;
    });

    console.log(`\nNew Tier Distribution:`);
    ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'].forEach(tier => {
        const count = newTierCounts[tier] || 0;
        if (count > 0) {
            console.log(`  ${tier}: ${count}`);
        }
    });

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

if (require.main === module) {
    main().catch(console.error);
}
