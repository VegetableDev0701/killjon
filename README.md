# NODO.ia - AI-Powered Assistant for Dominican Republic

A React Native mobile application that provides an AI-powered assistant for discovering products, services, and information across the Dominican Republic. Features smart search, chat functionality, listing management, Apple Sign-In and Google Sign-In authentication, and subscription-based premium features.

## 🛠 Requirements

### Prerequisites

- **macOS**: 13+ (Ventura)
- **Homebrew**: Package manager for macOS - `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### Node.js & Package Manager

- **Node.js**: 18+ ([Download](https://nodejs.org/))
- **Bun**: Latest version (recommended) - `curl -fsSL https://bun.sh/install | bash`
- **Yarn**: 1.22+ (alternative) - `npm install -g yarn`

### React Native CLI

- **React Native CLI**: `npm install -g react-native-cli`
- **Watchman**: `brew install watchman` (macOS)

### iOS Development

- **Xcode**: 15+ ([App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator**: 12.0+ (included with Xcode)

### Android Development

- **Android Studio**: Latest ([Download](https://developer.android.com/studio))
- **Java JDK**: 11 or 17 (bundled with Android Studio)
- **Android SDK**: API 21+ (Android 5.0+)
- **Android Emulator**: AVD with Google Play services

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/nodo.ia-app.git
   cd nodo.ia-app
   ```

2. **Install dependencies**

   ```bash
   # Using Bun (recommended)
   bun install

   # Alternative: Using Yarn
   yarn install
   ```

3. **Install iOS dependencies**

   ```bash
   cd ios && pod install && cd ..
   ```

4. **Set up environment variables**

   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit with your actual values
   nano .env
   ```

## ⚙️ Environment Variables

The app uses `react-native-config` for environment management. Create `.env`, `.env.staging`, and `.env.prod` files:

### Required Variables (.env)

```env
ENV=development
API_URL=https://api.dev.example.com
API_KEY=your-api-key-here
GOOGLE_MAP_API_KEY=your-google-maps-api-key
APP_DISPLAY_NAME=NODO.ia
APP_VERSION=1.0
IOS_APP_BUILD_NUMBER=1
ANDROID_APP_BUILD_NUMBER=1
IOS_APP_ID=1692947222
PACKAGE_NAME=com.nodoia.nodo
```

### Environment Notes

- **Local Development**: Use `ENV=development` with local/staging API
- **Staging**: Use `ENV=staging` with staging API endpoints
- **Production**: Use `ENV=production` with production API endpoints
- **GOOGLE_MAP_API_KEY**: Get from [Google Cloud Console](https://console.developers.google.com/apis/credentials)

## 🌐 Backend Connection

### API Base URL Configuration

The `baseURL` is defined in `src/utils/axiosClient.ts`:

```typescript
export const axiosClient = axios.create({
  baseURL: Config.API_URL, // From react-native-config
  timeout: 60000,
});
```

### GraphQL Endpoint

GraphQL queries use Apollo Client configured in `App.tsx`:

```typescript
const httpLink = createHttpLink({
  uri: Config.API_URL + "/graphql",
});
```

### Example API Request (React Query)

```typescript
// Example search request to /api/premium/categories
import { axiosClient } from "../utils/axiosClient";

const searchCategories = async (): Promise<Category[]> => {
  const { data } = await axiosClient.get("/api/premium/categories");
  if (!data.success) {
    throw new Error(data.message || "Search failed");
  }
  return data.data;
};

// Usage with React Query
const { data: categories, isLoading } = useQuery({
  queryKey: ["categories"],
  queryFn: searchCategories,
});
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Generic UI components (buttons, modals)
│   ├── chat/           # Chat-specific components
│   └── listing/        # Listing management components
├── screens/            # Screen components (main app pages)
├── navigation/         # React Navigation setup and types
├── store/              # Zustand state stores (auth, chat, listing, subscription)
├── services/           # API services and utilities
│   ├── axiosClient.ts  # HTTP client with auth interceptors
│   ├── listingsApi.ts  # Listings CRUD operations
│   └── iapService.ts   # In-app purchase management
├── graphql/            # GraphQL queries and fragments
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── i18n/               # Internationalization (Spanish/English)
├── types/              # TypeScript type definitions
└── assets/             # Images, fonts, static files
```

## 🏃‍♂️ Run Locally

### Start Metro Bundler

```bash
bun start
# or: npx react-native start
```

### iOS

```bash
# Development/Staging
bun run ios:staging

# Production
bun run ios:prod

# Alternative: Direct commands
npx react-native run-ios --scheme nodoiaStaging
npx react-native run-ios --scheme nodoia
```

### Android

```bash
# Development/Staging
bun run android:staging

# Production
bun run android:prod

# Alternative: Direct commands
ENVFILE=.env.staging npx react-native run-android
ENVFILE=.env.prod npx react-native run-android
```

### Clear Metro Cache (Common Fix)

```bash
npx react-native start --reset-cache
# or
bun start -- --reset-cache
```

## 📦 Build & Release

### iOS Production Build

**Bundle ID**: `com.nodoia.nodo` (production), `com.nodoia.nodo.staging` (staging)

**Required Capabilities**:

- Apple Sign-In
- Push Notifications
- Background App Refresh

**Build Steps**:

```bash
# Archive for App Store
cd ios
xcodebuild -workspace nodoia.xcworkspace -scheme nodoia -configuration Release archive -archivePath build/nodoia.xcarchive

# Alternative: Use Xcode GUI
# 1. Open nodoia.xcworkspace in Xcode
# 2. Product → Archive
# 3. Upload to App Store Connect via Organizer
```

**TestFlight Steps**:

1. Archive and upload to App Store Connect
2. Complete compliance questionnaire
3. Add internal/external testers
4. Submit for TestFlight review

### Android Production Build

**Package ID**: `com.nodoia` (production)

**Keystore Configuration**: Set in `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=***
MYAPP_UPLOAD_KEY_PASSWORD=***
```

**Build Steps**:

```bash
cd android

# Build APK for testing
./gradlew assembleRelease

# Build AAB for Play Store
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Play Console Steps**:

1. Upload AAB to Google Play Console
2. Complete store listing
3. Submit for review

## 🍎 Apple Sign-In Setup

### iOS Configuration

1. **Enable capability in Xcode**:
   - Project → Signing & Capabilities → + Capability → Sign In with Apple

2. **Configure App ID**:
   - [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)
   - Enable "Sign In with Apple" capability

3. **Reverse Client ID**: Add to iOS URL schemes (already configured):
   ```
   com.nodoia.nodo.signin
   ```

### Required Permissions

Already configured in `Info.plist`:

- No additional permissions needed for Apple Sign-In

## 💳 In-App Purchases (Subscriptions)

### Product IDs Configuration

Products are defined in `src/services/iapService.ts`:

```typescript
export const PRODUCT_IDS = {
  FEATURED_LISTING: "com.nodoia.nodo.featured.v1",
};

export const SUBSCRIPTION_IDS = {
  MONTHLY_SUBSCRIPTION: "com.nodoia.nodo.monthly",
  YEARLY_SUBSCRIPTION: "com.nodoia.nodo.yearly",
};
```

### Testing in Sandbox

1. **iOS**: Add Sandbox Apple ID in Settings → App Store → Sandbox Account
2. **Android**: Use Google Play Console test tracks
3. **Test Flow**: Launch app → Subscription screen → Purchase → Verify receipt

### App Store Connect Setup

1. Configure subscription products with exact IDs above
2. Set up subscription groups
3. Configure pricing and availability
4. Submit products for review before app submission

## 💾 Offline/Cache (MMKV)

### Storage Keys

Defined in `src/utils/storage.ts`:

```typescript
export const StorageKeys = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  CHAT_HISTORY: "chat_history",
  LANGUAGE: "language",
  ONBOARDING_COMPLETE: "onboarding_complete",
};
```

### Clear Cache for QA

```typescript
// Clear all app data
import { storage } from "./src/utils/storage";
storage.clearAll();

// Clear specific data
storage.remove(StorageKeys.AUTH_TOKEN);
storage.remove(StorageKeys.CHAT_HISTORY);
```

### Reset App State

```bash
# iOS Simulator
xcrun simctl erase all

# Android Emulator
adb shell pm clear com.nodoia
```

## 🌐 Internationalization (i18n)

### Language Files

- **Spanish (default)**: `src/i18n/translations/es.json`
- **English**: `src/i18n/translations/en.json`

### Add New Translation Key

```json
// src/i18n/translations/es.json
{
  "welcome": {
    "title": "Bienvenido a NODO.ia",
    "subtitle": "Tu asistente inteligente"
  }
}

// src/i18n/translations/en.json
{
  "welcome": {
    "title": "Welcome to NODO.ia",
    "subtitle": "Your intelligent assistant"
  }
}
```

### Usage in Components

```typescript
import { useTranslation } from "react-i18next";

const WelcomeScreen = () => {
  const { t } = useTranslation();
  return <Text>{t("welcome.title")}</Text>;
};
```

## 🔔 Push Notifications

The app uses Firebase Cloud Messaging (FCM) for push notifications.

### Configuration

- **Provider**: Firebase Cloud Messaging (FCM)
- **iOS**: APNs certificates configured in Firebase Console
- **Android**: google-services.json in android/app/

### Test Push Notification

```bash
# Using Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Create new notification
3. Target: Select your app
4. Send test message

# Using curl (FCM API)
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_FCM_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test message"
    }
  }'
```

## 📜 Available Scripts

| Script                 | Command                   | Description                        |
| ---------------------- | ------------------------- | ---------------------------------- |
| **Development**        | `bun start`               | Start Metro bundler                |
| **iOS Staging**        | `bun run ios:staging`     | Run iOS with staging config        |
| **iOS Production**     | `bun run ios:prod`        | Run iOS with production config     |
| **Android Staging**    | `bun run android:staging` | Run Android with staging config    |
| **Android Production** | `bun run android:prod`    | Run Android with production config |
| **Testing**            | `bun test`                | Run Jest tests                     |
| **Testing (Watch)**    | `bun test --watch`        | Run tests in watch mode            |
| **Testing (Coverage)** | `bun test --coverage`     | Run tests with coverage report     |
| **Linting**            | `bun run lint`            | Run ESLint                         |
| **Type Check**         | `bunx tsc --noEmit`       | TypeScript type checking           |

## 🔧 Troubleshooting

### 1. Metro/Build Issues

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear React Native cache
rm -rf node_modules && bun install

# Reset iOS build
cd ios && rm -rf build && xcodebuild clean && cd ..
```

### 2. iOS Pod Issues

```bash
# Clear and reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Update CocoaPods
sudo gem install cocoapods

# Pod install with repo update
cd ios && pod install --repo-update && cd ..
```

### 3. Android Gradle Issues

```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches

# Reset Android build
cd android && rm -rf app/build && cd ..
```

### 4. Code Signing (iOS)

```bash
# Verify certificates in Keychain
security find-identity -v -p codesigning

# Fix provisioning profiles
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*

# Re-download from Xcode → Preferences → Accounts
```

### 5. Environment Variables Not Loading

```bash
# Verify react-native-config
npx react-native-config

# Rebuild with new env vars
npx react-native run-ios --reset-cache
npx react-native run-android --reset-cache
```

## ✅ QA Smoke Test Checklist

### Quick Launch Test (5 minutes)

- [ ] **Launch**: App opens without crashing
- [ ] **Language**: Switch between Spanish/English in settings
- [ ] **Apple Sign-In**: Successfully sign in with Apple ID
- [ ] **Search**: Perform a search query and get results
- [ ] **Listing**: Open a listing detail page
- [ ] **IAP Sandbox**: Test subscription purchase (sandbox mode)
- [ ] **Push Notification**: Receive and display test notification
- [ ] **Offline**: Force-close app, reopen, verify data persistence
- [ ] **Map**: Verify location permission and map functionality
- [ ] **Voice**: Test voice input (microphone permission)

### Environment-Specific Tests

- [ ] **Staging**: Verify "STAGING" badge appears on screens
- [ ] **Production**: Verify no debug indicators visible
- [ ] **Environment**: Test API calls reach correct endpoints

## 🤝 Contributing

1. Fork the repository
2. Checkout to `staging` branch: `git checkout staging`
3. Create feature branch: `git checkout -b feature/amazing-feature`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push branch: `git push origin feature/amazing-feature`
6. Open Pull Request

---

**Need Help?**

- Create an issue in the GitHub repository
- Check React Native docs: https://reactnative.dev/docs/environment-setup
- Apple Sign-In guide: https://github.com/invertase/react-native-apple-authentication
- React Native IAP guide: https://github.com/dooboolab/react-native-iap
