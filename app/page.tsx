import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to welcome page as the landing page
  redirect('/welcome');
}
