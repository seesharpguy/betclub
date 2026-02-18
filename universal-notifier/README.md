# Universal Notification Service

Platform-agnostic notification service that works in pure Docker on **any OS** (Windows, macOS, Linux). Send notifications through multiple channels without any host dependencies!

## 🌟 Features

### ✨ Native Toast Notifications (Like Sonner!)
- **🔔 Browser-Based** - Just open the URL, click "Allow", get native OS toasts!
- **Works from Docker** - No installation needed, works on any platform
- **Team-Friendly** - Everyone just opens the same URL

### Always Included
- **🌐 Live Web Dashboard** - Beautiful real-time web interface
- **📊 Statistics** - Track bets created, bets taken, and total notifications
- **Real-time Updates** - Socket.IO for instant notification display

### Optional Channels (Enable what you need)
- **📢 Webhook** - Slack, Discord, Teams, or any webhook URL
- **📧 Email** - Send via SMTP to any email address
- **📱 Telegram** - Bot notifications to Telegram chat
- **🔗 Custom Webhook** - POST JSON to any API endpoint

## ⚡ Super Quick Start

**Just want it working now?** See [QUICKSTART.md](QUICKSTART.md)

## 🚀 Full Setup

### 1. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save as `serviceAccountKey.json` in the `universal-notifier/` directory

### 2. Configure Channels

```bash
cd universal-notifier
cp .env.example .env
```

Edit `.env` and enable the channels you want. **Web dashboard is always enabled!**

Example - just using the web dashboard (no config needed):
```bash
# Leave all ENABLE_* set to false
# Web dashboard will run on http://localhost:5005
```

Example - Slack notifications:
```bash
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
WEBHOOK_TYPE=slack
```

### 3. Start with Docker

```bash
docker-compose up -d
```

### 4. Get Notifications!

**🎉 Recommended: Browser Method (Works from Docker!)**

1. Visit **http://localhost:5005**
2. Click "Allow" when asked for notifications
3. Done! Get native OS toast notifications!

**Why this is perfect:**
- ✅ Works entirely from Docker
- ✅ Zero installation required
- ✅ Team just shares one URL
- ✅ Native OS toasts (just like Sonner!)
- ✅ Works on Windows/Mac/Linux/Mobile

**Notifications work even when:**
- Browser is minimized
- You're on a different tab
- Multiple tabs are open

See [BROWSER-NOTIFICATIONS.md](BROWSER-NOTIFICATIONS.md) for details.

**Optional: Desktop Companion** (if you don't want browser dependency)
```bash
cd desktop-companion
./start.sh  # Requires Node.js installed locally
```

## 📱 Channel Setup Guides

### Web Dashboard (Always Available)

No setup needed! Just start the service and open http://localhost:5005

Features:
- ✅ Real-time notifications
- ✅ Statistics dashboard
- ✅ Recent notifications history
- ✅ Shows active channels

### Webhook (Slack, Discord, Teams)

#### Slack
1. Go to your Slack workspace
2. Apps → Incoming Webhooks → Add to Slack
3. Choose channel → Add Incoming WebHooks Integration
4. Copy the Webhook URL

`.env`:
```bash
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
WEBHOOK_TYPE=slack
```

#### Discord
1. Open Discord server settings
2. Integrations → Webhooks → New Webhook
3. Choose channel, copy Webhook URL

`.env`:
```bash
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://discord.com/api/webhooks/...
WEBHOOK_TYPE=discord
```

#### Microsoft Teams
1. Open Teams channel → ⋯ → Connectors
2. Incoming Webhook → Configure
3. Name it, copy URL

`.env`:
```bash
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://your-tenant.webhook.office.com/...
WEBHOOK_TYPE=teams
```

### Email

Use any SMTP server (Gmail, Outlook, SendGrid, etc.)

#### Gmail Example:
1. Enable 2FA on your Google account
2. Create an App Password: Account → Security → 2-Step Verification → App passwords
3. Use the generated password

`.env`:
```bash
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Betting App <your-email@gmail.com>
EMAIL_TO=recipient@example.com
```

### Telegram

1. Create a bot via [@BotFather](https://t.me/botfather)
   - Send `/newbot`
   - Choose name and username
   - Copy the bot token

2. Get your chat ID:
   - Send a message to your bot
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Look for `"chat":{"id": 123456789}`

`.env`:
```bash
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Custom Webhook

Send JSON to any API endpoint:

`.env`:
```bash
ENABLE_CUSTOM_WEBHOOK=true
CUSTOM_WEBHOOK_URL=https://your-api.com/notifications
CUSTOM_WEBHOOK_HEADERS={"Authorization": "Bearer your-token"}
```

The notification object will be POSTed as JSON.

## 📋 Usage

### Start Service
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Service
```bash
docker-compose down
```

### Restart Service
```bash
docker-compose restart
```

### View Web Dashboard
```bash
open http://localhost:5005
# Or on Windows/Linux: xdg-open http://localhost:5005
```

### Change Web Port

Edit `.env`:
```bash
WEB_PORT=8080
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

## 🎯 How It Works

```
┌──────────────────┐
│  Firestore       │
│  notifications   │
│  collection      │
└────────┬─────────┘
         │
         │ Real-time listener
         ▼
┌──────────────────────────┐
│  Universal Notifier      │
│  (Docker Container)      │
│                          │
│  ┌────────────────────┐  │
│  │ Firebase Listener  │  │
│  └────────┬───────────┘  │
│           │              │
│  ┌────────┴───────────┐  │
│  │  Send to channels  │  │
│  │  ├─ Web Dashboard  │  │
│  │  ├─ Webhook        │  │
│  │  ├─ Email          │  │
│  │  ├─ Telegram       │  │
│  │  └─ Custom         │  │
│  └────────────────────┘  │
└──────────────────────────┘
         │
         ├──▶ 🌐 Web Dashboard (http://localhost:5005)
         ├──▶ 📢 Slack/Discord/Teams
         ├──▶ 📧 Email inbox
         ├──▶ 📱 Telegram app
         └──▶ 🔗 Your API
```

## 🔧 Advanced Configuration

### Enable Multiple Channels

You can enable as many channels as you want:

```bash
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://hooks.slack.com/...
WEBHOOK_TYPE=slack

ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
# ... email config

ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=...
# ... telegram config
```

All notifications will be sent to ALL enabled channels simultaneously!

### Debug Mode

See detailed logs:
```bash
DEBUG=true
```

### Run on Startup

#### Using systemd (Linux)

Create `/etc/systemd/system/betting-notifier.service`:
```ini
[Unit]
Description=Betting App Universal Notifier
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/universal-notifier
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable betting-notifier
sudo systemctl start betting-notifier
```

#### Using Docker restart policy (All platforms)

Already configured in `docker-compose.yml`:
```yaml
restart: unless-stopped
```

The container will auto-start on system boot!

## 🐛 Troubleshooting

### Web dashboard shows no notifications

1. **Check container is running:**
   ```bash
   docker ps | grep betting-universal-notifier
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Verify Firestore index is created:**
   - See main project README for index setup

4. **Test manually:**
   - Create a bet in your app
   - Check logs for "Processing notification"

### Notifications not sending to channel

1. **Check channel is enabled:**
   ```bash
   grep ENABLE_ .env
   ```

2. **Verify credentials:**
   - Test webhook URL with curl
   - Verify SMTP credentials
   - Test Telegram bot token

3. **Check logs for errors:**
   ```bash
   docker-compose logs | grep "Failed"
   ```

### Web dashboard won't load

1. **Check port is available:**
   ```bash
   lsof -i :5005  # macOS/Linux
   netstat -an | findstr 5005  # Windows
   ```

2. **Try different port:**
   Edit `.env`:
   ```bash
   WEB_PORT=8080
   ```

3. **Check firewall:**
   - Allow port 5005 (or your custom port)

### Container keeps restarting

1. **Check serviceAccountKey.json exists:**
   ```bash
   ls serviceAccountKey.json
   ```

2. **Check .env format:**
   - No spaces around `=`
   - Wrap values with spaces in quotes

3. **View startup logs:**
   ```bash
   docker-compose logs
   ```

## 📊 Monitoring

### View real-time stats
```bash
docker stats betting-universal-notifier
```

### Check channel status
Visit the web dashboard - it shows which channels are active!

### Export notification history

The web dashboard keeps the last 100 notifications in memory. To persist notifications, enable email or a custom webhook that saves to a database.

## 🔒 Security

- ⚠️ **Never commit** `.env` or `serviceAccountKey.json`
- 🔐 Use environment secrets in production
- 🌐 Expose web dashboard only on trusted networks
- 🔑 Use strong SMTP passwords
- 🔒 Limit webhook URL access

## 💡 Use Cases

- **Development**: Use web dashboard only
- **Team Slack/Discord**: Enable webhook for team channel
- **Personal**: Enable Telegram for mobile notifications
- **Stakeholder Updates**: Enable email for executives
- **Integration**: Use custom webhook to feed your own system

## 🆚 Platform Comparison

| Platform | macOS Notifier | Universal Notifier |
|----------|---------------|-------------------|
| **Works on** | macOS only | Any OS with Docker |
| **Channels** | macOS notifications | Web, Slack, Email, Telegram, etc. |
| **Setup** | Simpler | Slightly more config |
| **Remote Access** | No | Yes (web dashboard) |
| **Multiple Users** | No | Yes (web + channels) |

## 📝 License

MIT

---

**Pro Tip**: Start with just the web dashboard (no channel config needed), then enable additional channels as needed!
