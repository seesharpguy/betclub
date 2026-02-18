# Desktop Companion - Native Toast Notifications

A lightweight desktop app that connects to the Universal Notifier Docker service and shows **native OS toast notifications** on your desktop - just like Sonner!

## 🎯 Perfect For Teams

Your team just needs to:
1. Run `docker-compose up` (Universal Notifier service)
2. Run this companion app
3. Get instant toast notifications on their desktop!

No browser needed! Works on **Windows, macOS, and Linux**.

## ✨ Features

- 🔔 **Native OS notifications** - Uses your system's notification API
- 🔄 **Auto-reconnect** - Reconnects automatically if connection drops
- 🎨 **Beautiful toasts** - Shows user names, amounts, bet descriptions
- 🔊 **Sound alerts** - Customizable notification sounds
- 💻 **Cross-platform** - Windows, macOS, Linux
- 🪶 **Lightweight** - Runs in the background, minimal resources

## 🚀 Quick Start

### 1. Make sure Docker service is running

```bash
# In the universal-notifier directory
docker-compose up -d
```

### 2. Start the desktop companion

**macOS/Linux:**
```bash
cd desktop-companion
./start.sh
```

**Windows:**
```
cd desktop-companion
start.bat
```

Or manually:
```bash
npm install
npm start
```

That's it! You'll now get native toast notifications when bets are created or taken! 🎉

## 📋 For Teams

### Setup Once

Each team member needs to:

1. **Clone/pull the repo**
2. **Start the Docker service** (once per machine):
   ```bash
   cd universal-notifier
   docker-compose up -d
   ```

3. **Start the desktop companion**:
   ```bash
   cd desktop-companion
   ./start.sh  # or start.bat on Windows
   ```

### Run on Startup (Optional)

#### macOS (Launch Agent)

Create `~/Library/LaunchAgents/com.betting-notifier.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.betting-notifier</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/universal-notifier/desktop-companion/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/path/to/universal-notifier/desktop-companion</string>
    <key>StandardOutPath</key>
    <string>/tmp/betting-notifier.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/betting-notifier-error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.betting-notifier.plist
```

#### Windows (Startup Folder)

1. Press `Win+R`, type `shell:startup`, press Enter
2. Create a shortcut to `start.bat`
3. The companion will start when you log in

#### Linux (systemd)

Create `/etc/systemd/user/betting-notifier.service`:

```ini
[Unit]
Description=Betting Notifier Desktop Companion
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/universal-notifier/desktop-companion
ExecStart=/usr/bin/node index.js
Restart=always

[Install]
WantedBy=default.target
```

Enable:
```bash
systemctl --user enable betting-notifier
systemctl --user start betting-notifier
```

## ⚙️ Configuration

Edit `.env`:

```bash
# Service URL (default: http://localhost:5005)
NOTIFIER_URL=http://localhost:5005

# If Docker is on another machine:
# NOTIFIER_URL=http://192.168.1.100:5005

# Notification sound
NOTIFICATION_SOUND=Ping  # macOS: Glass, Hero, Ping, Pop, Purr, etc.

# How long notifications stay (seconds)
NOTIFICATION_TIMEOUT=10

# Debug mode
DEBUG=false
```

## 🔧 How It Works

```
┌─────────────────────────┐
│  Universal Notifier     │
│  (Docker Container)     │
│                         │
│  Port 5005              │
│  WebSocket Server       │
└────────────┬────────────┘
             │
             │ Socket.IO
             │ Real-time
             ▼
┌─────────────────────────┐
│  Desktop Companion      │
│  (Your Computer)        │
│                         │
│  ┌────────────────────┐ │
│  │ Socket.IO Client   │ │
│  └─────────┬──────────┘ │
│            │            │
│  ┌─────────▼──────────┐ │
│  │ node-notifier      │ │
│  │ (OS Native API)    │ │
│  └────────────────────┘ │
└─────────────────────────┘
             │
             ▼
    🔔 Toast Notification
    appears on your screen!
```

## 📱 Notification Examples

### macOS
Shows as a macOS notification banner with:
- Title: "🎲 New Bet Created!" or "🤝 Bet Accepted!"
- Subtitle: Creator name and amount
- Message: Bet description
- Sound: Your chosen sound

### Windows
Shows as a Windows 10/11 notification toast with:
- Title and details combined
- System notification sound
- Action Center integration

### Linux
Shows via libnotify (notify-send) with:
- Title and message
- Default desktop environment styling

## 🐛 Troubleshooting

### No notifications appearing

1. **Check the companion is running:**
   - You should see "Connected to notification service" in the terminal

2. **Check Docker service is running:**
   ```bash
   docker ps | grep betting-universal-notifier
   ```

3. **Test connection:**
   ```bash
   curl http://localhost:5005
   ```
   Should return the web dashboard HTML

4. **Check notification permissions:**
   - **macOS**: System Preferences → Notifications → Allow for "Script Editor" or "terminal-notifier"
   - **Windows**: Settings → Notifications & actions
   - **Linux**: Usually enabled by default

### Connection errors

- **"Failed to connect"**: Make sure Docker service is running
- **"ECONNREFUSED"**: Check the port in `.env` matches Docker (default: 5005)
- **Firewall blocking**: Allow port 5005 through your firewall

### Notifications work in web but not desktop companion

1. **Restart the companion app**
2. **Check logs** for errors
3. **Test manually:**
   ```bash
   node -e "require('node-notifier').notify({title: 'Test', message: 'Works!'})"
   ```

## 🎨 Customization

### Change notification duration

Edit `.env`:
```bash
NOTIFICATION_TIMEOUT=5  # 5 seconds
```

### Change sound

**macOS sounds:** Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink

**Windows:** Use `Notification.Default`, `Notification.IM`, `Notification.Mail`, etc.

```bash
NOTIFICATION_SOUND=Glass
```

### Custom icon (Advanced)

Modify `index.js` to add an icon path:
```javascript
notifier.notify({
  title: title,
  message: message,
  icon: path.join(__dirname, 'icon.png') // Add custom icon
});
```

## 📊 Monitoring

### View connection status
The companion shows:
- ✅ Connected / ❌ Disconnected
- 🔄 Reconnection attempts
- 📬 Each notification received
- 📊 Total notification count

### Stop the companion
Press `Ctrl+C` in the terminal

Shows:
- Total notifications received
- Graceful shutdown

## 🆚 vs Web Dashboard

| Feature | Desktop Companion | Web Dashboard |
|---------|------------------|---------------|
| **Notifications** | Native OS toasts | In-browser only |
| **Always visible** | Yes (even minimized) | Only when tab is open |
| **Sound** | System sounds | Browser sounds |
| **Auto-start** | Can configure | Must open manually |
| **Resource usage** | ~30MB RAM | Browser tab overhead |
| **Best for** | Individual developers | Quick overview/monitoring |

**Recommendation**: Use **both**!
- Desktop companion for day-to-day notifications
- Web dashboard to see history and statistics

## 🔒 Security

- ✅ Read-only connection to Docker service
- ✅ No credentials needed
- ✅ Local network only (by default)
- ⚠️ Don't expose port 5005 to the internet

## 💡 Tips

- **Multiple machines**: Change `NOTIFIER_URL` to point to the machine running Docker
- **Remote teams**: Use a VPN or secure tunnel to connect to the Docker service
- **Silent mode**: Set `NOTIFICATION_SOUND=` (empty) to disable sounds
- **Debug issues**: Set `DEBUG=true` to see detailed logs

## 📝 License

MIT

---

**Enjoy your native toast notifications!** 🎉🔔
