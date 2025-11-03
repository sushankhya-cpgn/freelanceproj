#!/usr/bin/env node

/**
 * Test: Simulate Backend Message Broadcasting
 * This test simulates what the backend does when sending a message:
 * 1. Call the Centrifugo API to publish to conversation channel
 * 2. Subscribe on frontend and verify receipt
 */

const axios = require('axios');
const { Centrifuge } = require('centrifuge');

const CENTRIFUGO_API = 'http://localhost:8000/api';
const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';
const CENTRIFUGO_API_KEY = 'worklab_centrifugo_api_key_2024';
const CENTRIFUGO_SECRET = 'worklab_centrifugo_secret_key_2024';

async function simulateBackendMessageFlow() {
  console.log('\n========================================');
  console.log('   BACKEND MESSAGE BROADCAST TEST');
  console.log('========================================\n');

  try {
    // Step 1: Get token for frontend
    console.log('1️⃣ Generating Centrifugo token for frontend client...');
    const token = require('jsonwebtoken').sign(
      { sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 },
      CENTRIFUGO_SECRET,
      { algorithm: 'HS256' }
    );
    console.log(`✅ Token: ${token.substring(0, 30)}...\n`);

    // Step 2: Connect frontend client
    console.log('2️⃣ Frontend connects to Centrifugo...');
    const centrifuge = new Centrifuge(CENTRIFUGO_WS, { token });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      centrifuge.on('connected', () => {
        clearTimeout(timeout);
        console.log('✅ Connected\n');
        resolve();
      });
      centrifuge.on('error', reject);
      centrifuge.connect();
    });

    // Step 3: Frontend subscribes to conversation channel
    console.log('3️⃣ Frontend subscribes to conversation:1:2...');
    const channel = 'conversation:1:2';
    const subscription = centrifuge.newSubscription(channel);
    
    let messageReceived = false;
    let receivedData = null;
    
    subscription.on('publication', (ctx) => {
      console.log('   ✅ MESSAGE RECEIVED!');
      messageReceived = true;
      receivedData = ctx.data;
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      subscription.on('subscribed', () => {
        clearTimeout(timeout);
        console.log('✅ Subscribed\n');
        resolve();
      });
      subscription.on('error', reject);
      subscription.subscribe();
    });

    // Step 4: Backend publishes message
    console.log('4️⃣ Backend publishes message via Centrifugo API...');
    const testMessage = {
      id: Date.now(),
      senderId: 1,
      receiverId: 2,
      content: `Test message at ${new Date().toLocaleTimeString()}`,
      messageType: 'text',
      attachments: null,
      sentAt: new Date().toISOString(),
      sender: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe'
      }
    };
    
    const publishResp = await axios.post(
      `${CENTRIFUGO_API}/publish`,
      {
        channel: channel,
        data: testMessage
      },
      {
        headers: {
          'Authorization': `apikey ${CENTRIFUGO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Message published');
    console.log(`   Offset: ${publishResp.data.result.offset}`);
    console.log(`   Content: ${testMessage.content}\n`);

    // Step 5: Wait for message delivery
    console.log('5️⃣ Waiting for real-time message delivery...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No message received within 2 seconds'));
      }, 2000);
      
      const interval = setInterval(() => {
        if (messageReceived) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    console.log(`   ✅ Message delivered!`);
    console.log(`   Received data: ${JSON.stringify(receivedData).substring(0, 100)}...\n`);

    // Cleanup
    console.log('6️⃣ Cleaning up...');
    subscription.unsubscribe();
    centrifuge.disconnect();
    console.log('✅ Disconnected\n');

    console.log('========================================');
    console.log('   ✅ TEST PASSED!');
    console.log('   Backend message broadcasting works!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    console.log('========================================\n');
    process.exit(1);
  }
}

simulateBackendMessageFlow();
