require('dotenv').config();
const { ApifyClient } = require('apify-client');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

// Read the research functions
const { researchTrial } = require('./apify_trial_researcher.js');

async function main() {
    console.log('='.repeat(70));
    console.log('TESTING UPDATED APIFY SCRIPT');
    console.log('='.repeat(70));
    console.log();

    const inputFile = 'data/output/priority_research_queue.csv';
    const outputFile = 'data/output/test_batch_results.csv';

    console.log(`📊 Reading trials from: ${inputFile}`);

    const trials = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('data', (row) => trials.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    // Test with just 3 trials
    const trialsToTest = trials.slice(0, 3);

    console.log(`🎯 Testing ${trialsToTest.length} trials`);
    console.log(`⏱️  Estimated time: ${trialsToTest.length * 60} seconds\n`);

    const results = [];

    for (let i = 0; i < trialsToTest.length; i++) {
        const trial = trialsToTest[i];
        console.log(`[${i + 1}/${trialsToTest.length}]`);

        const result = await researchTrial(trial);
        results.push(result);

        console.log(`\n  Result Summary:`);
        console.log(`  - Website: ${result.website || 'Not found'}`);
        console.log(`  - Google Maps: ${result.google_maps_url ? 'Found' : 'Not found'}`);
        console.log(`  - Rating: ${result.rating || 'N/A'}`);
        console.log(`  - Reviews: ${result.review_count}`);
        console.log(`  - Job Postings: ${result.job_postings_count}`);
        console.log(`  - Confidence: ${result.confidence_tier} (${result.confidence_score})`);
        console.log();

        // Add delay between trials
        if (i < trialsToTest.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
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

    console.log('='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n📄 Results saved to: ${outputFile}`);
}

main().catch(console.error);
