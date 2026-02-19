# BetClub (not Fight Club)

An open source fun wagering dashboard and ledger system. No real money changes hands -- BetClub is designed for friendly workplace side bets and props to promote good team chemistry.

Create a prop bet on anything -- will the deploy break staging, who's buying coffee, whether the PM's "quick sync" stays under 15 minutes -- and track it all on a shared leaderboard.

## Features

- **Create & take bets** -- open-ended props with a dollar amount for bragging rights
- **Personal dashboard** -- win/loss record, net balance, and settlement ledger
- **Group leaderboard** -- rankings by wins, win rate, total wagered, and net earnings
- **Settle up** -- mark debts as paid between players (honor system, no real payments)
- **Rivalry tracking** -- see head-to-head records between any two people
- **Google sign-in** -- invite-only access managed by admins
- **Native notifications** -- macOS menu bar app alerts you when bets are created or taken

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, React 19, Tailwind CSS, Radix UI |
| Backend | Firebase (Firestore, Auth, Hosting) |
| Notifications | Flutter macOS app (menu bar), or Universal Notifier (Node.js) |

## Getting started (web app)

```bash
npm install
cp .env.example .env.local   # fill in your Firebase config
npm run dev
```

Requires a Firebase project with Firestore and Google Auth enabled. Deploy the security rules and indexes:

```bash
firebase deploy --only firestore
```

---

## Notification Service

A native macOS menu bar app that connects directly to Firestore and shows desktop notifications when bets are created or taken. No Docker, no browser tab -- just a menu bar icon.

### Install

1. Double-click `BetClubNotifier.pkg` and follow the prompts. This installs **BetClub Notifier.app** to `/Applications`.

2. Get the `serviceAccountKey.json` from another team member (or download it from the [Firebase console](https://console.firebase.google.com) under Project Settings > Service Accounts). Place it in your home directory:

   ```
   ~/serviceAccountKey.json
   ```

3. Open the app:

   ```bash
   open "/Applications/BetClub Notifier.app"
   ```

   If the key isn't found, a dialog will tell you where to put it with an option to retry.

4. The app runs in your **menu bar** (no Dock icon, no window). Click the icon to see status, toggle debug logging, view logs, or quit.

### Auto-start at login

```bash
cat > ~/Library/LaunchAgents/com.betclub.notifier.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.betclub.notifier</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/BetClub Notifier.app/Contents/MacOS/notification_service</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/com.betclub.notifier.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/com.betclub.notifier.stderr.log</string>
</dict>
</plist>
EOF
launchctl load ~/Library/LaunchAgents/com.betclub.notifier.plist
```

To stop auto-starting:

```bash
launchctl unload ~/Library/LaunchAgents/com.betclub.notifier.plist
rm ~/Library/LaunchAgents/com.betclub.notifier.plist
```

### Build from source

Requires Flutter and CocoaPods (`brew install cocoapods`).

```bash
cd notification_service
flutter pub get
flutter build macos --release

# Package as .pkg installer
rm -rf build/pkg_root
mkdir -p build/pkg_root/Applications
cp -R build/macos/Build/Products/Release/notification_service.app \
  "build/pkg_root/Applications/BetClub Notifier.app"

pkgbuild \
  --root build/pkg_root \
  --identifier com.betclub.notifier \
  --version 1.0.0 \
  --install-location / \
  build/BetClubNotifier.pkg
```

The resulting `.pkg` will be at `notification_service/build/BetClubNotifier.pkg`.

### How it works

- Polls Firestore every 10 seconds for unprocessed notifications
- Shows native macOS notifications for new bets
- Marks each notification as `processed: true` in Firestore
- On first launch, notifications older than 5 minutes are silently marked processed (no flood)
- Logs written to `~/Library/Logs/BetClubNotifier/notifier.log`

### Troubleshooting

**"Service Account Key Not Found" dialog** -- place `serviceAccountKey.json` in your home directory (`~/serviceAccountKey.json`) and click Try Again.

**No menu bar icon** -- check the logs:
```bash
cat ~/Library/Logs/BetClubNotifier/notifier.log
```

**macOS blocks the app** -- go to System Settings > Privacy & Security, scroll down, and click "Open Anyway" next to BetClub Notifier.

### Uninstall

```bash
# Kill the running app
pkill -f notification_service

# Remove the LaunchAgent
launchctl unload ~/Library/LaunchAgents/com.betclub.notifier.plist 2>/dev/null
rm ~/Library/LaunchAgents/com.betclub.notifier.plist 2>/dev/null

# Remove the app
sudo rm -rf "/Applications/BetClub Notifier.app"
```
