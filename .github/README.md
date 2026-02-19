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

A native macOS menu bar app that connects directly to Firestore and shows desktop notifications when bets are created or taken. Uses Google Sign-In with invitation-based authorization (same as the web app).

### Prerequisites

- Flutter SDK
- CocoaPods (`brew install cocoapods`)
- Apple Developer ID certificate (for code signing)
- Firebase project with Google Auth enabled

### First-time project setup

Run `flutterfire configure` in the `notification_service/` directory to generate platform-specific Firebase config files:

```bash
cd notification_service
flutterfire configure
```

This generates `lib/firebase_options.dart` and `macos/Runner/GoogleService-Info.plist`.

### Run locally

```bash
cd notification_service
flutter pub get
flutter run -d macos
```

### Build from source

```bash
cd notification_service
flutter pub get
flutter build macos --release

# Sign the app with your Developer ID certificate
codesign --force --verbose \
  --sign "Developer ID Application: <YOUR_NAME> (<TEAM_ID>)" \
  --deep --options runtime \
  "build/macos/Build/Products/Release/notification_service.app"
```

### Install

Copy the signed app to `/Applications`:

```bash
cp -R notification_service/build/macos/Build/Products/Release/notification_service.app \
  "/Applications/BetClub Notifier.app"
```

On first launch, a sign-in window appears. Sign in with a Google account that has been invited to BetClub. After authorization, the window hides and the app runs in the menu bar.

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

### How it works

- On launch, checks for an existing Firebase Auth session (auto-authenticates returning users)
- If no session, shows a sign-in window with Google Sign-In
- Checks the `invitations/{email}` collection to verify authorization
- Polls Firestore every 10 seconds for unprocessed notifications
- Shows native macOS notifications for new bets
- Marks each notification as `processed: true` in Firestore
- On first poll, notifications older than 5 minutes are silently marked processed (no flood)
- Menu bar shows user email, sign-out option, debug logging toggle, and quit

### Troubleshooting

**"Not Authorized" after sign-in** -- your Google account needs an invitation. Ask a BetClub admin to invite your email address.

**macOS blocks the app** -- go to System Settings > Privacy & Security, scroll down, and click "Open Anyway" next to BetClub Notifier.

**Logs** -- stdout/stderr are captured by launchd if using the LaunchAgent:
```bash
cat /tmp/com.betclub.notifier.stdout.log
```

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
