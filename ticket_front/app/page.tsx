import { redirect } from 'next/navigation';

// Landing page: just redirect to /login (session is handled client-side)
export default function LandingPage() {
  redirect('/login');
}
