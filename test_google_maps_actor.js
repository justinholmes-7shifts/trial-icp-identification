require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

async function testGoogleMapsSearch() {
    console.log('Testing Google Maps actor with restaurant search...\n');
    
    // Example from API: searchString format
    const input = {
        searchString: "Sweet Tea Express restaurant",
        proxyConfig: {
            useApifyProxy: true
        },
        maxCrawledPlaces: 3
    };
    
    console.log('Input:', JSON.stringify(input, null, 2));
    
    try {
        // Actor ID: compass/crawler-google-places
        const run = await client.actor('compass/crawler-google-places').call(input, {
            waitSecs: 0,  // Don't wait for completion
        });
        
        console.log('\n✅ Actor started successfully!');
        console.log('Run ID:', run.id);
        console.log('Status:', run.status);
        console.log('\nCheck results at:', `https://console.apify.com/actors/runs/${run.id}`);
        
        // Wait a bit and check results
        console.log('\nWaiting 30 seconds for results...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        console.log('\nResults found:', dataset.items.length);
        
        if (dataset.items.length > 0) {
            const place = dataset.items[0];
            console.log('\nFirst result:');
            console.log('  Name:', place.title);
            console.log('  Address:', place.address);
            console.log('  Phone:', place.phone);
            console.log('  Website:', place.website);
            console.log('  Rating:', place.rating);
            console.log('  Total Score:', place.totalScore);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGoogleMapsSearch();
