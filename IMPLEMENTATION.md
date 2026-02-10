# Rizon React Native Frontend

Email-based authentication and onboarding flow for the Rizon mobile app.

## Overview

The Rizon frontend implements:

- Email-based authentication (no passwords)
- Deep link handling for auth verification
- One-time onboarding flow after login
- Persistent session management
- Feedback collection and submission
- Store redirect (App Store / Google Play)

## Architecture

### Key Components

**Authentication Flow**

```
Login Screen → Email Input → Auth Link Sent
     ↓
Deep Link Received → Token Extracted → Auth Verified
     ↓
Session Created → Onboarding Triggered → Tab Navigation
```

### Context Providers

1. **AuthProvider** (`contexts/auth.context.tsx`)
   - Manages authentication state
   - Handles session token storage
   - Provides auth functions: `sendAuthLink()`, `verifyAuthLink()`, `logout()`

2. **OnboardingProvider** (`contexts/onboarding.context.tsx`)
   - Manages onboarding state
   - Triggers onboarding flow after login
   - Ensures one-time display per device
   - Tracks onboarding completion

### Services

1. **AuthService** (`services/auth.service.ts`)
   - API calls to backend
   - Session token management (secure storage)
   - User authentication logic

2. **OnboardingService** (`services/onboarding.service.ts`)
   - Feedback submission to backend
   - Onboarding status checking
   - App Store/Play Store links

### UI Components

- **RizonButton**: Primary, secondary, outline variants with loading states
- **RizonInput**: Text input with error states and labels
- **RizonBottomSheet**: Custom bottom sheet with animations

### Screens

1. **Login Screen** (`app/login.tsx`)
   - Email input
   - Link sent confirmation
   - Retry functionality

2. **Tabs** (`app/(tabs)/`)
   - Home screen (redirects here after login)
   - Standard tab navigation

### Onboarding Sheets

1. **InitialOnboardingContent**: First sheet with usage info
2. **FeedbackSheet**: Feedback collection
3. **ReviewSheet**: Store redirect button

## Authentication Flow (Detailed)

### Step 1: User Opens App

```
App Launches
    ↓
RootLayout Checks Stored Session
    ↓
Has Session? → Navigate to (tabs)
No Session? → Navigate to Login
```

### Step 2: User Enters Email

1. User types email on login screen
2. User taps "Send Login Link"
3. `sendAuthLink(email)` is called
4. Backend generates unique token with 15-minute expiration
5. In development, token is logged to console
6. In production, token is sent via email
7. User sees "Check your email" message

### Step 3: User Clicks Link

1. Link format: `rizon://auth?token=xxxxx`
2. OS opens app with deep link
3. `useDeepLinkingHandler` extracts token
4. `verifyAuthLink(token)` is called
5. Backend verifies token:
   - Check not expired
   - Check not already used
   - Mark as used
   - Create session
6. Session token returned and stored locally
7. User navigated to home screen
8. Onboarding is triggered (first time only)

### Step 4: Onboarding Flow

1. `triggerOnboardingAfterLogin()` is called
2. Checks if user has completed onboarding on this device
3. If not, shows InitialOnboardingSheet
4. Sheet flow:
   - Sheet 0: Welcome message with two buttons
     - "Not enjoying it" → Sheet 1 (Feedback)
     - "Loving it" → Sheet 2 (Review)
   - Sheet 1: Feedback collection
   - Sheet 2: Store link redirect

### Step 5: Feedback Submission

User enters feedback and taps "Send feedback":

1. Loading state enabled
2. Session token retrieved from storage
3. API call to `/api/feedback/submit` with:
   - Authorization header with session token
   - Feedback content
4. Backend:
   - Validates session
   - Stores feedback in database
   - Publishes to Slack
5. On success:
   - Onboarding marked as completed
   - Flag cleared from storage
   - Sheet closes
6. On failure:
   - Error message displayed
   - Feedback preserved for retry

### Step 6: Session Persistence

Session token is stored in:

- **iOS/Android**: Expo SecureStore (encrypted)
- **Web/Development**: AsyncStorage (fallback)

On app restart:

- Session token retrieved from storage
- User automatically logged in
- Onboarding flow not shown again

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

This includes new packages for authentication:

- `@react-native-async-storage/async-storage`: Store session locally
- `expo-secure-store`: Secure token storage

### 2. Configure API URL

Create `.env.local` in project root:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
```

Or for production:

```bash
EXPO_PUBLIC_API_URL=https://api.rizon.app
```

### 3. Run Backend

```bash
cd ../rizon-backend
go run main.go
```

Backend will start on `http://localhost:8080`

### 4. Run Frontend

```bash
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Testing the Flow

### Manual Testing

1. **Send Auth Link**
   - Go to login screen
   - Enter email: `test@example.com`
   - Tap "Send Login Link"

2. **Get Token** (Development)
   - Check backend console output
   - Copy token from log: `[DEV] Auth link for test@example.com: rizon://auth?token=xxxxx`

3. **Verify Token**
   - Simulate deep link:
     - iOS: In Xcode, select Scheme → Edit Scheme → Run → Arguments → add `URL: rizon://auth?token=xxxxx`
     - Android: `adb shell am start -W -a android.intent.action.VIEW -d "rizon://auth?token=xxxxx" com.rizon.app`
   - Or use the Expo CLI to test deep links

4. **Complete Onboarding**
   - After successful login, onboarding sheet appears
   - Enter feedback
   - Tap "Send feedback"
   - See success and sheet closes

5. **Restart App**
   - Kill and reopen app
   - Should navigate directly to home (no login required)
   - Onboarding should NOT show again

### Automated Testing

```bash
# Coming soon - unit tests for auth flows
npm test
```

## File Structure

```
rizon-app/
├── app/
│   ├── _layout.tsx              # Root layout with auth
│   ├── login.tsx                # Login screen
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx            # Home screen
│       └── ...
├── components/
│   ├── ui/
│   │   ├── rizon-button.tsx
│   │   ├── rizon-input.tsx
│   │   └── rizon-bottom-sheet.tsx
│   └── onboarding/
│       ├── InitialOnboardingSheet/
│       ├── FeedbackSheet/
│       └── ReviewSheet/
├── contexts/
│   ├── auth.context.tsx         # Auth state management
│   └── onboarding.context.tsx   # Onboarding state management
├── services/
│   ├── auth.service.ts          # Auth API calls
│   └── onboarding.service.ts    # Onboarding API calls
├── utils/
│   └── deep-linking.ts          # Deep link handling
├── app.json                     # Deep link configuration
└── package.json
```

## Key Implementation Details

### Session Token Storage

Tokens are stored using the system:

1. Try Expo SecureStore (iOS/Android)
2. Fallback to AsyncStorage (web/development)

This ensures tokens are stored securely on native platforms and with a reasonable fallback.

### Deep Link Handling

The app listens for deep links in two ways:

1. **Warm Start** (app already open)
   - Event listener catches URL change
   - Token extracted and processed

2. **Cold Start** (app closed)
   - Initial URL retrieved from Linking API
   - Token extracted and processed

Both flows trigger the same verification logic.

### One-Time Onboarding

Onboarding is only shown when:

1. User has NOT completed onboarding on this device
2. User has just successfully logged in (tracked by `isNewLogin` flag)
3. Flag is cleared after onboarding completes

This prevents showing onboarding on subsequent app launches.

### Feedback Reliability

Feedback submission uses several mechanisms to prevent data loss:

1. **Button disabled during submission** - Prevents double-taps
2. **Ref-based submission tracking** - Prevents race conditions
3. **Feedback preserved if failed** - User can retry without re-typing
4. **Sheet only closes after success** - Ensures backend confirmation
5. **Error messages displayed** - User knows status

## Environment Variables

| Variable              | Default                 | Description     |
| --------------------- | ----------------------- | --------------- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |

Note: Variables must start with `EXPO_PUBLIC_` to be accessible in Expo apps.

## Troubleshooting

### Deep Links Not Working

1. **Check app.json**
   - Ensure schemes are configured: `["rizon", "rizonapp"]`
   - iOS: Check bundleIdentifier is correct
   - Android: Check package name is correct

2. **Test deep link**

   ```bash
   # iOS
   xcrun simctl openurl booted "rizon://auth?token=test123"

   # Android
   adb shell am start -W -a android.intent.action.VIEW -d "rizon://auth?token=test123" com.rizon.app
   ```

3. **Check logs**
   - Look for `[DEEP_LINKING]` messages in console

### Session Not Persisting

1. **Check storage**

   ```javascript
   import * as SecureStore from "expo-secure-store";
   const token = await SecureStore.getItemAsync("sessionToken");
   console.log("Stored token:", token);
   ```

2. **Check API response**
   - Verify backend returns `session_token` in auth response
   - Check React Developer Tools storage

### Feedback Not Submitting

1. **Check API URL**
   - Ensure `EXPO_PUBLIC_API_URL` is set correctly
   - Test API endpoint directly: `curl http://localhost:8080/api/health`

2. **Check session token**
   - Verify session token is being saved
   - Check Authorization header in network requests

3. **Check backend logs**
   - Look for errors in backend console
   - Verify feedback endpoint is receiving requests

### Onboarding Not Showing

1. **Check AsyncStorage flag**

   ```javascript
   import AsyncStorage from "@react-native-async-storage/async-storage";
   const flag = await AsyncStorage.getItem("onboardingTriggered");
   console.log("Onboarding flag:", flag);
   ```

2. **Check auth status**
   - Verify user is authenticated before onboarding should show
   - Check that `triggerOnboardingAfterLogin()` is being called

3. **Clear data and restart**
   ```javascript
   await AsyncStorage.multiRemove([
     "hasSeenInitialOnboarding",
     "onboardingTriggered",
     "sessionToken",
   ]);
   ```

## Next Steps

### Enhancements

1. **Email Sending**
   - Replace console logging with actual email service (SendGrid, AWS SES, etc.)

2. **Database**
   - Replace in-memory storage with persistent database
   - Add user profiles with additional data

3. **Real Slack Integration**
   - Configure real Slack webhook
   - Enhance message formatting with rich blocks

4. **Authentication Improvements**
   - Add JWT verification on frontend
   - Implement token refresh mechanism
   - Add logout endpoint

5. **Onboarding Analytics**
   - Track which users complete onboarding
   - Monitor feedback sentiment
   - Measure store redirect clicks

## Support

For issues or questions, refer to:

- Backend: `/path/to/rizon-backend/README.md`
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- Expo Router: https://docs.expo.dev/routing/introduction/
