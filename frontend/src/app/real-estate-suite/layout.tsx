/**
 * REAL ESTATE MANAGEMENT — Layout
 * Phase 7A, S4 Admin UI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real Estate Management | WebWaka',
  description: 'Manage properties, tenants, and rent collection',
};

export default function RealEstateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
