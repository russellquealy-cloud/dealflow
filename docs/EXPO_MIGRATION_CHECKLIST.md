# Expo Migration Checklist

This checklist outlines the steps needed to migrate OffAxisDeals.com to a React Native mobile app using Expo.

## Prerequisites

- [ ] Complete API abstraction layer (`app/lib/api/`)
- [ ] Complete storage abstraction (`app/lib/storage/`)
- [ ] Extract all UI components to `app/components/ui/`
- [ ] Organize screen-level components in `app/screens/`
- [ ] Remove all DOM assumptions from business logic

## Phase 1: Project Setup

### Expo Project Initialization
- [ ] Create new Expo project: `npx create-expo-app offaxisdeals-mobile`
- [ ] Install dependencies:
  - [ ] `@supabase/supabase-js`
  - [ ] `@react-navigation/native`
  - [ ] `@react-navigation/stack`
  - [ ] `@react-navigation/bottom-tabs`
  - [ ] `@react-native-async-storage/async-storage`
  - [ ] `expo-location`
  - [ ] `expo-image-picker`
  - [ ] `react-native-maps` (or `react-native-google-maps`)
  - [ ] `react-native-gesture-handler`
  - [ ] `react-native-safe-area-context`
  - [ ] `react-native-screens`

### Project Structure
- [ ] Copy `app/lib/` to mobile project
- [ ] Copy `app/components/ui/` to mobile project
- [ ] Copy `app/screens/` to mobile project
- [ ] Set up TypeScript configuration
- [ ] Configure path aliases (`@/` imports)

## Phase 2: Core Infrastructure

### Storage Integration
- [ ] Update `app/lib/storage/index.ts` to use AsyncStorage adapter:
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  const adapter: StorageAdapter = {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
    clear: () => AsyncStorage.clear(),
    getAllKeys: () => AsyncStorage.getAllKeys(),
  };
  
  storage.setAdapter(adapter);
  ```

### API Client Configuration
- [ ] Update API client base URL for mobile:
  ```typescript
  const apiClient = getApiClient('https://offaxisdeals.com');
  ```

### Navigation Setup
- [ ] Install and configure React Navigation
- [ ] Create navigation stack:
  - [ ] Auth stack (Login, Signup, Reset Password)
  - [ ] Main stack (Listings, Messages, Profile, etc.)
  - [ ] Tab navigator for bottom tabs
- [ ] Replace Next.js `useRouter` with React Navigation hooks

### Authentication
- [ ] Configure Supabase client for React Native
- [ ] Set up deep linking for auth callbacks
- [ ] Implement session persistence with AsyncStorage
- [ ] Test magic link flow
- [ ] Test password reset flow

## Phase 3: Screen Migration

### Listings Screen
- [ ] Migrate `app/listings/page.tsx` → `screens/listings/ListingsScreen.tsx`
- [ ] Replace Google Maps with `react-native-maps`
- [ ] Implement map markers and clustering
- [ ] Replace `localStorage` with storage abstraction
- [ ] Test search and filter functionality
- [ ] Test saved searches

### Messages Screen
- [ ] Migrate `app/messages/page.tsx` → `screens/messages/MessagesScreen.tsx`
- [ ] Migrate conversation screen
- [ ] Implement real-time updates (Supabase subscriptions)
- [ ] Test message sending/receiving
- [ ] Test read receipts

### Profile Screen
- [ ] Migrate `app/account/page.tsx` → `screens/profile/ProfileScreen.tsx`
- [ ] Implement image picker for profile photos
- [ ] Test profile updates
- [ ] Test subscription management

### My Listings Screen
- [ ] Migrate `app/my-listings/page.tsx` → `screens/listings/MyListingsScreen.tsx`
- [ ] Implement image picker for listing photos
- [ ] Test listing creation
- [ ] Test listing editing

### Watchlists Screen
- [ ] Migrate `app/watchlists/page.tsx` → `screens/watchlists/WatchlistsScreen.tsx`
- [ ] Test adding/removing listings
- [ ] Test watchlist notifications

### Saved Searches Screen
- [ ] Migrate `app/saved-searches/page.tsx` → `screens/searches/SavedSearchesScreen.tsx`
- [ ] Test saving searches
- [ ] Test applying saved searches

### Notifications Screen
- [ ] Migrate `app/notifications/page.tsx` → `screens/notifications/NotificationsScreen.tsx`
- [ ] Implement push notifications (Expo Notifications)
- [ ] Test notification preferences

### Admin Screens
- [ ] Migrate admin dashboard
- [ ] Migrate user management
- [ ] Migrate flags/reports
- [ ] Migrate audit logs

## Phase 4: Platform-Specific Features

### Maps
- [ ] Replace Google Maps web component with `react-native-maps`
- [ ] Configure Google Maps API key for mobile
- [ ] Implement map clustering
- [ ] Implement polygon drawing (if needed)
- [ ] Test map performance

### Image Handling
- [ ] Replace Next.js `Image` with `expo-image` or `react-native-fast-image`
- [ ] Implement image picker for uploads
- [ ] Test image uploads to Supabase Storage
- [ ] Test image caching

### Location Services
- [ ] Implement location permissions
- [ ] Use `expo-location` for current location
- [ ] Test geocoding
- [ ] Test reverse geocoding

### File System
- [ ] Replace file inputs with `expo-document-picker` or `expo-image-picker`
- [ ] Test file uploads
- [ ] Test file downloads

### Deep Linking
- [ ] Configure deep linking for auth callbacks
- [ ] Configure deep linking for listing details
- [ ] Test magic link redirects
- [ ] Test password reset redirects

### Push Notifications
- [ ] Set up Expo Notifications
- [ ] Configure push notification service
- [ ] Implement notification handlers
- [ ] Test notification delivery

## Phase 5: UI/UX Adjustments

### Responsive Design
- [ ] Adjust layouts for mobile screens
- [ ] Test on various screen sizes (iPhone SE to iPad)
- [ ] Implement safe area handling
- [ ] Test landscape orientation

### Touch Interactions
- [ ] Ensure all buttons meet 44px minimum touch target
- [ ] Test swipe gestures
- [ ] Test pull-to-refresh
- [ ] Test long-press actions

### Navigation Patterns
- [ ] Implement bottom tab navigation
- [ ] Implement stack navigation
- [ ] Implement modal navigation
- [ ] Test back button behavior (Android)

### Loading States
- [ ] Implement skeleton loaders
- [ ] Test loading indicators
- [ ] Test error states

### Forms
- [ ] Test all form inputs
- [ ] Test keyboard behavior
- [ ] Test form validation
- [ ] Test form submission

## Phase 6: Testing

### Unit Tests
- [ ] Test API client
- [ ] Test storage abstraction
- [ ] Test business logic functions
- [ ] Test utility functions

### Integration Tests
- [ ] Test authentication flow
- [ ] Test listing creation flow
- [ ] Test messaging flow
- [ ] Test payment flow

### E2E Tests
- [ ] Set up Detox or Maestro
- [ ] Write E2E tests for critical flows
- [ ] Test on iOS simulator
- [ ] Test on Android emulator

### Device Testing
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test on various iOS versions
- [ ] Test on various Android versions

## Phase 7: Performance Optimization

### Bundle Size
- [ ] Analyze bundle size
- [ ] Implement code splitting
- [ ] Optimize images
- [ ] Remove unused dependencies

### Runtime Performance
- [ ] Profile app performance
- [ ] Optimize re-renders
- [ ] Implement memoization where needed
- [ ] Optimize list rendering (FlatList)

### Network Performance
- [ ] Implement request caching
- [ ] Implement offline support
- [ ] Test slow network conditions
- [ ] Test offline mode

## Phase 8: Deployment

### App Store (iOS)
- [ ] Create Apple Developer account
- [ ] Configure app signing
- [ ] Create app store listing
- [ ] Submit for review
- [ ] Handle app store review feedback

### Play Store (Android)
- [ ] Create Google Play Developer account
- [ ] Configure app signing
- [ ] Create play store listing
- [ ] Submit for review
- [ ] Handle play store review feedback

### OTA Updates
- [ ] Set up Expo Updates
- [ ] Configure update channels
- [ ] Test OTA updates
- [ ] Implement update checking

## Phase 9: Post-Launch

### Monitoring
- [ ] Set up crash reporting (Sentry)
- [ ] Set up analytics (Mixpanel, Amplitude)
- [ ] Monitor app performance
- [ ] Monitor API usage

### Support
- [ ] Set up in-app support
- [ ] Test feedback submission
- [ ] Monitor user reviews

### Iteration
- [ ] Collect user feedback
- [ ] Prioritize feature requests
- [ ] Plan updates
- [ ] Release updates

## Known Challenges

### Maps
- Google Maps for React Native requires different setup than web
- Consider using Mapbox as alternative
- Clustering libraries may differ

### Authentication
- Deep linking setup is more complex
- OAuth flows require app-specific configuration
- Session management differs

### File Uploads
- Image picker APIs differ from web file inputs
- May need to handle permissions differently
- Upload progress tracking may differ

### Navigation
- React Navigation is different from Next.js routing
- Deep linking configuration required
- Back button handling (Android)

### Performance
- Bundle size is more critical
- Initial load time matters more
- Memory management is stricter

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)

## Notes

- Keep web and mobile codebases in sync where possible
- Use shared business logic from `app/lib/`
- Consider using a monorepo structure
- Document platform-specific differences
- Test on real devices early and often

