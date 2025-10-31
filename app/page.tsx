// Redirect root to welcome page
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/welcome');
}
