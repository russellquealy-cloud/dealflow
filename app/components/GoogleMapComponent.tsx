'use client';

import dynamic from 'next/dynamic';
import type { GoogleMapImplProps } from './GoogleMapImpl';

const MapImpl = dynamic(() => import('./GoogleMapImpl'), {
  ssr: false,
});

export type {
  Point,
  GoogleMapImplProps as GoogleMapComponentProps,
} from './GoogleMapImpl';

export default function GoogleMapComponent(props: GoogleMapImplProps) {
  return <MapImpl {...props} />;
}
