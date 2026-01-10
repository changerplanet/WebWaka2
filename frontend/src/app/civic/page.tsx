import { redirect } from 'next/navigation';

/**
 * CIVIC SUITE: Main Entry Point
 * 
 * Redirects to admin dashboard by default.
 */

export default function CivicPage() {
  redirect('/civic/admin');
}
