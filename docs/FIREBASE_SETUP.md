# Firebase Push Notifications Setup

## Overview

This guide covers the complete Firebase setup for push notifications in the NODO.ia app for both iOS and Android platforms with multiple environments (staging/production).

## Prerequisites

1. Firebase Console access (https://console.firebase.google.com)
2. Two Firebase projects (one for staging, one for production) OR one project with multiple apps
3. Xcode for iOS configuration
4. Android Studio for Android configuration

---

## 1. Firebase Console Setup

### Option A: Separate Firebase Projects (Recommended)

Create two separate Firebase projects:

- **nodo-ia-production**: for production environment
- **nodo-ia-staging**: for staging environment

### Option B: Single Project with Multiple Apps

Create one Firebase project with multiple apps registered:

- iOS Production App
- iOS Staging App
- Android Production App
- Android Staging App

---

## 2. iOS Configuration

### Step 1: Register iOS Apps in Firebase Console

#### For Production:

1. Go to Firebase Console → Project Settings
2. Click "Add app" → Select iOS
3. Enter bundle ID: `com.nodoia.nodo`
4. Download `GoogleService-Info.plist`
5. Rename it to `GoogleService-Info-Production.plist`

#### For Staging:

1. Click "Add app" → Select iOS
2. Enter bundle ID: `com.nodoia.nodo.staging`
3. Download `GoogleService-Info.plist`
4. Rename it to `GoogleService-Info-Staging.plist`

### Step 2: Add .plist Files to Xcode

1. Open `ios/nodoia.xcworkspace` in Xcode
2. Right-click on the `nodoia` folder in project navigator
3. Select "Add Files to nodoia..."
4. Add both `.plist` files
5. **IMPORTANT**: In the "Add to targets" dialog:
   - For `GoogleService-Info-Production.plist`: Check ONLY the `nodoia` target
   - For `GoogleService-Info-Staging.plist`: Check ONLY the `nodoiaStaging` target

### Step 3: Configure Build Phases (Copy Files)

For each target, add a "Copy Files" build phase to select the correct plist:

#### For `nodoia` target (Production):

1. Select `nodoia` target → Build Phases
2. Click "+" → New Run Script Phase
3. Add this script:

```bash
cp "${PROJECT_DIR}/nodoia/GoogleService-Info-Production.plist" "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
```

#### For `nodoiaStaging` target:

1. Select `nodoiaStaging` target → Build Phases
2. Click "+" → New Run Script Phase
3. Add this script:

```bash
cp "${PROJECT_DIR}/nodoia/GoogleService-Info-Staging.plist" "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
```

### Step 4: Enable Push Notifications Capability

For both targets:

1. Select target → Signing & Capabilities
2. Click "+ Capability"
3. Add "Push Notifications"
4. Add "Background Modes" and check:
   - Remote notifications
   - Background fetch

### Step 5: Configure APNs in Firebase Console

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Apple app configuration", upload your APNs Authentication Key or Certificate
3. For APNs Auth Key (recommended):
   - Go to Apple Developer Portal → Certificates, Identifiers & Profiles → Keys
   - Create a new key with "Apple Push Notifications service (APNs)" enabled
   - Download the `.p8` file
   - Upload to Firebase Console with Key ID and Team ID

### Step 6: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

---

## 3. Android Configuration

### Step 1: Register Android Apps in Firebase Console

#### For Production:

1. Go to Firebase Console → Project Settings
2. Click "Add app" → Select Android
3. Enter package name: `com.nodoia.nodo`
4. Download `google-services.json`
5. Save as `google-services-production.json`

#### For Staging:

1. Click "Add app" → Select Android
2. Enter package name: `com.nodoia.nodo.staging`
3. Download `google-services.json`
4. Save as `google-services-staging.json`

### Step 2: Configure Gradle for Multiple Environments

The app is already configured to use different `google-services.json` files based on build variants.

#### Place the files:

```
android/app/src/
├── prod/
│   └── google-services.json  (rename from google-services-production.json)
└── staging/
    └── google-services.json  (rename from google-services-staging.json)
```

Create the directories if they don't exist:

```bash
mkdir -p android/app/src/prod
mkdir -p android/app/src/staging

# Move the files
mv google-services-production.json android/app/src/prod/google-services.json
mv google-services-staging.json android/app/src/staging/google-services.json
```

### Step 3: Verify Gradle Configuration

The following should already be in place (already done in setup):

**android/build.gradle:**

```gradle
dependencies {
    classpath("com.google.gms:google-services:4.4.2")
}
```

**android/app/build.gradle:**

```gradle
apply plugin: "com.google.gms.google-services"
```

---

## 4. Testing Notifications

### Test on iOS Simulator (Limited)

iOS Simulator doesn't support push notifications. You MUST test on a physical device.

### Test on Android Emulator

Android emulator with Google Play Services can receive notifications.

### Test Scenarios

#### 1. Foreground Notification:

- App is open and active
- Notification appears as an alert dialog

#### 2. Background Notification:

- App is in background (home button pressed)
- Notification appears in notification tray
- Tapping opens the app

#### 3. Quit State Notification:

- App is completely closed (swiped away)
- Notification appears in notification tray
- Tapping launches the app

### Send Test Notification from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (check console logs when app starts)
6. Click "Test"

### Test Topics

The app automatically subscribes users to topics based on their profile:

- `all_users`: All registered users
- `merchants`: Users with verification badge or verified status
- `non_merchants`: Users without merchant status
- `country_[code]`: Users from specific country (e.g., `country_do`)
- `analytics_users`: Users with analytics access
- `status_[status]`: Users by status (e.g., `status_active`)

To test topic-based notifications:

1. Go to Firebase Console → Cloud Messaging
2. Create a new campaign
3. Select "Topic" as target
4. Enter one of the topics above
5. Send notification

---

## 5. Environment Variables

No additional environment variables are needed. Firebase SDK automatically reads the config files.

---

## 6. Notification Payload Structure

### Standard Notification (appears in tray):

```json
{
  "notification": {
    "title": "New Message",
    "body": "You have a new message from John"
  },
  "data": {
    "chatId": "123",
    "type": "chat"
  }
}
```

### Data-only Notification (silent, handled by app):

```json
{
  "data": {
    "chatId": "123",
    "type": "chat",
    "title": "New Message",
    "body": "You have a new message from John"
  }
}
```

---

## 7. Building for Production

### iOS:

```bash
# Production build
bun run ios:prod

# For App Store
cd ios
xcodebuild -workspace nodoia.xcworkspace -scheme nodoia -configuration Release archive
```

### Android:

```bash
# Production APK
cd android
./gradlew assembleProdRelease

# Production AAB (for Play Store)
./gradlew bundleProdRelease
```

---

## 8. Troubleshooting

### iOS Issues:

**"No GoogleService-Info.plist found"**

- Verify the .plist files are added to the correct targets
- Check the "Copy Files" build phase script is correct

**"APNs token not set"**

- Verify Push Notifications capability is enabled
- Check that APNs key is uploaded to Firebase Console
- Test on a physical device (Simulator doesn't support push)

**Build fails with Firebase errors**

- Run `cd ios && pod install && cd ..`
- Clean build folder in Xcode (Cmd+Shift+K)

### Android Issues:

**"google-services.json not found"**

- Verify files are in correct directories: `android/app/src/prod/` and `android/app/src/staging/`
- Check file names are exactly `google-services.json`

**"Firebase not initialized"**

- Verify `apply plugin: "com.google.gms.google-services"` is in app/build.gradle
- Clean and rebuild: `cd android && ./gradlew clean && cd ..`

**Notifications not received on Android 13+**

- POST_NOTIFICATIONS permission is required
- The app automatically requests it, but user must grant it

### Permission Issues:

**Permission denied on iOS**

- User must grant permission in Settings → Notifications
- Re-request by calling `NotificationService.requestPermission()`

**Permission denied on Android**

- User must grant permission in Settings
- On Android 13+, permission is required

---

## 9. Backend Integration (Optional)

To send targeted notifications to specific users:

1. Store FCM tokens in your backend when users log in
2. Use Firebase Admin SDK to send notifications:

```javascript
// Node.js example
const admin = require("firebase-admin");

// Send to specific token
await admin.messaging().send({
  token: userFCMToken,
  notification: {
    title: "Hello",
    body: "Message for you",
  },
  data: {
    customData: "value",
  },
});

// Send to topic
await admin.messaging().send({
  topic: "merchants",
  notification: {
    title: "Merchant Update",
    body: "New features available",
  },
});
```

---

## 10. Next Steps

1. ✅ Install dependencies (`bun add @react-native-firebase/app @react-native-firebase/messaging`)
2. ⏳ Configure Firebase Console (create projects/apps)
3. ⏳ Download and add GoogleService-Info.plist files for iOS
4. ⏳ Download and add google-services.json files for Android
5. ⏳ Run `cd ios && pod install && cd ..`
6. ⏳ Test on physical devices
7. ⏳ Configure APNs certificates in Firebase Console
8. ⏳ Send test notifications

---

## Support

For issues with Firebase setup:

- Firebase Documentation: https://firebase.google.com/docs/cloud-messaging
- React Native Firebase: https://rnfirebase.io/messaging/usage
- APNs Setup: https://developer.apple.com/documentation/usernotifications
