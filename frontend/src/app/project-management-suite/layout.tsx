/**
 * PROJECT MANAGEMENT SUITE — Layout
 * Phase 7C.2, S5 Admin UI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Management | WebWaka',
  description: 'Manage projects, milestones, tasks, team, and budgets',
};

export default function ProjectManagementSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
