// Test script for enhanced analysis features
// Run with: node test-enhanced-analysis.js

const testUrls = {
  ios: 'https://apps.apple.com/us/app/instagram/id389801252',
  android: 'https://play.google.com/store/apps/details?id=com.instagram.android'
};

async function testAnalysis(baseUrl, options = {}) {
  console.log(`\n🧪 Testing ${options.platform} analysis with options:`, options);
  console.log(`📱 URL: ${baseUrl}`);

  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appUrl: baseUrl,
        platform: options.platform,
        options: {
          ratingFilter: options.focusNegative ? [1, 2, 3] : undefined,
          deepMode: options.deepMode || false,
          multiCountry: options.multiCountry || false,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Analysis started successfully!`);
      console.log(`📊 Task ID: ${data.taskId}`);
      console.log(`🔗 Results URL: http://localhost:3000/analysis/${data.appSlug}`);
      console.log(`🕐 Status: ${data.status}`);

      if (data.cached) {
        console.log(`💾 Using cached analysis (${data.cacheDays} day cache)`);
      } else {
        console.log(`🔄 New analysis started`);
        console.log(`⏱️ Expected time: ${options.multiCountry ? '2-4 min' : options.deepMode ? '1-2 min' : '30-60 sec'}`);
      }
    } else {
      console.log(`❌ Analysis failed: ${data.error}`);
      if (data.details) {
        console.log(`📋 Details:`, data.details);
      }
    }
  } catch (error) {
    console.error(`🚨 Test failed:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Enhanced Analysis Tests');
  console.log('=' .repeat(50));

  // Test 1: Standard iOS Analysis
  await testAnalysis(testUrls.ios, {
    platform: 'ios',
    focusNegative: true,
    deepMode: false,
    multiCountry: false,
  });

  // Test 2: Deep Mode iOS Analysis
  await testAnalysis(testUrls.ios, {
    platform: 'ios',
    focusNegative: true,
    deepMode: true,
    multiCountry: false,
  });

  // Test 3: Multi-Country iOS Analysis
  await testAnalysis(testUrls.ios, {
    platform: 'ios',
    focusNegative: true,
    deepMode: false,
    multiCountry: true,
  });

  // Test 4: Standard Android Analysis
  await testAnalysis(testUrls.android, {
    platform: 'android',
    focusNegative: true,
    deepMode: false,
    multiCountry: false,
  });

  // Test 5: Deep Mode Android Analysis
  await testAnalysis(testUrls.android, {
    platform: 'android',
    focusNegative: true,
    deepMode: true,
    multiCountry: false,
  });

  console.log('\n✨ All tests completed!');
  console.log('📝 Check the results URLs above to see the analysis reports');
}

// Check if running in Node.js environment
if (typeof window === 'undefined' && typeof fetch !== 'undefined') {
  runTests().catch(console.error);
} else if (typeof window !== 'undefined') {
  // Browser environment
  console.log('📝 To run this test, open browser console and run:');
  console.log('fetch("/api/analyze", { ... })');
} else {
  console.log('📦 Install node-fetch to run this test: npm install node-fetch');
}