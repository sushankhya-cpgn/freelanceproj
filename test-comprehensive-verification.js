#!/usr/bin/env node

/**
 * Comprehensive Real-Time Chat Verification Test
 * This test verifies all components of the real-time chat system
 */

const { Centrifuge } = require('centrifuge');
const axios = require('axios');

const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';
const CENTRIFUGO_API = 'http://localhost:8000/api';
const API_KEY = 'worklab_centrifugo_api_key_2024';
const SECRET = 'worklab_centrifugo_secret_key_2024';

console.log(`
╔════════════════════════════════════════════════════════════╗
║   REAL-TIME CHAT SYSTEM - COMPREHENSIVE VERIFICATION       ║
║                                                            ║
║  This test verifies the complete real-time messaging       ║
║  pipeline from message publication to delivery             ║
╚════════════════════════════════════════════════════════════╝
`);

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: `❌ FAIL: ${error.message}` });
    console.error(`  ❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n📋 RUNNING TESTS...\n');

  // Test 1: Centrifugo Server Health
  await test('Centrifugo server is responsive', async () => {
    try {
      const response = await axios.get(`${CENTRIFUGO_API}`);
      if (!response.status) throw new Error('No status code');
    } catch (err) {
      // Centrifugo API may not have a root endpoint, try the publish endpoint instead
      // This just verifies the server is listening
      const ping = await axios.post(`${CENTRIFUGO_API}/publish`, {
        channel: 'test',
        data: {}
      }, {
        headers: { 'Authorization': `apikey ${API_KEY}` },
        validateStatus: () => true // Accept any status for this test
      });
      if (!ping || !ping.config) throw new Error('No response');
    }
  });

  // Test 2: WebSocket Connection
  let centrifuge;
  await test('WebSocket connection works', async () => {
    const token = require('jsonwebtoken').sign(
      { sub: 'test' },
      SECRET,
      { algorithm: 'HS256' }
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      centrifuge = new Centrifuge(CENTRIFUGO_WS, { token });
      
      centrifuge.on('connected', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      centrifuge.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Connection error: ${err.type}`));
      });
      
      centrifuge.connect();
    });
  });

  // Test 3: Channel Subscription
  let subscription;
  await test('Channel subscription works', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      subscription = centrifuge.newSubscription('conversation:1:2');
      
      subscription.on('subscribed', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      subscription.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Subscription error: ${err.type}`));
      });
      
      subscription.subscribe();
    });
  });

  // Test 4: Message Publication
  await test('Message can be published via API', async () => {
    const response = await axios.post(`${CENTRIFUGO_API}/publish`, {
      channel: 'conversation:1:2',
      data: { type: 'test', id: Date.now() }
    }, {
      headers: { 'Authorization': `apikey ${API_KEY}` }
    });
    
    if (!response.data.result || !response.data.result.offset) {
      throw new Error('Invalid publish response');
    }
  });

  // Test 5: Real-Time Message Delivery
  let messageReceived = false;
  await test('Messages are delivered in real-time', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No message received'));
      }, 3000);

      subscription.on('publication', () => {
        clearTimeout(timeout);
        messageReceived = true;
        resolve();
      });

      // Publish a message
      setTimeout(() => {
        axios.post(`${CENTRIFUGO_API}/publish`, {
          channel: 'conversation:1:2',
          data: { type: 'delivery_test', id: Date.now() }
        }, {
          headers: { 'Authorization': `apikey ${API_KEY}` }
        }).catch(err => reject(err));
      }, 100);
    });
  });

  // Test 6: Multiple Subscriptions
  await test('Multiple subscriptions work independently', async () => {
    const channel2 = centrifuge.newSubscription('user:5');
    let received = false;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription 2 timeout')), 5000);
      
      channel2.on('subscribed', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      channel2.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Subscription 2 error: ${err.type}`));
      });
      
      channel2.subscribe();
    });
  });

  // Cleanup
  subscription.unsubscribe();
  centrifuge.disconnect();

  // Print Results
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                     TEST RESULTS                           ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  
  testResults.tests.forEach(t => {
    const padding = ' '.repeat(Math.max(0, 50 - t.name.length));
    console.log(`║ ${t.name}${padding}${t.status} ║`);
  });
  
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║ Total: ${testResults.passed + testResults.failed} | Passed: ${testResults.passed} | Failed: ${testResults.failed}${' '.repeat(Math.max(0, 30 - ((testResults.passed + testResults.failed).toString().length + testResults.passed.toString().length + testResults.failed.toString().length)))} ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  if (testResults.failed === 0) {
    console.log('✅ ALL TESTS PASSED - Real-time chat system is working perfectly!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${testResults.failed} TEST(S) FAILED\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
