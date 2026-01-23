# Firebase Analytics Reserved Event Names

## Issue

Firebase Analytics has a list of reserved event names that cannot be used for custom events. Attempting to use them will result in an error:

```
Error: firebase.analytics().logEvent(*) 'name' the event name 'session_start' is reserved and can not be used.
```

## Reserved Event Names (Commonly Used)

The following event names are reserved by Firebase and **cannot** be used:

- `session_start` - Automatically tracked by Firebase
- `first_open` - Automatically tracked by Firebase  
- `app_remove` - System event
- `app_update` - System event
- `app_clear_data` - System event
- `os_update` - System event
- `firebase_campaign` - Reserved for Firebase campaigns

Full list: https://firebase.google.com/docs/reference/cpp/group/event-names

## Our Solution

We've renamed our custom session events to avoid conflicts:

| Original Name | New Name | Status |
|---------------|----------|--------|
| `session_start` | `user_session_start` | ✅ Fixed |
| `session_end` | `user_session_end` | ✅ Fixed |

## Implementation

The changes were made in:
- **Service:** `src/services/firebaseAnalyticsService.ts`
- **Functions:** `trackSessionStart()` and `trackSessionEnd()`

### Code Example

```typescript
// ❌ WRONG - Uses reserved name
await analytics().logEvent('session_start', params);

// ✅ CORRECT - Uses custom name
await analytics().logEvent('user_session_start', params);
```

## Best Practices

When creating custom Firebase Analytics events:

1. **Always prefix with your app domain** (e.g., `user_`, `merchant_`, `app_`)
2. **Check Firebase documentation** for reserved names
3. **Use lowercase with underscores** (snake_case)
4. **Keep names under 40 characters**
5. **Make them descriptive but concise**

### Good Event Names ✅
- `user_session_start`
- `merchant_product_upload`
- `product_view`
- `search_performed`

### Bad Event Names ❌
- `session_start` (reserved)
- `click` (too generic)
- `UserProfileUpdate` (wrong casing)
- `very_long_event_name_that_describes_everything` (too long)

## Testing

After the fix, all events should log successfully. Enable DebugView to verify:

```bash
# Android
adb shell setprop debug.firebase.analytics.app com.nodoia.nodo.staging

# iOS - Add to Xcode scheme arguments
-FIRDebugEnabled
```

Then check Firebase Console → Analytics → DebugView for your events.

## References

- [Firebase Analytics Reserved Events](https://firebase.google.com/docs/reference/cpp/group/event-names)
- [Automatically Collected Events](https://support.google.com/firebase/answer/9234069)
- [Custom Event Best Practices](https://firebase.google.com/docs/analytics/events)

---

**Last Updated:** 2025-11-20  
**Status:** ✅ Resolved
