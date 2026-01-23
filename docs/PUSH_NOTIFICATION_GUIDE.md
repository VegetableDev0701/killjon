# Push Notification Campaign Guide for NODO.ia

**A Complete Guide for Non-Technical Users**

This guide will walk you through sending push notifications to your app users using Firebase Console. No coding required!

---

## Table of Contents

1. [What Are Push Notifications?](#what-are-push-notifications)
2. [Getting Started with Firebase Console](#getting-started-with-firebase-console)
3. [Understanding Your User Topics](#understanding-your-user-topics)
4. [Creating Your First Campaign](#creating-your-first-campaign)
5. [Campaign Types and Examples](#campaign-types-and-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Analytics and Tracking](#analytics-and-tracking)

---

## What Are Push Notifications?

Push notifications are messages that pop up on users' mobile devices. They can:

- Appear even when the app is closed
- Show on the lock screen
- Make a sound or vibration
- Display an image or emoji
- Open specific parts of your app when tapped

**Example use cases:**

- Announce new features or updates
- Promote special offers to merchants
- Send country-specific announcements
- Re-engage inactive users
- Notify about system maintenance

---

## Getting Started with Firebase Console

### Step 1: Access Firebase Console

1. Open your web browser
2. Go to: **https://console.firebase.google.com**
3. Sign in with your Google account
4. You should see your Firebase projects

### Step 2: Select Your Environment

NODO.ia has two environments:

- **nodo-ia-staging**: For testing notifications (use this first!)
- **nodo-ia-production**: For sending to real users

**⚠️ IMPORTANT:** Always test your notifications in staging first before sending to production.

### Step 3: Navigate to Cloud Messaging

1. Click on your project (e.g., "nodo-ia-staging")
2. In the left sidebar, click on **"Engage"**
3. Click on **"Messaging"**
4. You'll see a big blue button: **"Send your first message"** or **"New campaign"**

---

## Understanding Your User Topics

NODO.ia automatically subscribes users to different "topics" based on their profile. Topics are like groups that you can send notifications to.

### Available Topics

| Topic Name          | Who Gets It                           | Best Used For                                                    |
| ------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| **all_users**       | Every registered user                 | Major announcements, app updates, emergency notifications        |
| **merchants**       | Users with verified merchant status   | Merchant-specific features, business tips, selling tools updates |
| **non_merchants**   | Regular users without merchant status | General features, buying tips, exploring app features            |
| **country_do**      | Users from Dominican Republic         | Country-specific news, local events, regional offers             |
| **analytics_users** | Users with analytics access           | Analytics features, dashboard updates, reporting tools           |
| **status_active**   | Active users                          | Engagement campaigns, new features, regular updates              |

### Combining Topics

You can also send to combinations of topics:

- **Example 1:** Send to merchants in Dominican Republic → `merchants` AND `country_do`
- **Example 2:** Send to all users except merchants → Use `non_merchants`

---

## Creating Your First Campaign

Follow these steps to send your first push notification:

### Step 1: Start a New Campaign

1. In Firebase Console → Cloud Messaging
2. Click **"New campaign"**
3. Select **"Firebase Notification messages"**

### Step 2: Compose Your Notification

Fill in the notification details:

#### **Notification title** (required)

- Short and attention-grabbing
- Maximum 65 characters recommended
- Example: "🎉 New Feature Available!"

#### **Notification text** (required)

- Clear and actionable
- Maximum 240 characters recommended
- Example: "Discover the new AI-powered search! Tap to explore."

#### **Notification image** (optional)

- URL to an image (must be publicly accessible)
- Recommended size: 1024x512 pixels
- Example: https://yourdomain.com/images/new-feature.jpg

#### **Notification name** (internal only)

- This helps you identify the campaign later
- Users won't see this
- Example: "New AI Search Launch - Jan 2025"

### Step 3: Choose Your Target Audience

You have three options:

#### **Option A: Send to Everyone**

1. Click **"User segment"**
2. Select the app (iOS or Android or both)
3. Choose **"All users"**
4. ⚠️ **Warning:** This sends to ALL users in production!

#### **Option B: Send to a Specific Topic** (Recommended)

1. Click **"Topic"**
2. Enter one of the topics from the list above
3. Example: Type `merchants` to send only to verified merchants

#### **Option C: Send Test Notification**

1. Click **"Send test message"**
2. Enter FCM token (get this from developers)
3. Great for testing before sending to everyone!

### Step 4: Add Advanced Options (Optional)

Click **"Additional options"** to configure:

#### **Sound**

- Default: Uses system notification sound
- Custom: Upload your own sound file (optional)

#### **Expiration**

- Set how long Firebase should try to deliver the notification
- Default: 4 weeks
- Use shorter time for time-sensitive messages

#### **Custom data** (for developers)

- Add key-value pairs for app behavior
- Example: `screen: "chat"` to open chat screen when tapped
- Consult with your development team for available options

### Step 5: Schedule Your Campaign

Choose when to send:

#### **Send now**

- Notification goes out immediately after you click "Publish"
- Use for urgent announcements

#### **Schedule for later**

- Pick a specific date and time
- Great for planned releases or timed promotions
- Example: Schedule for Monday 9 AM when users are most active

### Step 6: Review and Publish

1. Review all details in the summary panel on the right
2. Check your target audience size (shown in the panel)
3. Double-check spelling and grammar
4. Click **"Review"**
5. Confirm details
6. Click **"Publish"**

**🎉 Congratulations!** Your notification is on its way!

---

## Campaign Types and Examples

### Campaign Type 1: App Update Announcement

**Goal:** Inform all users about a new version

**Target:** `all_users`

**Sample Notification:**

```
Title: 🚀 NODO.ia v2.0 is Here!
Text: Faster AI, better search, and more! Update now to experience the new NODO.ia.
Image: [App store badge image URL]
Custom Data:
  - action: "open_app_store"
```

---

### Campaign Type 2: Merchant Feature Launch

**Goal:** Announce a new feature only for merchants

**Target:** `merchants`

**Sample Notification:**

```
Title: 📊 New Analytics Dashboard!
Text: Track your listings performance with our new analytics tools. Check it out now!
Image: [Dashboard screenshot URL]
Custom Data:
  - screen: "analytics"
  - feature: "dashboard"
```

---

### Campaign Type 3: Country-Specific Promotion

**Goal:** Promote a local event in Dominican Republic

**Target:** `country_do`

**Sample Notification:**

```
Title: 🇩🇴 Feria Virtual Este Fin de Semana
Text: Descubre ofertas exclusivas de vendedores locales. Solo este sábado y domingo.
Image: [Event banner URL]
Custom Data:
  - event_id: "virtual_fair_jan_2025"
  - screen: "events"
```

---

### Campaign Type 4: Re-engagement Campaign

**Goal:** Bring back inactive users

**Target:** Use custom conditions (requires Firebase Analytics setup)

**Sample Notification:**

```
Title: 👋 We Miss You!
Text: Discover what's new in NODO.ia. New AI features, better search, and more!
Image: [Welcome back image URL]
Custom Data:
  - campaign: "reengagement"
  - screen: "home"
```

---

### Campaign Type 5: Merchant-Only Update

**Goal:** Inform merchants about policy changes

**Target:** `merchants`

**Sample Notification:**

```
Title: ⚠️ Important: Policy Update
Text: New listing guidelines effective Feb 1. Tap to review changes.
Image: null
Custom Data:
  - screen: "policies"
  - policy_version: "2.0"
```

---

### Campaign Type 6: Feature Tutorial Series

**Goal:** Educate users about app features (send as a series)

**Target:** `non_merchants` (users still exploring)

**Day 1 Notification:**

```
Title: 💡 Tip #1: Voice Search
Text: Did you know? You can search using your voice! Tap to try it now.
Custom Data:
  - tutorial: "voice_search"
  - screen: "search"
```

**Day 3 Notification:**

```
Title: 💡 Tip #2: Save Favorites
Text: Found something you like? Save it to your favorites for later!
Custom Data:
  - tutorial: "favorites"
  - screen: "favorites"
```

**Day 5 Notification:**

```
Title: 💡 Tip #3: Smart Filters
Text: Use AI-powered filters to find exactly what you're looking for.
Custom Data:
  - tutorial: "filters"
  - screen: "search"
```

---

## Best Practices

### ✅ DO's

1. **Test First**
   - Always send to staging environment first
   - Use "Send test message" to your own device
   - Verify the notification looks good on both iOS and Android

2. **Write Clear, Actionable Text**
   - Use simple language
   - Include a clear call-to-action
   - Keep it short and scannable

3. **Choose the Right Time**
   - Consider user time zones
   - Avoid sending at night (unless urgent)
   - Best times: 9-11 AM or 6-8 PM local time

4. **Use Emojis Sparingly**
   - One emoji in title is enough
   - Don't use too many emojis (❌ looks spammy)
   - Test that emojis display correctly on all devices

5. **Segment Your Audience**
   - Don't blast everyone with irrelevant messages
   - Use topics to send targeted notifications
   - Merchants get merchant content, etc.

6. **Track Performance**
   - Check delivery and open rates
   - Learn from successful campaigns
   - Adjust future messages based on data

7. **Respect Frequency**
   - Don't send too many notifications
   - Maximum 2-3 per week for general announcements
   - Space out campaigns by at least 2-3 days

### ❌ DON'Ts

1. **Don't Send Without Testing**
   - Never send to production without testing first
   - Always preview on actual devices

2. **Don't Use All Caps**
   - ❌ "NEW FEATURE AVAILABLE NOW!!!"
   - ✅ "New feature available now!"

3. **Don't Send Generic Messages**
   - Make it specific and valuable
   - Explain why the user should care

4. **Don't Overuse Notifications**
   - Users will turn off notifications if you spam them
   - Quality over quantity

5. **Don't Forget About Time Zones**
   - Dominican Republic is in AST (GMT-4)
   - Consider when users are most active

6. **Don't Use Marketing Spam Words**
   - Avoid: "Act now!", "Limited time!", "Buy now!"
   - Use genuine, helpful language

7. **Don't Send Without a Purpose**
   - Every notification should have clear value
   - Ask: "Would I want to receive this?"

---

## Troubleshooting

### Problem: "No eligible devices found"

**Cause:** No users are subscribed to the topic you selected

**Solution:**

- Double-check the topic name (topics are case-sensitive!)
- Make sure users have registered and opted into notifications
- Try sending to `all_users` topic instead
- Verify users have the latest app version with topic subscription code

---

### Problem: Notification sent but not received

**Possible causes and solutions:**

1. **User hasn't granted notification permission**
   - Users must allow notifications in device settings
   - Remind users to enable notifications in the app

2. **User is on iOS and app is in staging**
   - iOS staging apps need special APNs certificates
   - Verify APNs is properly configured (see FIREBASE_SETUP.md)

3. **Network issues**
   - Firebase retries for up to 4 weeks
   - User will receive when they reconnect

4. **App was uninstalled**
   - Firebase automatically removes invalid tokens
   - User won't receive until they reinstall

---

### Problem: Notification looks different on iOS vs Android

**This is normal!** Each platform has its own notification style.

**iOS:**

- Rounded corners
- Different font
- Image appears differently

**Android:**

- Material Design style
- Customizable
- Expandable notifications

**Solution:** Test on both platforms and ensure the message is clear on both.

---

### Problem: Image not showing in notification

**Possible causes:**

- Image URL is not publicly accessible
- Image is too large (>1MB)
- Image format not supported (use JPG or PNG)

**Solution:**

- Use a CDN or public image host
- Resize images to 1024x512 pixels
- Test the image URL in a browser first

---

### Problem: Can't find Firebase Console

**Solution:**

1. Make sure you have been granted access to the Firebase project
2. Contact your admin to add you as a collaborator
3. Check that you're signed in with the correct Google account

---

## Analytics and Tracking

### Viewing Campaign Results

1. Go to Firebase Console → Messaging
2. Click on the **"Campaigns"** tab
3. Find your campaign in the list
4. Click on it to see detailed stats

### Key Metrics to Monitor

#### **Sends**

- Number of notifications Firebase attempted to deliver
- Should match your target audience size

#### **Received**

- Number of devices that received the notification
- Lower than sends if users are offline or app is uninstalled

#### **Impressions**

- Number of users who saw the notification
- iOS: Users who had screen on when notification arrived
- Android: Always counted when received

#### **Opens**

- Number of users who tapped the notification
- **Open rate = (Opens / Impressions) × 100**
- Good open rate: 5-10%
- Great open rate: 10%+

#### **Conversion Events** (requires Firebase Analytics)

- Actions users took after opening notification
- Example: Made a purchase, created a listing, etc.
- Requires developer setup

### Interpreting Results

#### **Good Campaign:**

```
Sends: 10,000
Received: 9,500 (95%)
Impressions: 8,000 (84%)
Opens: 800 (10%)
```

✅ This is a successful campaign!

#### **Poor Campaign:**

```
Sends: 10,000
Received: 9,500 (95%)
Impressions: 8,000 (84%)
Opens: 80 (1%)
```

❌ Low open rate indicates:

- Notification wasn't compelling enough
- Wrong timing
- Notification fatigue
- Unclear message

### Improving Future Campaigns

Based on analytics, try:

1. **If low receive rate:**
   - Users are offline or have uninstalled
   - Try different send times
   - Send reminder after 24 hours

2. **If low impressions:**
   - iOS users may have screen off
   - Try adding a sound or vibration
   - Send when users are more active

3. **If low open rate:**
   - Improve your title and text
   - Make the value proposition clearer
   - Add emojis or images
   - Segment your audience better
   - Test different send times

4. **If high open rate but low conversions:**
   - The landing screen in app needs improvement
   - Call-to-action isn't clear enough
   - Users expected something different

---

## Quick Reference: Topic Cheat Sheet

Copy and paste these exact topic names into Firebase Console:

```
all_users               → Everyone (use sparingly!)
merchants               → Verified merchants only
non_merchants           → Regular users
country_do              → Users in Dominican Republic
analytics_users         → Users with analytics access
status_active           → Active users
```

---

## Quick Reference: Notification Templates

### Template 1: Feature Announcement

```
Title: 🚀 [Feature Name] is Here!
Text: [Brief description of feature and benefit]. Tap to try it now!
Target: all_users or specific segment
```

### Template 2: Merchant Update

```
Title: 📢 [Update Name]
Text: [What changed and why it matters to merchants]. Learn more.
Target: merchants
```

### Template 3: Regional Promotion

```
Title: 🇩🇴 [Promotion Name]
Text: [Details and call to action]. Available in Dominican Republic only.
Target: country_do
```

### Template 4: Urgent Notification

```
Title: ⚠️ [What happened]
Text: [Brief explanation]. [What user should do].
Target: all_users
```

### Template 5: Tutorial/Tips

```
Title: 💡 Tip: [Feature Name]
Text: [How to use it and why it's useful]. Try it now!
Target: non_merchants or all_users
```

---

## Need Help?

### For Technical Issues:

- Check FIREBASE_SETUP.md for configuration details
- Contact your development team
- Check Firebase Status: https://status.firebase.google.com

### For Campaign Strategy:

- Review analytics from previous campaigns
- A/B test different messages
- Ask for user feedback

### For Account Access:

- Contact your Firebase project administrator
- They can add you as a collaborator with appropriate permissions

---

## Appendix: Testing Checklist

Before sending to production, verify:

- [ ] Tested notification in staging environment
- [ ] Notification displays correctly on iOS
- [ ] Notification displays correctly on Android
- [ ] Notification title is clear and compelling
- [ ] Notification text provides value
- [ ] Image displays correctly (if used)
- [ ] Target audience is correct
- [ ] Send time is appropriate for user timezone
- [ ] Frequency is reasonable (not too many notifications)
- [ ] Custom data is correct (if using deep links)
- [ ] Spelling and grammar are correct
- [ ] Reviewed campaign name for internal tracking
- [ ] Team members have reviewed and approved

---

## Version History

- **v1.0** - Initial guide created (Jan 2025)

---

**Remember:** Push notifications are a powerful tool to engage your users, but with great power comes great responsibility. Always prioritize user experience and send notifications that provide genuine value. Happy notifying! 🎉
