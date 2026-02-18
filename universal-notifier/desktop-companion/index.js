#!/usr/bin/env node

require('dotenv').config();
const io = require('socket.io-client');
const notifier = require('node-notifier');
const path = require('path');

const NOTIFIER_URL = process.env.NOTIFIER_URL || 'http://localhost:5005';
const NOTIFICATION_SOUND = process.env.NOTIFICATION_SOUND || 'Ping';
const NOTIFICATION_TIMEOUT = parseInt(process.env.NOTIFICATION_TIMEOUT || '10');
const DEBUG = process.env.DEBUG === 'true';

let isConnected = false;
let notificationCount = 0;

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (DEBUG && data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function showNotification(notification) {
  let title, message, subtitle;

  if (notification.type === 'bet_created') {
    title = '🎲 New Bet Created!';
    subtitle = `${notification.creatorName} • ${formatCurrency(notification.betAmount)}`;
    message = notification.betDescription;
  } else if (notification.type === 'bet_taken') {
    title = '🤝 Bet Accepted!';
    subtitle = `${notification.creatorName} vs ${notification.takerName || 'Unknown'}`;
    message = `${formatCurrency(notification.betAmount)} - ${notification.betDescription}`;
  } else {
    log(`Unknown notification type: ${notification.type}`);
    return;
  }

  notificationCount++;

  log(`📬 Showing notification #${notificationCount}: ${title}`);

  // Platform-specific notification
  if (process.platform === 'darwin') {
    // macOS
    notifier.notify({
      title: title,
      subtitle: subtitle,
      message: message,
      sound: NOTIFICATION_SOUND,
      timeout: NOTIFICATION_TIMEOUT,
      wait: false,
      appID: 'com.betting-app'
    });
  } else if (process.platform === 'win32') {
    // Windows
    notifier.notify({
      title: title,
      message: `${subtitle}\n${message}`,
      sound: true,
      time: NOTIFICATION_TIMEOUT * 1000,
      wait: false,
      appID: 'BettingApp'
    });
  } else {
    // Linux
    notifier.notify({
      title: title,
      message: `${subtitle}\n${message}`,
      sound: true,
      time: NOTIFICATION_TIMEOUT * 1000,
      wait: false
    });
  }
}

function connectToService() {
  log('🚀 Starting Betting Notifier Desktop Companion');
  log(`📡 Connecting to: ${NOTIFIER_URL}`);
  log('');

  const socket = io(NOTIFIER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    isConnected = true;
    log('✅ Connected to notification service');
    log('👀 Waiting for notifications...');
    log('');
    log('💡 Tip: Leave this running to receive notifications');
    log('   Press Ctrl+C to stop');
    log('');
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    log(`❌ Disconnected: ${reason}`);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    if (isConnected) {
      log(`⚠️ Connection error: ${error.message}`);
    } else {
      log(`❌ Failed to connect to ${NOTIFIER_URL}`);
      log('');
      log('Please make sure:');
      log('1. Docker service is running: docker-compose up -d');
      log('2. URL is correct in .env file');
      log('3. Port 3001 is accessible');
      log('');
      log('Retrying in 5 seconds...');
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    log(`✅ Reconnected after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    if (attemptNumber % 5 === 0) {
      log(`🔄 Reconnection attempt #${attemptNumber}...`);
    }
  });

  // Listen for notifications
  socket.on('notification', (notification) => {
    if (DEBUG) {
      log('Received notification:', notification);
    }
    showNotification(notification);
  });

  // Listen for recent notifications (on first connect)
  socket.on('recent', (notifications) => {
    if (notifications.length > 0) {
      log(`📋 Loaded ${notifications.length} recent notifications`);
      log('   (Not showing old notifications as toasts)');
      log('');
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('');
    log('👋 Shutting down gracefully...');
    log(`📊 Total notifications received: ${notificationCount}`);
    socket.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('');
    log('👋 Shutting down gracefully...');
    socket.disconnect();
    process.exit(0);
  });
}

// Start the companion
connectToService();
