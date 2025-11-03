#!/usr/bin/env node

/**
 * End-to-End Chat Flow Test
 * Simulates sending a message via the API and receiving it via Centrifugo
 */

const axios = require('axios');
const { Centrifuge } = require('centrifuge');

const API_BASE = 'http://localhost:3000/api';
const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';

async function runE2ETest() {
  console.log('\n========================================');
  console.log('   END-TO-END CHAT FLOW TEST');
  console.log('========================================\n');

  try {
    // Step 1: Get token for sender (user 1)
    console.log('1️⃣ Getting token for sender (user 1)...');
    const tokenResp = await axios.post(`${API_BASE}/centrifugo/token`, {
      userId: '1'
    });
    const token = tokenResp.data.data.token;
    console.log('✅ Token received\n');

    // Step 2: Connect to Centrifugo
    console.log('2️⃣ Connecting to Centrifugo WebSocket...');
    const centrifuge = new Centrifuge(CENTRIFUGO_WS, { token });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      centrifuge.on('connected', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to Centrifugo\n');
        resolve();
      });
      centrifuge.on('error', reject);
      centrifuge.connect();
    });

    // Step 3: Subscribe to conversation channel (1 <-> 2)
    console.log('3️⃣ Subscribing to conversation channel 1:2...');
    const channel = 'conversation:1:2';
    const subscription = centrifuge.newSubscription(channel);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      subscription.on('subscribed', () => {
        clearTimeout(timeout);
        console.log('✅ Subscribed to channel\n');
        resolve();
      });
      subscription.on('error', reject);
      subscription.subscribe();
    });

    // Step 4: Set up message listener
    console.log('4️⃣ Setting up message listener...');
    let receivedMessage = null;
    const messageHandler = (ctx) => {
      console.log('✅ Received real-time message!');
      receivedMessage = ctx.data;
      console.log(`   Message content: ${ctx.data.content}`);
      console.log(`   From: User ${ctx.data.senderId} → User ${ctx.data.receiverId}\n`);
    };
    
    subscription.on('publication', messageHandler);
    console.log('✅ Listener ready\n');

    // Step 5: Send message via API
    console.log('5️⃣ Sending message via API...');
    const messageResp = await axios.post(
      `${API_BASE}/messages`,
      {
        receiverId: 2,
        content: `🚀 Test message sent at ${new Date().toLocaleTimeString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN || 'test-token'}`
        }
      }
    );
    
    console.log('✅ Message sent via API');
    console.log(`   Message ID: ${messageResp.data.data.id}`);
    console.log(`   Content: ${messageResp.data.data.content}\n`);

    // Step 6: Wait for real-time message
    console.log('6️⃣ Waiting for real-time message delivery...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        subscription.removeAllListeners('publication');
        reject(new Error('No real-time message received within 3 seconds'));
      }, 3000);
      
      const checkInterval = setInterval(() => {
        if (receivedMessage) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          subscription.removeAllListeners('publication');
          resolve();
        }
      }, 100);
    });

    // Cleanup
    console.log('7️⃣ Cleaning up...');
    subscription.unsubscribe();
    centrifuge.disconnect();
    console.log('✅ Disconnected\n');

    // Results
    console.log('========================================');
    console.log('   ✅ END-TO-END TEST PASSED!');
    console.log('   Message was successfully delivered');
    console.log('   via real-time Centrifugo channel');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    console.log('\n========================================\n');
    process.exit(1);
  }
}

runE2ETest();
