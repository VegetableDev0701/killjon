# Firebase Analytics Events Documentation

This document provides a comprehensive overview of all Firebase Analytics events implemented in the NODO.ia app, including where they are triggered and what parameters they track.

## Table of Contents

- [Overview](#overview)
- [User Events](#user-events)
- [Merchant Events](#merchant-events)
- [Implementation Files](#implementation-files)
- [Testing Guide](#testing-guide)

## Overview

The app tracks user behavior and merchant actions to provide insights into:
- User engagement and activity patterns
- Search behavior and product discovery
- Merchant performance and listing management
- App usage patterns and session metrics

All analytics logic is centralized in `src/services/firebaseAnalyticsService.ts` for maintainability and type safety.

## User Events

### 1. app_open

**Description:** Tracks when the app is opened or brought to the foreground.

**When Triggered:**
- App is launched
- App returns from background to foreground

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp of the event

**Implementation Location:**
- **File:** `App.tsx`
- **Lines:** 112-115, 127-128
- **Code:**
  ```typescript
  useEffect(() => {
    if (isLoggedIn && userProfile?.id) {
      trackAppOpen(userProfile.id);
      sessionManager.startSession(userProfile.id);
    }
  }, [isLoggedIn, userProfile?.id]);
  ```

**Notes:**
- Only tracked for authenticated users
- Automatically triggers session start
- Tracked on both initial launch and foreground transitions

---

### 2. user_session_start

**Description:** Marks the beginning of a user session.

**When Triggered:**
- User logs in
- App comes to foreground after being in background
- App is launched with an authenticated user

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp when session started

**Implementation Location:**
- **File:** `App.tsx`
- **Lines:** 114, 128
- **Method:** `sessionManager.startSession(userProfile.id)`
- **Service File:** `src/services/firebaseAnalyticsService.ts`
- **Service Lines:** 380-384

**Notes:**
- Managed automatically by the `SessionManager` class
- Session duration is tracked from this point
- Event name changed from `session_start` (reserved by Firebase) to `user_session_start`

---

### 3. user_session_end

**Description:** Marks the end of a user session and records duration.

**When Triggered:**
- App goes to background
- User logs out
- App is closed

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp when session ended
- `session_duration` (number): Duration in seconds

**Implementation Location:**
- **File:** `App.tsx`
- **Lines:** 136
- **Code:**
  ```typescript
  if (isLoggedIn && userProfile?.id) {
    sessionManager.endSession();
  }
  ```
- **Service File:** `src/services/firebaseAnalyticsService.ts`
- **Service Lines:** 386-393

**Notes:**
- Session duration calculated automatically
- Only tracked for authenticated sessions
- Event name changed from `session_end` (reserved by Firebase) to `user_session_end`

---

### 4. search_performed

**Description:** Tracks user search queries in the chat interface.

**When Triggered:**
- User sends a message/search in chat
- Both authenticated and guest users

**Parameters:**
- `user_id` (string): User ID or "guest" for unauthenticated users
- `timestamp` (string): ISO timestamp of the search
- `search_term` (string): The actual search query text

**Implementation Locations:**

**Location 1: Create Chat with Message**
- **File:** `src/store/chatStore.ts`
- **Lines:** 778-782
- **Code:**
  ```typescript
  const { userProfile } = useAuthStore.getState();
  if (userProfile?.id) {
    trackSearchPerformed(userProfile.id, message);
  }
  ```

**Location 2: Send Message (Authenticated)**
- **File:** `src/store/chatStore.ts`
- **Lines:** 1114-1118

**Location 3: Send Message (Guest)**
- **File:** `src/store/chatStore.ts`
- **Lines:** 1027-1028
- **Code:**
  ```typescript
  trackSearchPerformed('guest', content);
  ```

**Notes:**
- Tracks all search queries regardless of authentication status
- Guest searches tracked with user_id='guest'
- Essential for understanding search patterns and query optimization

---

### 5. product_view

**Description:** Tracks when a user views product details.

**When Triggered:**
- User taps on a product card to view details
- Details modal is opened

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp of the view
- `product_id` (string): The unique identifier of the product (hid)
- `merchant_id` (string, optional): The merchant/owner ID if available

**Implementation Location:**
- **File:** `src/components/chat/ResultCard.tsx`
- **Lines:** 563-566
- **Code:**
  ```typescript
  onPress={() => {
    logAnalytics();
    setDetailsVisible(true);
    // Track product view event
    if (userProfile?.id) {
      trackProductView(userProfile.id, hid);
    }
  }}
  ```

**Notes:**
- Only tracked for authenticated users
- Helps identify popular products
- Can be used to personalize recommendations

---

### 6. merchant_profile_view

**Description:** Tracks when a user views a merchant's profile.

**When Triggered:**
- User navigates to a merchant's profile page
- User taps on merchant information

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp of the view
- `merchant_id` (string): The merchant's unique identifier

**Implementation Location:**
- **File:** Currently not implemented in code
- **Service:** `src/services/firebaseAnalyticsService.ts`
- **Service Lines:** 170-186

**Notes:**
- Service function is ready to use
- Implementation pending merchant profile screen development
- Will be implemented when merchant profile viewing is added to the app

---

### 7. category_click

**Description:** Tracks when a user selects a category.

**When Triggered:**
- User selects a category from the category selection screen
- Happens when creating a new listing

**Parameters:**
- `user_id` (string): The authenticated user's ID
- `timestamp` (string): ISO timestamp of the click
- `category_name` (string): Display name of the selected category

**Implementation Location:**
- **File:** `src/screens/SelectCategoryScreen.tsx`
- **Lines:** 84-90
- **Code:**
  ```typescript
  const handleCategorySelect = (category: Category) => {
    selectCategory(category);
    
    // Track category click event
    if (userProfile?.id) {
      trackCategoryClick(userProfile.id, category.display_name);
    }
    
    navigation.navigate("ListingForm", {});
  };
  ```

**Notes:**
- Tracks merchant behavior when creating listings
- Helps understand which categories are most popular
- Informs category management and recommendations

---

## Merchant Events

### 8. merchant_product_upload

**Description:** Tracks when a merchant successfully uploads/creates a new listing.

**When Triggered:**
- Merchant submits a new listing through the ListingForm
- After successful API response

**Parameters:**
- `merchant_id` (string): The merchant's user ID
- `timestamp` (string): ISO timestamp of the upload
- `product_id` (string): The newly created listing's ID
- `total_products` (number): Total number of products the merchant now has

**Implementation Location:**
- **File:** `src/screens/ListingForm.tsx`
- **Lines:** 478-486
- **Code:**
  ```typescript
  const newListing = await ListingsApi.createListing(formData);
  setShowSuccessModal(true);
  
  // Track merchant product upload event
  if (userProfile?.id && newListing) {
    const totalProducts = userListings.length + 1;
    trackMerchantProductUpload(
      userProfile.id,
      newListing.id || 'unknown',
      totalProducts
    );
  }
  ```

**Notes:**
- Only tracked for verified merchants
- Provides insights into merchant activity and inventory growth
- Total products count includes the newly created listing

---

### 9. merchant_profile_update

**Description:** Tracks when a merchant updates their profile information.

**When Triggered:**
- Merchant updates their name via profile settings
- After successful API response

**Parameters:**
- `merchant_id` (string): The merchant's user ID
- `timestamp` (string): ISO timestamp of the update

**Implementation Location:**
- **File:** `src/store/authStore.ts`
- **Lines:** 201-204
- **Code:**
  ```typescript
  // Track merchant profile update if user is a verified merchant
  if (currentState.userProfile?.id && 
      currentState.userProfile?.verifiedStatus === 'VERIFIED') {
    trackMerchantProfileUpdate(currentState.userProfile.id);
  }
  ```

**Notes:**
- Only tracked for verified merchants (verifiedStatus === 'VERIFIED')
- Currently tracks name updates
- Can be extended to track other profile changes (logo, description, etc.)

---

### 10. merchant_dashboard_open

**Description:** Tracks when a merchant opens their dashboard/admin screen.

**When Triggered:**
- Merchant navigates to the AdminScreen
- Screen gains focus

**Parameters:**
- `merchant_id` (string): The merchant's user ID
- `timestamp` (string): ISO timestamp of the open event

**Implementation Location:**
- **File:** `src/screens/AdminScreen.tsx`
- **Lines:** 94-97
- **Code:**
  ```typescript
  // Track merchant dashboard open
  if (userProfile?.id && isMerchantUser) {
    trackMerchantDashboardOpen(userProfile.id);
  }
  ```

**Notes:**
- Only tracked for verified merchants
- Helps measure merchant engagement with dashboard
- Tracked on every screen focus (not just first visit)

---

## Implementation Files

### Core Analytics Service

**File:** `src/services/firebaseAnalyticsService.ts`

This file contains:
- All event tracking functions
- Type definitions for event parameters
- Session management logic
- User property management
- Debug mode controls

**Key Exports:**
```typescript
// User Events
export const trackAppOpen
export const trackSearchPerformed
export const trackProductView
export const trackMerchantProfileView
export const trackCategoryClick
export const trackSessionStart
export const trackSessionEnd

// Merchant Events
export const trackMerchantProductUpload
export const trackMerchantProfileUpdate
export const trackMerchantDashboardOpen

// User Management
export const setAnalyticsUserId
export const setUserProperties
export const clearAnalyticsUser

// Session Management
export const sessionManager

// Debug Controls
export const enableAnalyticsDebugMode
export const disableAnalytics
```

### Integration Points

1. **App.tsx**
   - App lifecycle tracking (app_open, session_start, session_end)
   - AppState listener for foreground/background transitions

2. **src/store/authStore.ts**
   - User identification on login
   - User property setting
   - Profile update tracking
   - Clearing analytics on logout

3. **src/store/chatStore.ts**
   - Search tracking in message sending
   - Both authenticated and guest user tracking

4. **src/screens/AdminScreen.tsx**
   - Merchant dashboard open tracking

5. **src/screens/ListingForm.tsx**
   - Merchant product upload tracking

6. **src/screens/SelectCategoryScreen.tsx**
   - Category selection tracking

7. **src/components/chat/ResultCard.tsx**
   - Product view tracking

---

## Testing Guide

### Manual Testing Checklist

Use this checklist to verify all events are working:

- [ ] **app_open**: Launch app → Check DebugView
- [ ] **user_session_start**: Login → Check DebugView
- [ ] **search_performed**: Type search in chat → Check DebugView
- [ ] **product_view**: Tap product card → Check DebugView
- [ ] **category_click**: Select category when creating listing → Check DebugView
- [ ] **merchant_product_upload**: Complete listing creation → Check DebugView
- [ ] **merchant_dashboard_open**: Navigate to Admin screen → Check DebugView
- [ ] **merchant_profile_update**: Update name in profile → Check DebugView
- [ ] **user_session_end**: Put app in background → Check DebugView

### DebugView Setup

See [FIREBASE_ANALYTICS_DEBUG.md](./FIREBASE_ANALYTICS_DEBUG.md) for detailed instructions on:
- Enabling DebugView for iOS
- Enabling DebugView for Android
- Viewing events in Firebase Console
- Troubleshooting common issues

### Automated Testing

Consider adding integration tests for critical analytics flows:

```typescript
// Example test structure
describe('Analytics Events', () => {
  it('should track app_open on launch', async () => {
    // Test implementation
  });
  
  it('should track search_performed on message send', async () => {
    // Test implementation
  });
  
  it('should track product_view on card tap', async () => {
    // Test implementation
  });
});
```

---

## Edge Cases and Notes

### Guest Users
- Guest users (not logged in) are tracked with `user_id='guest'` for search events
- Other events require authentication and won't fire for guests

### Merchant vs Regular Users
- Merchant-specific events check for `verifiedStatus === 'VERIFIED'`
- Regular users won't trigger merchant events even if they access merchant screens

### Session Management
- Sessions are automatically managed via `SessionManager` class
- Session duration is calculated in seconds
- Sessions end when app goes to background or user logs out

### Error Handling
- All analytics functions have try-catch blocks
- Errors are logged to console but don't throw exceptions
- Analytics failures don't impact app functionality

### Privacy Considerations
- User IDs are anonymized in Firebase
- No personally identifiable information (PII) in event parameters
- Search terms are tracked for analytics but are not linked to individual users in reports

---

## Future Enhancements

Consider adding these events in future iterations:

1. **favorite_added/favorite_removed** - Track favorite interactions
2. **listing_shared** - Track when users share listings
3. **filter_applied** - Track search filter usage
4. **purchase_intent** - Track when users click external links
5. **merchant_verification_started** - Track verification flow
6. **subscription_purchased** - Track IAP transactions (already have iapService)
7. **notification_opened** - Track notification engagement

---

## Maintenance

### Adding New Events

1. Add event type definitions in `firebaseAnalyticsService.ts`
2. Create tracking function following existing patterns
3. Implement tracking at appropriate trigger points
4. Update this documentation
5. Test in DebugView
6. Update testing checklist

### Modifying Existing Events

1. Update service function if needed
2. Update all implementation locations
3. Update this documentation
4. Test thoroughly in DebugView
5. Inform team of changes

---

## Support and Questions

For questions or issues with analytics implementation:
1. Review this documentation
2. Check [FIREBASE_ANALYTICS_DEBUG.md](./FIREBASE_ANALYTICS_DEBUG.md)
3. Review Firebase Console for errors
4. Check service logs in app console
5. Review React Native Firebase documentation

Last Updated: 2025-11-17
