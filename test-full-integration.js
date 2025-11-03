#!/usr/bin/env node

/**
 * Full Integration Test
 * Tests backend message send endpoint with proper auth bypass for testing
 */

const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const axios = require('axios');
const { Centrifuge } = require('centrifuge');

const API_BASE = 'http://localhost:3000/api';
const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';

// Database connection
async function getDbConnection() {
  return mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'worklab'
  });
}

async function runFullTest() {
  console.log('\n========================================');
  console.log('   FULL INTEGRATION TEST');
  console.log('   (Message Send → Centrifugo Broadcast → Real-time Delivery)');
  console.log('========================================\n');

  let conn;
  try {
    // Connect to DB
    conn = await getDbConnection();
    
    // Check if a session exists for user 1
    console.log('1️⃣ Checking for valid session in database...');
    const [sessions] = await conn.query(
      'SELECT token FROM UserSessions WHERE userId = 1 AND isActive = true LIMIT 1'
    );
    
    let authToken;
    if (sessions.length > 0) {
      authToken = sessions[0].token;
      console.log('✅ Found existing session\n');
    } else {
      console.log('❌ No active session found for user 1');
      console.log('   Creating a test session...\n');
      
      // We need to create a valid session
      // For now, let's just skip the authenticated test
      throw new Error('No active session - Need proper test user setup');
    }

    // Get Centrifugo token
    console.log('2️⃣ Getting Centrifugo token...');
    const centrifugoResp = await axios.post(`${API_BASE}/centrifugo/token`, {
      userId: '1'
    });
    const centrifugoToken = centrifugoResp.data.data.token;
    console.log('✅ Token received\n');

    // Connect to Centrifugo
    console.log('3️⃣ Connecting to Centrifugo...');
    const centrifuge = new Centrifuge(CENTRIFUGO_WS, { token: centrifugoToken });
    
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

    // Subscribe to both channels
    console.log('4️⃣ Subscribing to channels...');
    
    // Subscribe to conversation channel
    const convChannel = 'conversation:1:2';
    const convSubscription = centrifuge.newSubscription(convChannel);
    
    let msgReceived = false;
    convSubscription.on('publication', (ctx) => {
      console.log('   ✅ Message received on conversation channel!');
      msgReceived = true;
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      convSubscription.on('subscribed', () => {
        clearTimeout(timeout);
        console.log(`✅ Subscribed to ${convChannel}`);
        resolve();
      });
      convSubscription.on('error', reject);
      convSubscription.subscribe();
    });
    
    // Subscribe to user notifications channel
    const userChannel = 'user:2'; // User 2 will receive notification
    const userSubscription = centrifuge.newSubscription(userChannel);
    
    let notifReceived = false;
    userSubscription.on('publication', (ctx) => {
      console.log('   ✅ Notification received on user channel!');
      notifReceived = true;
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      userSubscription.on('subscribed', () => {
        clearTimeout(timeout);
        console.log(`✅ Subscribed to ${userChannel}\n`);
        resolve();
      });
      userSubscription.on('error', reject);
      userSubscription.subscribe();
    });

    // Send message via API
    console.log('5️⃣ Sending message via API...');
    const msgResp = await axios.post(
      `${API_BASE}/messages`,
      {
        receiverId: 2,
        content: `🚀 Integration test at ${new Date().toLocaleTimeString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Message sent via API');
    console.log(`   ID: ${msgResp.data.data.id}`);
    console.log(`   Content: ${msgResp.data.data.content}\n`);

    // Wait for messages
    console.log('6️⃣ Waiting for real-time delivery...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const errors = [];
        if (!msgReceived) errors.push('No message on conversation channel');
        if (!notifReceived) errors.push('No notification on user channel');
        reject(new Error(`Delivery timeout: ${errors.join('; ')}`));
      }, 3000);
      
      const interval = setInterval(() => {
        if (msgReceived && notifReceived) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    console.log('✅ All messages delivered!\n');

    // Cleanup
    console.log('7️⃣ Cleaning up...');
    convSubscription.unsubscribe();
    userSubscription.unsubscribe();
    centrifuge.disconnect();
    await conn.end();
    console.log('✅ Done\n');

    console.log('========================================');
    console.log('   ✅ FULL INTEGRATION TEST PASSED!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    if (error.response?.data) {
      console.error('API Response:', error.response.data);
    }
    if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error('Note: Database access denied - check credentials');
    }
    console.log('========================================\n');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

runFullTest();
