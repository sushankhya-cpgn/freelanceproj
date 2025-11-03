#!/usr/bin/env node

/**
 * Real-time Messaging Test Script
 * Tests the full Centrifugo + WebSocket setup for real-time chat
 */

const axios = require('axios');
const { Centrifuge } = require('centrifuge');

const API_BASE = 'http://localhost:3000/api';
const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = {
    '✅': '✅',
    '❌': '❌',
    '🔧': '🔧',
    '📡': '📡',
    '🧪': '🧪'
  };
  console.log(`[${timestamp}] ${message}`);
}

async function test(name, fn) {
  try {
    log('🧪', `Testing: ${name}`);
    await fn();
    log('✅', `PASSED: ${name}`);
    testsPassed++;
  } catch (error) {
    log('❌', `FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Details:`, error.response?.data || error);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('   REAL-TIME MESSAGING TEST SUITE');
  console.log('========================================\n');

  // Test 1: Backend Health
  await test('Backend is running', async () => {
    const response = await axios.get('http://localhost:3000/health');
    if (response.data.status !== 'OK') throw new Error('Backend not healthy');
  });

  // Test 2: Centrifugo Token Generation
  let token;
  await test('Generate Centrifugo token', async () => {
    const response = await axios.post(`${API_BASE}/centrifugo/token`, {
      userId: '1',
      userInfo: { userId: '1' }
    });
    if (!response.data.data.token) throw new Error('No token received');
    token = response.data.data.token;
    log('📡', `Token generated: ${token.substring(0, 20)}...`);
  });

  // Test 3: WebSocket Connection
  let centrifuge;
  await test('Connect to Centrifugo WebSocket', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      
      try {
        centrifuge = new Centrifuge(CENTRIFUGO_WS, { token });
        
        centrifuge.on('connected', () => {
          clearTimeout(timeout);
          log('📡', 'WebSocket connected successfully');
          resolve();
        });
        
        centrifuge.on('error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`Connection error: ${err.type || 'unknown'}`));
        });
        
        centrifuge.connect();
      } catch (e) {
        clearTimeout(timeout);
        reject(e);
      }
    });
  });

  // Test 4: Subscribe to channel
  let subscription;
  await test('Subscribe to conversation channel', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      
      try {
        const channel = 'conversation:1:2';
        subscription = centrifuge.newSubscription(channel);
        
        subscription.on('subscribed', () => {
          clearTimeout(timeout);
          log('📡', `Subscribed to channel: ${channel}`);
          resolve();
        });
        
        subscription.on('error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`Subscription error: ${err.type || 'unknown'}`));
        });
        
        subscription.subscribe();
      } catch (e) {
        clearTimeout(timeout);
        reject(e);
      }
    });
  });

  // Test 5: Publish message via API
  let publishedMessage;
  await test('Publish message via Centrifugo API', async () => {
    publishedMessage = {
      type: 'test',
      data: {
        senderId: 1,
        receiverId: 2,
        content: `Test message at ${new Date().toISOString()}`,
        sentAt: new Date()
      }
    };
    
    const response = await axios.post(
      'http://localhost:8000/api/publish',
      {
        channel: 'conversation:1:2',
        data: publishedMessage
      },
      {
        headers: {
          'Authorization': 'apikey worklab_centrifugo_api_key_2024'
        }
      }
    );
    
    if (!response.data.result) throw new Error('No result from publish');
    log('📡', `Message published, offset: ${response.data.result.offset}`);
  });

  // Test 6: Receive published message
  await test('Receive message via WebSocket subscription', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No message received after 3s')), 3000);
      
      const handler = (ctx) => {
        clearTimeout(timeout);
        subscription.removeAllListeners('publication');
        log('📡', `Message received: ${JSON.stringify(ctx.data).substring(0, 50)}...`);
        resolve();
      };
      
      subscription.on('publication', handler);
    });
  });

  // Test 7: Unsubscribe
  await test('Unsubscribe from channel', async () => {
    subscription.unsubscribe();
    log('📡', 'Unsubscribed from channel');
  });

  // Test 8: Disconnect
  await test('Disconnect from Centrifugo', async () => {
    return new Promise((resolve) => {
      centrifuge.on('disconnected', () => {
        log('📡', 'Disconnected from Centrifugo');
        resolve();
      });
      centrifuge.disconnect();
    });
  });

  // Summary
  console.log('\n========================================');
  console.log(`   RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('========================================\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
