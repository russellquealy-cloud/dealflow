import { redirect } from 'next/navigation';

// Redirect base /analytics to lead-conversion as the default
export default function AnalyticsPage() {
  redirect('/analytics/lead-conversion');
}

