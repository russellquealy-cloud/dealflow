# Screen Components

This directory contains screen-level components that are designed to be reusable in both web (Next.js) and React Native (Expo) environments.

## Structure

```
screens/
  listings/
    ListingsScreen.tsx      # Main listings screen
    ListingsScreen.web.tsx  # Web-specific implementation
    ListingsScreen.native.tsx # React Native implementation
  messages/
    MessagesScreen.tsx
    ConversationScreen.tsx
  profile/
    ProfileScreen.tsx
  ...
```

## Usage

### Web (Next.js)
Import the screen component directly:
```tsx
import { ListingsScreen } from '@/screens/listings/ListingsScreen';
```

### React Native (Expo)
The same import works, but you may need platform-specific implementations:
```tsx
import { ListingsScreen } from '@/screens/listings/ListingsScreen';
```

## Migration Strategy

1. **Extract page logic** from `app/[page]/page.tsx` into `screens/[page]/[Page]Screen.tsx`
2. **Keep Next.js pages** as thin wrappers that import and render screen components
3. **Use platform detection** for web-specific features (maps, file uploads, etc.)
4. **Abstract navigation** using a navigation service

## Screen Component Pattern

```tsx
// screens/listings/ListingsScreen.tsx
'use client';

import { useState } from 'react';
import { useApi } from '@/lib/api/hooks';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface ListingsScreenProps {
  initialListings?: Listing[];
  onListingSelect?: (listing: Listing) => void;
}

export function ListingsScreen({ initialListings, onListingSelect }: ListingsScreenProps) {
  // Screen logic here
  // No Next.js-specific imports (useRouter, etc.)
  // Use navigation abstraction instead
}
```

## Platform-Specific Features

For features that differ significantly between web and mobile:

1. **Create platform files**: `[Component].web.tsx` and `[Component].native.tsx`
2. **Use conditional imports** or platform detection
3. **Abstract platform APIs** (maps, camera, file system, etc.)

