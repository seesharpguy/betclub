# Browser-Based Native Notifications

The **easiest way** to get native OS toast notifications - just open the browser!

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your Team Member's Computer                                │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Browser Tab: http://localhost:5005          │          │
│  │                                               │          │
│  │  Web Dashboard (minimized or background)     │          │
│  │  ↓                                            │          │
│  │  Web Notifications API                       │          │
│  │  ↓                                            │          │
│  │  Operating System Notification Center        │          │
│  └──────────────────────────────────────────────┘          │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────┐          │
│  │  🔔 Native OS Toast Notification             │          │
│  │                                               │          │
│  │  🎲 New Bet Created!                         │          │
│  │  John Doe • $25.00                           │          │
│  │  Warriors win tonight                        │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Key Benefits

### 1. **Works from Docker** ✅
- No need to install anything on the host
- Just run `docker-compose up -d`
- Team members just open a URL

### 2. **Zero Installation** ✅
- No Node.js needed
- No desktop companion
- Just a browser (everyone has one!)

### 3. **Cross-Platform** ✅
- macOS → Native macOS notifications
- Windows → Windows 10/11 toasts
- Linux → Desktop environment notifications
- Even works on **mobile browsers**!

### 4. **Team Friendly** ✅
- Share one URL: `http://192.168.1.100:5005`
- Everyone clicks "Allow"
- Everyone gets notifications

### 5. **Persistent** ✅
- Works when browser is minimized
- Works when on different tabs
- Only needs to keep tab open (can pin it!)

## 🚀 Setup Steps

### For Docker Host (One Person)

```bash
cd universal-notifier
docker-compose up -d
```

Note your IP address:
```bash
hostname -I  # Linux/macOS
ipconfig     # Windows
```

### For Everyone Else

1. Open browser
2. Go to `http://DOCKER-HOST-IP:5005`
3. Click "Allow" when asked for notifications
4. Done!

## 🔔 What Notifications Look Like

### macOS
```
┌───────────────────────────────┐
│ 🎲 New Bet Created!           │
│ John Doe • $25.00             │
│ Warriors win tonight          │
└───────────────────────────────┘
```

Appears as native macOS notification banner with:
- Sound alert
- User avatar (if available)
- Auto-dismisses after ~5 seconds
- Stays in Notification Center

### Windows 10/11
```
┌───────────────────────────────┐
│ 🎲 New Bet Created!           │
│                               │
│ John Doe • $25.00             │
│ Warriors win tonight          │
└───────────────────────────────┘
```

Appears as Windows toast notification with:
- Sound alert
- Stays in Action Center
- Can click to focus browser

### Linux (GNOME/KDE/etc.)
Uses your desktop environment's notification system.

### Mobile (iOS/Android)
Yes, it works on mobile browsers too!
- iOS Safari: Native iOS notifications
- Android Chrome: Native Android notifications

## 🎨 Technical Details

### Web Notifications API

The dashboard uses the standard [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API):

```javascript
// Request permission
await Notification.requestPermission();

// Show notification
new Notification('Title', {
  body: 'Message',
  icon: 'user-avatar.jpg',
  badge: 'app-icon.png',
  tag: 'unique-id', // Prevents duplicates
  requireInteraction: false, // Auto-close
  silent: false // Play sound
});
```

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | Best experience |
| Firefox | ✅ Full | Excellent |
| Safari | ✅ Full | macOS/iOS |
| Opera | ✅ Full | Chromium-based |
| Mobile browsers | ✅ Most | iOS Safari, Android Chrome |

### Permission Model

1. **First visit:** Browser asks for permission
2. **User clicks "Allow":** Saved for this domain
3. **Future visits:** No prompt needed, notifications just work

### Privacy & Security

- ✅ **User consent required:** Can't send notifications without permission
- ✅ **Per-domain:** Each domain needs separate permission
- ✅ **Revocable:** User can block anytime in browser settings
- ✅ **HTTPS recommended:** Most browsers require HTTPS (or localhost)

## ⚙️ Configuration

### Notification Duration

Currently set to 10 seconds. To customize, edit `public/index.html`:

```javascript
// Auto-close after 10 seconds
setTimeout(() => browserNotification.close(), 10000);
```

### Notification Sound

Browsers use system default notification sound. Can't customize per-notification (browser limitation).

### User Avatar

Automatically uses user's profile photo if available:

```javascript
icon: notification.creatorPhoto || undefined
```

## 🐛 Troubleshooting

### "Browser didn't ask for permission"

**Already blocked?** Check browser settings:

**Chrome/Edge:**
1. Click 🔒 in address bar
2. Site settings → Notifications → Allow

**Firefox:**
1. Click 🔒 in address bar
2. Permissions → Notifications → Allow

**Safari:**
1. Safari → Settings → Websites → Notifications
2. Add localhost:5005 → Allow

### "Notifications not appearing"

1. **Check permission was granted:** Look for banner on dashboard
2. **Check browser supports it:** Should work in Chrome/Firefox/Safari
3. **Check Do Not Disturb:** System DND mode blocks all notifications
4. **Test manually:** Open browser console and run:
   ```javascript
   new Notification('Test', {body: 'This is a test'})
   ```

### "Works on localhost but not remote"

**HTTPS Required!** Most browsers only allow notifications on:
- `localhost` / `127.0.0.1`
- HTTPS domains

**Solutions:**
- Use a reverse proxy with SSL (nginx + Let's Encrypt)
- Use ngrok or similar tunneling service
- Use mDNS/Bonjour names (macOS)

### "Browser tab needs to stay open?"

**Yes, but:**
- Can minimize browser
- Can switch to other tabs
- Can pin the tab (right-click → Pin Tab)
- Notifications still work in background!

Consider: Set the tab to auto-open on login

## 💡 Pro Tips

### 1. Pin the Tab
Right-click the tab → "Pin Tab"
- Takes minimal space
- Stays open
- Harder to accidentally close

### 2. Bookmark for Quick Access
- Bookmark: `http://localhost:5005`
- Add to bookmarks bar
- Name it "🎲 Bets"

### 3. Set as Homepage
Make it open automatically when browser starts!

### 4. Use Profiles
Chrome/Edge: Create a work profile that auto-opens this tab

### 5. Multiple Monitors
Notifications appear on the screen where browser is/was last active

### 6. Test First
After granting permission, create a test bet to verify it works!

## 🔒 Security Considerations

- **Local network only:** Don't expose port 5005 to the internet
- **HTTPS in production:** Use a reverse proxy with SSL
- **Firewall rules:** Only allow access from trusted IPs
- **No sensitive data:** Notification content is visible on screen

## 📊 Comparison

| Method | Browser Notifications | Desktop Companion |
|--------|----------------------|-------------------|
| **Installation** | ✅ None | ⚠️ Requires Node.js |
| **Works from Docker** | ✅ Yes | ❌ No |
| **Setup complexity** | ✅ Open URL, click Allow | ⚠️ npm install + run script |
| **Team deployment** | ✅ Share URL | ⚠️ Each person installs |
| **Remote access** | ✅ Just works | ⚠️ Needs port forwarding |
| **Mobile support** | ✅ Yes (iOS/Android) | ❌ No |
| **Resource usage** | ⚠️ Browser tab | ✅ ~30MB standalone |
| **Browser dependency** | ⚠️ Tab must stay open | ✅ No browser needed |

**Recommendation:**
- **For teams:** Use Browser Notifications (easiest)
- **For individuals who prefer:** Use Desktop Companion (optional)
- **Why not both?** Open dashboard to see history + use companion for guaranteed notifications

## 🎉 Conclusion

The browser-based approach is the **best solution** for most teams:
- Works entirely from Docker
- Zero installation required
- Cross-platform by default
- Easy team deployment
- Mobile-friendly bonus

Just `docker-compose up -d` + open browser + click "Allow" = Done! 🚀

---

**Questions?** See [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)
