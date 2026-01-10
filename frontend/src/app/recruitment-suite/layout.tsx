/**
 * RECRUITMENT & ONBOARDING SUITE — Layout
 * Phase 7C.1, S5 Admin UI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruitment & Onboarding | WebWaka',
  description: 'Manage job postings, applicants, interviews, offers, and onboarding',
};

export default function RecruitmentSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
