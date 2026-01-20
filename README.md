# Rizon App - Onboarding Implementation

React Native app with three onboarding bottom sheets.

## Features

- Initial Onboarding Sheet - Shows after user completes onboarding
- Feedback Sheet - Collects user feedback
- Review Sheet - Prompts users to leave app store reviews

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:
   - Set `EXPO_PUBLIC_API_URL` in `.env`
   - Update App Store IDs in `services/onboarding.service.ts`

3. Run the app:
   ```bash
   npm start
   ```

## Testing

Navigate to the Test tab to manually trigger each onboarding sheet.

## Structure

- `/app` - App screens and navigation
- `/components/onboarding` - Onboarding bottom sheets
- `/components/ui` - Reusable UI components
- `/contexts` - React contexts
- `/services` - API services
- `/assets` - Images and assets
