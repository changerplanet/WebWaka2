import { redirect } from 'next/navigation';

/**
 * LOGISTICS SUITE: Main Entry Point
 * Redirects to admin dashboard.
 */

export default function LogisticsSuitePage() {
  redirect('/logistics-suite/admin');
}
