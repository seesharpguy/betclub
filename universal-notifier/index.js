require('dotenv').config();
const admin = require('firebase-admin');
const axios = require('axios');
const nodemailer = require('nodemailer');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const DEBUG = process.env.DEBUG === 'true';

// Web server for dashboard
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const WEB_PORT = process.env.WEB_PORT || 5005;

// Store recent notifications in memory
const recentNotifications = [];
const MAX_RECENT = 100;

// Log function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (DEBUG && data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Format currency
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

// === NOTIFICATION CHANNELS ===

// 1. Webhook (Slack, Discord, Teams)
async function sendWebhook(notification) {
  if (process.env.ENABLE_WEBHOOK !== 'true') return;

  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookType = process.env.WEBHOOK_TYPE || 'slack';

  let payload;

  if (webhookType === 'slack') {
    payload = {
      text: notification.type === 'bet_created'
        ? `🎲 *New Bet Created!*\n*${notification.creatorName}* • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
        : `🤝 *Bet Accepted!*\n*${notification.creatorName}* vs *${notification.takerName}* • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
    };
  } else if (webhookType === 'discord') {
    payload = {
      content: notification.type === 'bet_created'
        ? `🎲 **New Bet Created!**\n**${notification.creatorName}** • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
        : `🤝 **Bet Accepted!**\n**${notification.creatorName}** vs **${notification.takerName}** • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
    };
  } else if (webhookType === 'teams') {
    payload = {
      text: notification.type === 'bet_created'
        ? `🎲 New Bet Created!\n${notification.creatorName} • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
        : `🤝 Bet Accepted!\n${notification.creatorName} vs ${notification.takerName} • ${formatCurrency(notification.betAmount)}\n${notification.betDescription}`
    };
  } else {
    payload = notification; // Generic JSON
  }

  try {
    await axios.post(webhookUrl, payload);
    log(`✅ Sent to ${webhookType} webhook`);
  } catch (error) {
    log(`❌ Failed to send to webhook: ${error.message}`);
  }
}

// 2. Email
let emailTransporter;
if (process.env.ENABLE_EMAIL === 'true') {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail(notification) {
  if (process.env.ENABLE_EMAIL !== 'true' || !emailTransporter) return;

  const subject = notification.type === 'bet_created'
    ? `🎲 New Bet: ${notification.creatorName} - ${formatCurrency(notification.betAmount)}`
    : `🤝 Bet Accepted: ${notification.creatorName} vs ${notification.takerName}`;

  const html = notification.type === 'bet_created'
    ? `
      <h2>🎲 New Bet Created!</h2>
      <p><strong>Creator:</strong> ${notification.creatorName}</p>
      <p><strong>Amount:</strong> ${formatCurrency(notification.betAmount)}</p>
      <p><strong>Description:</strong> ${notification.betDescription}</p>
      <p style="color: #666;">Waiting for someone to take this bet...</p>
    `
    : `
      <h2>🤝 Bet Accepted!</h2>
      <p><strong>Creator:</strong> ${notification.creatorName}</p>
      <p><strong>Taker:</strong> ${notification.takerName || 'Unknown'}</p>
      <p><strong>Amount:</strong> ${formatCurrency(notification.betAmount)}</p>
      <p><strong>Description:</strong> ${notification.betDescription}</p>
      <p style="color: #666;">The bet is on! 🔥</p>
    `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject,
      html
    });
    log('✅ Sent email notification');
  } catch (error) {
    log(`❌ Failed to send email: ${error.message}`);
  }
}

// 3. Telegram
async function sendTelegram(notification) {
  if (process.env.ENABLE_TELEGRAM !== 'true') return;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const message = notification.type === 'bet_created'
    ? `🎲 *New Bet Created!*\n\n*Creator:* ${notification.creatorName}\n*Amount:* ${formatCurrency(notification.betAmount)}\n\n${notification.betDescription}`
    : `🤝 *Bet Accepted!*\n\n*Creator:* ${notification.creatorName}\n*Taker:* ${notification.takerName || 'Unknown'}\n*Amount:* ${formatCurrency(notification.betAmount)}\n\n${notification.betDescription}`;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    log('✅ Sent Telegram notification');
  } catch (error) {
    log(`❌ Failed to send Telegram: ${error.message}`);
  }
}

// 4. Custom Webhook
async function sendCustomWebhook(notification) {
  if (process.env.ENABLE_CUSTOM_WEBHOOK !== 'true') return;

  const url = process.env.CUSTOM_WEBHOOK_URL;
  const headers = process.env.CUSTOM_WEBHOOK_HEADERS
    ? JSON.parse(process.env.CUSTOM_WEBHOOK_HEADERS)
    : {};

  try {
    await axios.post(url, notification, { headers });
    log('✅ Sent to custom webhook');
  } catch (error) {
    log(`❌ Failed to send to custom webhook: ${error.message}`);
  }
}

// 5. Web Dashboard (Socket.IO)
function sendToWebDashboard(notification) {
  io.emit('notification', notification);

  // Add to recent notifications
  recentNotifications.unshift({
    ...notification,
    receivedAt: new Date().toISOString()
  });

  if (recentNotifications.length > MAX_RECENT) {
    recentNotifications.pop();
  }
}

// Main notification handler
async function handleNotification(notification) {
  log(`📬 Processing notification: ${notification.type} (ID: ${notification.id})`);

  // Send to all enabled channels in parallel
  await Promise.all([
    sendWebhook(notification),
    sendEmail(notification),
    sendTelegram(notification),
    sendCustomWebhook(notification)
  ]);

  // Always send to web dashboard
  sendToWebDashboard(notification);

  // Mark as processed
  try {
    await db.collection('notifications').doc(notification.id).update({
      processed: true
    });
    log(`✅ Marked notification ${notification.id} as processed`);
  } catch (error) {
    log(`❌ Failed to mark as processed: ${error.message}`);
  }
}

// Web server routes
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/notifications', (req, res) => {
  res.json(recentNotifications);
});

app.get('/api/config', (req, res) => {
  res.json({
    channels: {
      webhook: process.env.ENABLE_WEBHOOK === 'true',
      email: process.env.ENABLE_EMAIL === 'true',
      telegram: process.env.ENABLE_TELEGRAM === 'true',
      customWebhook: process.env.ENABLE_CUSTOM_WEBHOOK === 'true',
      webDashboard: true
    },
    webhookType: process.env.WEBHOOK_TYPE || 'none'
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  log(`👤 Web dashboard connected: ${socket.id}`);

  // Send recent notifications to newly connected client
  socket.emit('recent', recentNotifications);

  socket.on('disconnect', () => {
    log(`👋 Web dashboard disconnected: ${socket.id}`);
  });
});

// Start Firestore listener
function startListener() {
  log('Starting Universal Notification Service...');
  log(`Service account: ${serviceAccount.project_id || 'Unknown'}`);
  log(`Web dashboard: http://localhost:${WEB_PORT}`);
  log('');
  log('Enabled channels:');
  log(`  • Web Dashboard: ✅ (always on)`);
  log(`  • Webhook: ${process.env.ENABLE_WEBHOOK === 'true' ? '✅' : '❌'} ${process.env.WEBHOOK_TYPE || ''}`);
  log(`  • Email: ${process.env.ENABLE_EMAIL === 'true' ? '✅' : '❌'}`);
  log(`  • Telegram: ${process.env.ENABLE_TELEGRAM === 'true' ? '✅' : '❌'}`);
  log(`  • Custom Webhook: ${process.env.ENABLE_CUSTOM_WEBHOOK === 'true' ? '✅' : '❌'}`);
  log('');

  const query = db.collection('notifications')
    .where('processed', '==', false)
    .orderBy('createdAt', 'asc');

  const unsubscribe = query.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const notification = {
          id: change.doc.id,
          ...change.doc.data()
        };
        handleNotification(notification);
      }
    });
  }, error => {
    log('Error listening to notifications:', error.message);
  });

  log('✅ Listener started successfully. Waiting for notifications...');

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down gracefully...');
    unsubscribe();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Shutting down gracefully...');
    unsubscribe();
    server.close();
    process.exit(0);
  });
}

// Start web server
server.listen(WEB_PORT, () => {
  log(`🌐 Web dashboard running on http://localhost:${WEB_PORT}`);
  startListener();
});
