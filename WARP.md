# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NODO.ia is an AI-powered mobile assistant for the Dominican Republic built with React Native. The app provides intelligent conversations, smart search for vehicles/properties/products, voice input, and listing management capabilities.

**Key Technologies:**

- React Native 0.79.1 with TypeScript 5.0.4
- Apollo Client 3.13.8 for GraphQL API communication
- Zustand 5.0.5 for state management with MMKV persistence
- NativeWind 4.1.23 (Tailwind CSS for React Native)
- React Navigation 7.x for navigation
- React Query 5.84.1 for server state management

## Environment Management

The app uses `react-native-config` with three environments:

- **Development**: `.env` (ENV=example)
- **Staging**: `.env.staging` (ENV=staging)
- **Production**: `.env.prod` (ENV=production)

### Required Environment Variables

```
ENV=staging
API_URL=https://api.dev.example.com
API_KEY=dev-key-123
GOOGLE_MAP_API_KEY=dev-google-map-api-key
APP_DISPLAY_NAME=NODO.ia Staging
APP_VERSION=1.0
IOS_APP_BUILD_NUMBER=1
ANDROID_APP_BUILD_NUMBER=1
```

## Common Development Commands

### Start Development

```bash
# Start Metro bundler
bun start

# Install dependencies
bun install

# Install iOS dependencies
cd ios && pod install && cd ..
```

### Environment-Specific Builds

```bash
# Staging builds
bun run ios:staging     # iOS staging with scheme nodoiaStaging
bun run android:staging # Android staging

# Production builds
bun run ios:prod        # iOS production with scheme nodoia
bun run android:prod    # Android production
```

### Code Quality

```bash
# Linting
bun run lint            # Run ESLint
bun lint:fix            # Fix auto-fixable ESLint errors (if script exists)

# Testing
bun test                # Run Jest tests
bun test --watch        # Watch mode
bun test --coverage     # With coverage
```

### Production Builds

```bash
# iOS App Store build
cd ios
xcodebuild -workspace nodoia.xcworkspace -scheme nodoia -configuration Release archive -archivePath build/nodoia.xcarchive

# Android builds
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB for Play Store
```

## Architecture Overview

### Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Generic UI components
│   ├── chat/           # Chat-specific components
│   └── listing/        # Listing management components
├── screens/            # Screen components
├── navigation/         # React Navigation setup
├── store/              # Zustand state stores
├── services/           # API services and utilities
├── graphql/            # GraphQL queries and fragments
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── i18n/               # Internationalization (English/Spanish)
├── types/              # TypeScript type definitions
└── assets/             # Images, fonts, static files
```

### State Management Architecture

- **Zustand stores** for global state with MMKV persistence
- **Apollo Client** for GraphQL operations with aggressive no-cache policy
- **React Query** for additional server state management
- Key stores: `authStore`, `chatStore`, `listingStore`, `subscriptionStore`

### Navigation Architecture

- **React Navigation 7.x** with native stack navigator
- **Conditional navigation** based on auth state (`isLoggedIn`, `selectedCountry`, `mode`)
- **Two main modes**: Explorer mode (Chat screen) and Listing mode (Admin screen)
- **Screen groups**: Main screens, secondary screens, and modal screens

### GraphQL Integration

- **Apollo Client** with disabled caching for real-time data
- **Fragments** for Products, Vehicles, RealEstate, and Listings
- **Union types** handled with fragment spreads
- **No-cache fetch policy** to ensure fresh data

## Staging Environment Features

The staging environment includes special visual indicators:

- **STAGING label** appears on main screens when `ENV=staging`
- **Orange color** (`#ff6b35`) for high visibility
- **Separate bundle identifiers**:
  - iOS: `com.nodoia.nodo.staging` (vs `com.nodoia.nodo`)
  - Android: staging build variant
- **Different display names**: "NODO.ia Staging" vs "NODO.ia"

## Development Patterns

### Authentication Flow

1. Welcome screen → Apple/Google Sign-In
2. Country selection (stored in auth store)
3. Mode selection (Explorer vs Listing)
4. Main app screens

### State Persistence

- **MMKV** for fast, secure local storage
- **Zustand persistence middleware** for store hydration
- **Auth tokens** managed via axios interceptors with automatic refresh

### Styling Approach

- **NativeWind** (Tailwind CSS) for consistent styling
- **Custom theme colors**: primary (`#c1fe00`), background (`#1a2a0a`), foreground (`#F5f5f5`)
- **System fonts** with fallbacks for cross-platform consistency

### Internationalization

- **i18next** with React Native integration
- **Spanish default** with English fallback
- **Translations** stored in `src/i18n/translations/`

## Testing Strategy

- **Jest** as testing framework
- **React Test Renderer** for component testing
- Basic smoke test in `__tests__/App.test.tsx`
- Test individual screens and components in isolation

## Debugging Tools

### Reactotron Integration

- **Network monitoring** for API calls
- **State inspection** for Zustand stores
- **MMKV plugin** for storage debugging
- **Performance profiling** and log viewing

### Development Features

- **Fast Refresh** enabled
- **Flipper** integration available
- **Source maps** for debugging
- **Development menu** accessible via shake gesture

## Platform-Specific Considerations

### iOS Configuration

- **Multiple schemes**: `nodoia` (production), `nodoiaStaging` (staging)
- **CocoaPods** dependency management
- **Xcode 15+** required for builds

### Android Configuration

- **Build variants** for different environments
- **Gradle 8.x** build system
- **API level 21+** (Android 5.0+) minimum

## Package Manager

The project uses **Bun** as the primary package manager for faster installs and better performance. Use `bun install` instead of `npm install` for dependency management.

## Critical Dependencies

- **React Native Config** for environment variables
- **MMKV** for high-performance storage
- **Apple Authentication** and **Google Sign-In** for auth
- **React Native IAP** for in-app purchases
- **Linear Gradient** and **Reanimated** for UI effects
- **React Native Maps** for location features
