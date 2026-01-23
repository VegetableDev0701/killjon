# Firebase Analytics DebugView Setup

This document explains how to enable Firebase Analytics DebugView for real-time event tracking verification during development.

## What is DebugView?

Firebase Analytics DebugView allows you to see events in real-time as they are being logged by your app during development. This is crucial for verifying that events are being tracked correctly before deploying to production.

## Prerequisites

- Firebase project configured with your app
- Access to Firebase Console
- Development device or simulator

## iOS Setup

### Method 1: Using Xcode Scheme Arguments (Recommended)

1. **Open your project in Xcode**
   ```bash
   cd ios
   open nodoia.xcworkspace  # or nodoiaStaging.xcworkspace for staging
   ```

2. **Edit the scheme**
   - Select your scheme (nodoia or nodoiaStaging) from the toolbar
   - Click: Product → Scheme → Edit Scheme...
   - Or press: `⌘ + <`

3. **Add debug argument**
   - Select "Run" from the left sidebar
   - Go to "Arguments" tab
   - Under "Arguments Passed On Launch", click the "+" button
   - Add: `-FIRDebugEnabled`
   
4. **Run the app**
   - The app will now send events to DebugView
   - Events should appear within seconds in Firebase Console

### Method 2: Using Terminal Command

For temporary debug mode without modifying Xcode schemes:

```bash
# Enable debug mode
adb shell setprop debug.firebase.analytics.app com.nodoia.nodo

# Disable debug mode when done
adb shell setprop debug.firebase.analytics.app .none.
```

### Disable Debug Mode

To disable DebugView for iOS:
- Remove the `-FIRDebugEnabled` argument from your Xcode scheme, OR
- Add `-FIRDebugDisabled` to explicitly disable it

## Android Setup

### Method 1: Using ADB Command (Recommended)

1. **Connect your Android device or start emulator**
   ```bash
   # Check connected devices
   adb devices
   ```

2. **Enable debug mode for your app**
   ```bash
   # For staging build
   adb shell setprop debug.firebase.analytics.app com.nodoia.nodo.staging
   
   # For production build
   adb shell setprop debug.firebase.analytics.app com.nodoia.nodo
   ```

3. **Verify the property is set**
   ```bash
   adb shell getprop debug.firebase.analytics.app
   ```
   Should output: `com.nodoia.nodo.staging` or `com.nodoia.nodo`

4. **Run your app**
   ```bash
   # For staging
   bun run android:staging
   
   # For production
   bun run android:prod
   ```

### Disable Debug Mode for Android

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

### Method 2: Using Android Studio

1. Open Android Studio
2. Go to Run → Edit Configurations
3. Select your app configuration
4. Under "Miscellaneous", add to "Launch Flags":
   ```
   --es debug_mode true
   ```

## Viewing Events in Firebase Console

1. **Open Firebase Console**
   - Navigate to: https://console.firebase.google.com
   - Select your project

2. **Go to DebugView**
   - Click "Analytics" in the left sidebar
   - Click "DebugView" tab
   
3. **Select your device**
   - Your device should appear in the device selector at the top
   - If not visible, ensure debug mode is properly enabled

4. **Monitor events**
   - Events will appear in real-time as they are logged
   - You can see event parameters by expanding each event
   - Events are color-coded for easy identification

## Testing the Implementation

### Quick Test Sequence

1. **Launch the app** → Should see `app_open` and `user_session_start`

2. **Login with a user account** → Should see user_id set

3. **Perform a search** → Should see `search_performed` with search_term parameter

4. **Tap on a product** → Should see `product_view` with product_id parameter

5. **Select a category** (when creating listing) → Should see `category_click` with category_name

6. **Create a listing** (as merchant) → Should see `merchant_product_upload` with product_id and total_products

7. **Open Admin/Dashboard** (as merchant) → Should see `merchant_dashboard_open`

8. **Update profile** (as merchant) → Should see `merchant_profile_update`

9. **Put app in background** → Should see `user_session_end` with session_duration

### Expected Events

| Event Name | Trigger Point | Key Parameters |
|-----------|---------------|----------------|
| `app_open` | App launch/foreground | user_id, timestamp |
| `user_session_start` | Session begins | user_id, timestamp |
| `user_session_end` | App goes to background | user_id, timestamp, session_duration |
| `search_performed` | User searches in chat | user_id, timestamp, search_term |
| `product_view` | User views product details | user_id, timestamp, product_id |
| `merchant_profile_view` | User views merchant profile | user_id, timestamp, merchant_id |
| `category_click` | User selects category | user_id, timestamp, category_name |
| `merchant_product_upload` | Merchant creates listing | merchant_id, timestamp, product_id, total_products |
| `merchant_profile_update` | Merchant updates profile | merchant_id, timestamp |
| `merchant_dashboard_open` | Merchant opens dashboard | merchant_id, timestamp |

## Troubleshooting

### Events not appearing in DebugView

1. **Verify debug mode is enabled**
   ```bash
   # iOS - Check Xcode scheme arguments
   # Android - Run:
   adb shell getprop debug.firebase.analytics.app
   ```

2. **Check internet connection**
   - Events require network connectivity
   - Try toggling WiFi/data

3. **Verify Firebase configuration**
   ```bash
   # iOS
   ls -la ios/GoogleService-Info.plist
   
   # Android
   ls -la android/app/google-services.json
   ```

4. **Check app bundle identifier matches Firebase project**
   - iOS: Check `Bundle Identifier` in Xcode
   - Android: Check `applicationId` in `android/app/build.gradle`

5. **Reinstall the app**
   ```bash
   # iOS
   bun run ios:staging
   
   # Android
   bun run android:staging
   ```

6. **Check console logs**
   - Look for Firebase Analytics initialization logs
   - Look for any error messages related to Firebase

### Device not showing in DebugView selector

1. **Wait a few seconds** - It may take 10-30 seconds for the device to appear
2. **Trigger an event** - Open/close the app to force event sending
3. **Verify debug mode** - Double-check the debug flag is properly set
4. **Check Firebase project** - Ensure you're looking at the correct project

### Events delayed or batched

- In production, events are batched and sent periodically
- DebugView should show events within seconds
- If seeing delays, verify you're in debug mode (not production mode)

## Production Notes

⚠️ **IMPORTANT:** Debug mode should NEVER be enabled in production builds!

- Remove `-FIRDebugEnabled` from release schemes
- Don't include debug ADB commands in CI/CD
- Debug mode increases battery usage and network traffic
- Events in production will be processed within 24 hours (not real-time)

## Additional Resources

- [Firebase Analytics DebugView Documentation](https://firebase.google.com/docs/analytics/debugview)
- [Firebase Analytics Events Documentation](https://firebase.google.com/docs/analytics/events)
- [React Native Firebase Analytics](https://rnfirebase.io/analytics/usage)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase Console for error messages
3. Check React Native Firebase documentation
4. Review app logs for Firebase-related errors
