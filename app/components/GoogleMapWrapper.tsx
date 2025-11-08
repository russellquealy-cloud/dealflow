'use client';

import ErrorBoundary from './ErrorBoundary';
import GoogleMapComponent, {
  type GoogleMapComponentProps,
} from './GoogleMapComponent';

export default function GoogleMapWrapper(props: GoogleMapComponentProps) {
  return (
    <ErrorBoundary>
      <GoogleMapComponent {...props} />
    </ErrorBoundary>
  );
}
