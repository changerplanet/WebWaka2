/**
 * LEGAL PRACTICE SUITE — Layout
 * Phase 7B.1, S5 Admin UI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Practice Management | WebWaka',
  description: 'Manage legal matters, clients, billing, and deadlines',
};

export default function LegalPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
