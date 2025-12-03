require('dotenv').config();
const { ApifyClient } = require('apify-client');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

/**
 * Parse the location_place_ids field to extract Google Place IDs
 */
function parseGooglePlaceIds(placeIdsString) {
    if (!placeIdsString || placeIdsString.trim() === '') {
        return [];
    }

    const placeIds = [];
    // Extract all google_place_id values using regex
    const regex = /google_place_id:([^,\)]+)/g;
    let match;

    while ((match = regex.exec(placeIdsString)) !== null) {
        const placeId = match[1].trim();
        if (!placeIds.includes(placeId)) {
            placeIds.push(placeId);
        }
    }

    return placeIds;
}

/**
 * Research restaurant using specific Google Place ID
 */
async function researchWithPlaceId(trial) {
    const companyName = trial['Company / Account'];
    const email = trial['Email'];
    const declaredLocations = trial['Declared Number of Locations'];
    const placeIdsString = trial['location_place_ids'];

    console.log(`\n🔬 Researching: ${companyName}`);
    console.log(`   Email: ${email}`);

    const result = {
        company_name: companyName,
        email: email,
        declared_locations: declaredLocations,

        // Google Maps findings
        actual_locations_found: 0,
        primary_place_id: null,
        primary_location_name: null,
        primary_website: null,
        primary_address: null,
        primary_phone: null,
        primary_rating: null,
        primary_review_count: 0,
        primary_category: null,

        all_place_ids: null,
        all_locations: null,

        research_status: 'Complete',
        research_date: new Date().toISOString(),
    };

    // Skip test accounts
    if (companyName.toLowerCase() === 'your restaurant') {
        result.research_status = 'Skipped - Test account';
        return result;
    }

    // Parse place IDs
    const placeIds = parseGooglePlaceIds(placeIdsString);

    if (placeIds.length === 0) {
        console.log(`   ⚠️  No Google Place IDs found`);
        result.research_status = 'No Place IDs';
        return result;
    }

    console.log(`   📍 Found ${placeIds.length} Google Place ID(s)`);
    result.actual_locations_found = placeIds.length;
    result.all_place_ids = placeIds.join('; ');

    try {
        // Use the Google Maps Scraper with Place IDs directly
        // We'll search using place IDs in the startUrls
        const input = {
            startUrls: placeIds.slice(0, 5).map(placeId => ({
                url: `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}`
            })),
            proxyConfig: { useApifyProxy: true },
            maxCrawledPlaces: placeIds.length
        };

        console.log(`   🔍 Fetching data for ${Math.min(placeIds.length, 5)} location(s)...`);

        const run = await client.actor('compass/crawler-google-places').call(input, {
            waitSecs: 30,
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            // Use first location as primary
            const primaryLocation = items[0];
            console.log(`   ✅ Primary Location: ${primaryLocation.title}`);

            result.primary_place_id = placeIds[0];
            result.primary_location_name = primaryLocation.title;
            result.primary_website = primaryLocation.website || null;
            result.primary_address = primaryLocation.address;
            result.primary_phone = primaryLocation.phone;
            result.primary_rating = primaryLocation.totalScore;
            result.primary_review_count = primaryLocation.reviewsCount || 0;
            result.primary_category = primaryLocation.categoryName;

            // Store all location names
            const allLocationNames = items.map(item => item.title);
            result.all_locations = allLocationNames.join(' | ');

            console.log(`   📊 Reviews: ${result.primary_review_count}, Rating: ${result.primary_rating}`);
            console.log(`   🌐 Website: ${result.primary_website || 'Not found'}`);
            console.log(`   📍 ${result.actual_locations_found} location(s): ${allLocationNames.join(', ')}`);

        } else {
            console.log(`   ⚠️  No data returned from Google Maps`);
            result.research_status = 'No data returned';
        }

    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        result.research_status = `Error: ${error.message}`;
    }

    return result;
}

async function main() {
    console.log('='.repeat(70));
    console.log('RESEARCH USING GOOGLE PLACE IDs - NEXT 50 TRIALS (11-60)');
    console.log('='.repeat(70));
    console.log();

    const inputFile = '/Users/justin.holmes/Downloads/enriched_with_gplace_ids.csv';
    const outputFile = 'data/output/researched_with_place_ids_50.csv';

    console.log(`📊 Reading trials from: ${inputFile}`);

    const trials = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('data', (row) => trials.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    // Process trials 11-60 (excluding test accounts)
    const validTrials = trials
        .filter(t => t['Company / Account'].toLowerCase() !== 'your restaurant')
        .slice(10, 60);  // Skip first 10, take next 50

    console.log(`🎯 Processing trials 11-60 (50 trials)`);
    console.log(`⏱️  Estimated time: ~${Math.round(validTrials.length * 30 / 60)} minutes\n`);

    const results = [];

    for (let i = 0; i < validTrials.length; i++) {
        const trial = validTrials[i];
        console.log(`[${i + 1}/${validTrials.length}] (Trial #${i + 11})`);

        const result = await researchWithPlaceId(trial);
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
    console.log('RESEARCH COMPLETE - BATCH 11-60');
    console.log('='.repeat(70));

    const withPlaceIds = results.filter(r => r.actual_locations_found > 0).length;
    const multiLocation = results.filter(r => r.actual_locations_found > 1).length;
    const withWebsite = results.filter(r => r.primary_website).length;
    const avgReviews = Math.round(
        results.reduce((sum, r) => sum + (r.primary_review_count || 0), 0) / results.length
    );

    console.log(`\nTotal processed: ${results.length}`);
    console.log(`With Place IDs: ${withPlaceIds}`);
    console.log(`Multi-location: ${multiLocation} (${Math.round(multiLocation / results.length * 100)}%)`);
    console.log(`With website: ${withWebsite} (${Math.round(withWebsite / results.length * 100)}%)`);
    console.log(`Avg reviews: ${avgReviews}`);

    console.log(`\nMulti-Location Breakdown:`);
    const multiLocationResults = results.filter(r => r.actual_locations_found > 1);
    if (multiLocationResults.length > 0) {
        multiLocationResults.forEach(r => {
            console.log(`  ${r.company_name}: ${r.actual_locations_found} locations - ${r.email}`);
        });
    } else {
        console.log(`  None found in this batch`);
    }

    console.log(`\nTop 5 by Review Count:`);
    const topByReviews = results
        .filter(r => r.primary_review_count > 0)
        .sort((a, b) => b.primary_review_count - a.primary_review_count)
        .slice(0, 5);

    topByReviews.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.company_name}: ${r.primary_review_count} reviews, ${r.primary_rating}★`);
    });

    console.log(`\n📄 Results saved to: ${outputFile}`);
    console.log('='.repeat(70));
}

if (require.main === module) {
    main().catch(console.error);
}
