# Team Setup Guide - Native Toast Notifications

Perfect setup for teams: Docker service + Desktop toast notifications (like Sonner)!

## 🎯 Goal

Your team runs **two simple commands** and gets native desktop toast notifications whenever bets are created or taken.

## 🚀 Setup (Once Per Team Member)

### Step 1: Start the Docker Service

```bash
cd universal-notifier
docker-compose up -d
```

This starts the notification service in Docker (runs in background).

### Step 2: Start Desktop Toast Companion

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

That's it! Now you'll get **native OS toast notifications** on your desktop! 🎉

## 📸 What You'll See

When a bet is created:
```
┌─────────────────────────────────┐
│ 🎲 New Bet Created!             │
│ John Doe • $25.00               │
│ Warriors win tonight            │
└─────────────────────────────────┘
```

When a bet is taken:
```
┌─────────────────────────────────┐
│ 🤝 Bet Accepted!                │
│ John vs Jane                    │
│ $25.00 - Warriors win tonight   │
└─────────────────────────────────┘
```

## 🔄 Daily Usage

### Morning Startup

```bash
# 1. Make sure Docker is running
docker-compose up -d

# 2. Start desktop companion
cd desktop-companion
./start.sh
```

Leave it running! You'll get notifications all day.

### Stopping

```bash
# Desktop companion: Press Ctrl+C

# Docker service (if needed):
docker-compose down
```

## 🎨 Customization

Edit `desktop-companion/.env`:

```bash
# Change notification sound
NOTIFICATION_SOUND=Glass  # macOS: Glass, Hero, Ping, Pop, Purr

# How long notifications stay
NOTIFICATION_TIMEOUT=10  # seconds

# Debug mode
DEBUG=false
```

## 🌐 Remote Setup (Optional)

If one team member runs Docker, others can connect remotely:

### On the Docker host machine:

1. Note your IP address:
   ```bash
   # macOS/Linux
   ipconfig getifaddr en0  # or ifconfig

   # Windows
   ipconfig
   ```

2. Make sure port 5005 is accessible (firewall rules)

### On other team members' machines:

Edit `desktop-companion/.env`:
```bash
NOTIFIER_URL=http://192.168.1.100:5005  # Use Docker host IP
```

Start the companion:
```bash
./start.sh
```

Everyone gets notifications! 🎊

## 🏃 Auto-Start on Login (Optional)

See [desktop-companion/README.md](desktop-companion/README.md) for:
- macOS: Launch Agents
- Windows: Startup folder
- Linux: systemd

## 💡 Pro Tips

1. **Keep companion running**: Leave it in the background, minimize the terminal
2. **Multiple monitors**: Notifications appear on your primary display
3. **Do Not Disturb**: System DND mode will suppress notifications
4. **Sound off**: Set `NOTIFICATION_SOUND=` (empty) for silent mode
5. **Test it**: Create a bet in the app and watch the toast appear!

## 🐛 Quick Troubleshooting

**No notifications?**
1. Check Docker is running: `docker ps | grep notifier`
2. Check companion is connected (terminal shows "Connected to notification service")
3. Check OS notification permissions

**Connection errors?**
1. Make sure Docker service started: `docker-compose logs`
2. Test: `curl http://localhost:5005` (should return HTML)
3. Check firewall isn't blocking port 5005

## 🆚 Why Not Just Use the Web Dashboard?

| Feature | Web Dashboard | Desktop Companion |
|---------|--------------|-------------------|
| Always visible | Only when tab open | ✅ Always (even minimized) |
| Native toasts | ❌ Browser only | ✅ OS-native |
| Auto-start | ❌ Must open | ✅ Can configure |
| Multitasking | ❌ Must keep tab | ✅ Works in background |
| Team-friendly | ⚠️ Each person opens | ✅ Auto-shows for everyone |

**Best practice**: Use the Desktop Companion for daily work, open the Web Dashboard when you want to see history/statistics.

## 📊 Architecture

```
┌─────────────────────────┐
│  Docker Container       │
│  (Universal Notifier)   │
│                         │
│  Runs on: Your machine  │
│  or team server         │
│  Port: 5005             │
└────────────┬────────────┘
             │
             │ WebSocket (Socket.IO)
             │ Real-time connection
             ▼
┌─────────────────────────┐
│  Desktop Companion      │
│  (Your Computer)        │
│                         │
│  Node.js script         │
│  Uses: node-notifier    │
└────────────┬────────────┘
             │
             ▼
    🔔 Native OS Toast
    (Like Sonner!)
```

## 🎉 You're All Set!

Your team now has:
- ✅ Cross-platform support (Windows/Mac/Linux)
- ✅ Native toast notifications
- ✅ Real-time updates
- ✅ Simple setup (2 commands)
- ✅ Professional notification experience

Happy betting! 🎲

---

**Need help?** See [desktop-companion/README.md](desktop-companion/README.md) for detailed docs.
