import { redirect } from 'next/navigation';

/**
 * HOSPITALITY SUITE: Main Entry Point
 * 
 * Redirects to admin dashboard by default.
 */

export default function HospitalityPage() {
  redirect('/hospitality/admin');
}
