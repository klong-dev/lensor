#!/usr/bin/env node
/**
 * Test script to check if NSFW detection is working
 *
 * Usage: node test-nsfw-detection.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testNSFWDetection() {
  console.log('🔍 Testing NSFW Detection Feature\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check if server is running
    console.log('\n1️⃣  Checking if server is running...');
    try {
      await axios.get(`${BASE_URL}`);
      console.log('✅ Server is running');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first.');
      return;
    }

    // Step 2: Login to get token (you need to replace with valid credentials)
    console.log('\n2️⃣  Logging in...');
    let token;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com', // Replace with valid test user
        password: 'password123',
      });
      token = loginResponse.data.access_token;
      console.log('✅ Login successful');
    } catch (error) {
      console.error(
        '❌ Login failed. Please update credentials in the script.',
      );
      console.error(
        '   Error:',
        error.response?.data?.message || error.message,
      );
      return;
    }

    // Step 3: Create a test post with an image
    console.log('\n3️⃣  Creating test post with image...');
    let postId;
    try {
      const createResponse = await axios.post(
        `${BASE_URL}/posts`,
        {
          title: 'NSFW Test Post',
          content: 'Testing NSFW detection',
          imageUrl: 'https://example.com/test-image.jpg', // Replace with actual image URL
          thumbnailUrl: 'https://example.com/test-image-thumb.jpg',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      postId = createResponse.data.id;
      console.log('✅ Post created successfully');
      console.log('   Post ID:', postId);
    } catch (error) {
      console.error('❌ Failed to create post');
      console.error(
        '   Error:',
        error.response?.data?.message || error.message,
      );
      return;
    }

    // Step 4: Wait for NSFW check to complete (it runs async)
    console.log('\n4️⃣  Waiting for NSFW check to complete...');
    console.log('   (NSFW check runs asynchronously in background)');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 5: Get the post and check isNSFW field
    console.log('\n5️⃣  Checking post for isNSFW field...');
    try {
      const getResponse = await axios.get(`${BASE_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const post = getResponse.data;
      console.log('\n📊 Post Details:');
      console.log('   Title:', post.title);
      console.log('   Image URL:', post.imageUrl);
      console.log('   isNSFW:', post.isNSFW);

      if (post.hasOwnProperty('isNSFW')) {
        console.log('\n✅ SUCCESS: isNSFW field is present in response');
        console.log(`   Value: ${post.isNSFW}`);
      } else {
        console.log('\n❌ FAILED: isNSFW field is missing from response');
      }
    } catch (error) {
      console.error('❌ Failed to get post');
      console.error(
        '   Error:',
        error.response?.data?.message || error.message,
      );
      return;
    }

    // Step 6: Check server logs for Vision API status
    console.log('\n6️⃣  Check server logs for these messages:');
    console.log(
      '   ✓ "[VisionService] Google Cloud Vision initialized successfully"',
    );
    console.log('   ✓ "[VisionService] Image <url> NSFW check: true/false"');
    console.log('   OR');
    console.log(
      '   ⚠ "[VisionService] Vision API disabled, skipping NSFW check"',
    );

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(
      '   - If Vision API is configured: isNSFW will be true/false based on image',
    );
    console.log(
      '   - If Vision API is NOT configured: isNSFW will default to false',
    );
    console.log(
      "   - Check database: SELECT id, title, is_nsfw FROM posts WHERE id = '" +
        postId +
        "';",
    );
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

// Check configuration
console.log('\n📋 Configuration Check:');
console.log('   1. Is GOOGLE_APPLICATION_CREDENTIALS set in .env.local?');
console.log('   2. Does the credentials file exist?');
console.log('   3. Is Google Cloud Vision API enabled in your GCP project?');
console.log('   4. Has the database migration for is_nsfw column been run?');

// Run test
testNSFWDetection()
  .then(() => {
    console.log('\n✅ Test completed\n');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
  });
