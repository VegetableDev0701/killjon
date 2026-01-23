# Firebase Analytics - Quick Reference

## 🚀 Quick Setup for Testing

### iOS
```bash
# 1. Open Xcode
cd ios && open nodoia.xcworkspace

# 2. Edit Scheme (⌘ + <)
# 3. Run → Arguments → Add: -FIRDebugEnabled

# 4. Run app
bun run ios:staging
```

### Android
```bash
# 1. Enable debug mode
adb shell setprop debug.firebase.analytics.app com.nodoia.nodo.staging

# 2. Run app
bun run android:staging
```

### View Events
1. Open: https://console.firebase.google.com
2. Go to: Analytics → DebugView
3. Select your device from dropdown

---

## 📊 Events Reference

| Event | Trigger | Key Params |
|-------|---------|------------|
| `app_open` | App launch/foreground | user_id, timestamp |
| `user_session_start` | Session begins | user_id, timestamp |
| `user_session_end` | App background | user_id, timestamp, session_duration |
| `search_performed` | User searches | user_id, timestamp, search_term |
| `product_view` | Tap product card | user_id, timestamp, product_id |
| `merchant_profile_view` | View merchant profile | user_id, timestamp, merchant_id |
| `category_click` | Select category | user_id, timestamp, category_name |
| `merchant_product_upload` | Create listing | merchant_id, timestamp, product_id, total_products |
| `merchant_profile_update` | Update profile | merchant_id, timestamp |
| `merchant_dashboard_open` | Open admin screen | merchant_id, timestamp |

---

## 🧪 Testing Flow

1. ✓ Launch app → `app_open` + `user_session_start`
2. ✅ Login → user_id set
3. ✅ Search "car" → `search_performed`
4. ✅ Tap product → `product_view`
5. ✅ Open Admin (merchant) → `merchant_dashboard_open`
6. ✅ Select category → `category_click`
7. ✅ Create listing → `merchant_product_upload`
8. ✅ Update name → `merchant_profile_update`
9. ✓ Background app → `user_session_end`

---

## 📁 Key Files

```
src/services/firebaseAnalyticsService.ts    # All tracking functions
App.tsx                                     # App lifecycle
src/store/authStore.ts                      # Login/profile
src/store/chatStore.ts                      # Search
src/screens/AdminScreen.tsx                 # Dashboard
src/screens/ListingForm.tsx                 # Product upload
src/screens/SelectCategoryScreen.tsx        # Category
src/components/chat/ResultCard.tsx          # Product view
```

---

## 🐛 Quick Troubleshooting

### Events not appearing?
```bash
# Android - Verify debug mode
adb shell getprop debug.firebase.analytics.app

# Should output: com.nodoia.nodo.staging

# If not, re-enable:
adb shell setprop debug.firebase.analytics.app com.nodoia.nodo.staging
```

### iOS not working?
- Check Xcode scheme has `-FIRDebugEnabled`
- Verify GoogleService-Info.plist exists
- Clean build: `cd ios && rm -rf Pods && pod install`

### Still not working?
1. Check internet connection
2. Reinstall app
3. Wait 30 seconds for device to appear
4. Check console logs for Firebase errors

---

## 💡 Usage Examples

### Track custom event
```typescript
import { trackProductView } from '../services/firebaseAnalyticsService';

// In your component
if (userProfile?.id) {
  trackProductView(userProfile.id, productId);
}
```

### Track with merchant check
```typescript
import { trackMerchantDashboardOpen } from '../services/firebaseAnalyticsService';

if (userProfile?.id && userProfile.verifiedStatus === 'VERIFIED') {
  trackMerchantDashboardOpen(userProfile.id);
}
```

### Track guest users
```typescript
import { trackSearchPerformed } from '../services/firebaseAnalyticsService';

trackSearchPerformed('guest', searchQuery);
```

---

## 📖 Full Documentation

- **[FIREBASE_ANALYTICS_SUMMARY.md](./FIREBASE_ANALYTICS_SUMMARY.md)** - Implementation overview
- **[FIREBASE_ANALYTICS_EVENTS.md](./FIREBASE_ANALYTICS_EVENTS.md)** - Complete event catalog
- **[FIREBASE_ANALYTICS_DEBUG.md](./FIREBASE_ANALYTICS_DEBUG.md)** - Detailed testing guide

---

## ⚠️ Important Notes

### Production
- **NEVER** enable debug mode in production
- Remove `-FIRDebugEnabled` from release schemes
- Events processed within 24 hours (not real-time)

### Privacy
- No PII in event parameters
- User IDs anonymized by Firebase
- Search terms not linked to individuals

### Merchant Events
- Only fire for `verifiedStatus === 'VERIFIED'`
- Regular users won't trigger these

### Guest Users
- Tracked as `user_id='guest'` for searches
- Other events require authentication

---

**Last Updated:** 2025-11-17  
**Version:** @react-native-firebase/analytics@23.5.0
