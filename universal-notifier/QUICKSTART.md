# Quick Start - Universal Notifier

Get your team up and running with native toast notifications in 2 minutes!

## 🚀 For Your Whole Team

### Step 1: Start Docker (One Person)

```bash
cd universal-notifier
docker-compose up -d
```

This starts the notification service. If on a shared server, note the IP address.

### Step 2: Open Browser (Everyone)

**Local setup:**
```
http://localhost:5005
```

**Remote setup:**
```
http://192.168.1.100:5005  # Use the Docker host IP
```

### Step 3: Click "Allow"

When the browser asks for notification permission → Click **"Allow"**

## ✨ That's It!

You now get **native OS toast notifications** whenever:
- 🎲 Someone creates a bet
- 🤝 Someone takes a bet

The notifications appear as native system toasts (just like Sonner!) even when:
- Browser is minimized
- You're on a different tab
- Working in other apps

## 📱 What You'll See

**macOS:**
Native macOS notification banners

**Windows:**
Windows 10/11 notification toasts

**Linux:**
Native desktop notifications

All show:
- User name
- Bet amount
- Bet description
- User avatar (if available)

## 🎯 For Teams

### Everyone on Same Network

1. One person runs Docker
2. Everyone opens: `http://DOCKER-HOST-IP:5005`
3. Click "Allow" for notifications
4. Done!

### Remote Team (VPN/Tunnel)

1. Set up secure access to port 5005
2. Everyone opens the URL
3. Click "Allow"
4. Done!

## 🔧 Troubleshooting

### "Notifications blocked"

**Chrome/Edge:**
1. Click the 🔒 or ⓘ icon in address bar
2. Change "Notifications" to "Allow"
3. Refresh page

**Firefox:**
1. Click the 🔒 icon
2. Permissions → Notifications → Allow
3. Refresh page

**Safari:**
1. Safari menu → Settings → Websites → Notifications
2. Find localhost:5005 → Allow
3. Refresh page

### "Not receiving notifications"

1. **Check Docker is running:**
   ```bash
   docker ps | grep betting-universal-notifier
   ```

2. **Check you clicked "Allow":** Look for a banner at the top

3. **Test connection:** Dashboard should show "Live monitoring active"

4. **Create a test bet:** Notification should appear as OS toast!

### "Can't access from other machines"

1. **Get Docker host IP:**
   ```bash
   # macOS/Linux
   hostname -I | awk '{print $1}'

   # Windows
   ipconfig
   ```

2. **Check firewall:** Allow port 5005

3. **Test connection:**
   ```bash
   curl http://DOCKER-HOST-IP:5005
   ```

## 💡 Pro Tips

1. **Bookmark it:** Save `http://localhost:5005` for quick access
2. **Pin the tab:** Right-click tab → Pin Tab (stays open)
3. **Multiple monitors:** Notifications appear on primary screen
4. **Sound:** Most browsers play a notification sound
5. **Do Not Disturb:** System DND mode affects these notifications

## 🆚 Browser vs Desktop Companion

| Feature | Browser (Recommended) | Desktop Companion |
|---------|----------------------|-------------------|
| **Setup** | Open URL, click Allow | Install Node.js, run script |
| **Works from Docker** | ✅ Yes | ❌ No (needs local install) |
| **Cross-platform** | ✅ Any OS with browser | ✅ Windows/Mac/Linux |
| **Installation** | ✅ None needed | ⚠️ Requires Node.js |
| **Team friendly** | ✅ Just share URL | ⚠️ Each person installs |
| **Remote access** | ✅ Yes | ⚠️ Needs SSH/VPN |

**Recommendation:** Use the **browser method**! It's simpler and works for everyone.

## 🎨 Customize

Edit `.env` before starting Docker:

```bash
# Change web port
WEB_PORT=8080

# Enable additional channels
ENABLE_WEBHOOK=true
WEBHOOK_URL=https://hooks.slack.com/...
WEBHOOK_TYPE=slack
```

## 📊 What's Running

```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop service
docker-compose down
```

## 🎉 Success!

Your team now has:
- ✅ Native OS toast notifications
- ✅ Zero installation (just Docker + browser)
- ✅ Works on any OS
- ✅ Real-time updates
- ✅ Beautiful web dashboard

Create a bet and watch the magic happen! 🎲✨

---

**Need more?** See the full [README.md](README.md) for advanced features.
