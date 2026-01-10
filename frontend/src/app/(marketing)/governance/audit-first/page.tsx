/**
 * Audit-First Design Deep Dive
 * 
 * Explains append-only architecture and cryptographic integrity.
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Database, Lock, FileCheck, Eye, Shield } from 'lucide-react'

export const metadata = {
  title: 'Audit-First Design — WebWaka Governance',
  description: 'Append-only records, cryptographic integrity, and immutable audit trails by design.',
}

const appendOnlyTables = [
  { table: 'Audit Logs', description: 'Every action logged. No deletions.', suites: 'All' },
  { table: 'Giving Facts', description: 'Tithes, offerings, donations. Immutable.', suites: 'Church' },
  { table: 'Expense Facts', description: 'Every expense recorded permanently.', suites: 'All' },
  { table: 'Evidence Bundles', description: 'Sealed with cryptographic hash.', suites: 'Governance' },
  { table: 'Regulator Access Logs', description: 'External inspections tracked.', suites: 'All' },
  { table: 'Governance Records', description: 'Board decisions immutable.', suites: 'Church, Civic' },
]

export default function AuditFirstPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-slate-900 to-gray-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/governance" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </Link>
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4">
              <Database className="w-4 h-4" />
              Audit-First Design
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Append-Only by Default
            </h1>
            <p className="text-base text-gray-300">
              Audit logs are append-only. Evidence bundles are cryptographically sealed. Financial facts are immutable. You cannot delete what must be auditable.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: 'Immutable Records',
                description: 'Once written, audit-critical records cannot be modified or deleted. This is enforced at the database and API layer.',
              },
              {
                icon: Shield,
                title: 'Cryptographic Integrity',
                description: 'Evidence bundles are sealed with SHA-256 hashes. Any tampering is detectable and flagged.',
              },
              {
                icon: Eye,
                title: 'Complete Visibility',
                description: 'Every action, every access, every change is logged. Auditors see everything.',
              },
            ].map((principle) => (
              <div key={principle.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <principle.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{principle.title}</h3>
                <p className="text-gray-600 text-sm">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Append-Only Tables */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Append-Only Tables</h2>
          <p className="text-gray-600 mb-8 text-sm">
            These tables enforce <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">INSERT</code> only. No <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">UPDATE</code>. No <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">DELETE</code>.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Table</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Suites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appendOnlyTables.map((row) => (
                  <tr key={row.table}>
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-gray-900">{row.table}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-gray-600">{row.description}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-blue-600">{row.suites}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Evidence Bundles */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Evidence Bundles</h2>
              <p className="text-gray-600 mb-4">
                For high-trust verticals like Church and Civic, evidence bundles provide cryptographic proof of integrity.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Each evidence item has an individual hash</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Bundle has computed composite hash (SHA-256)</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Seal operation makes bundle permanently immutable</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Integrity verification available on demand</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 text-white font-mono text-xs overflow-x-auto">
              <div className="text-slate-400 mb-2">{/* Evidence Bundle Structure */}Evidence Bundle Structure</div>
              <pre className="text-emerald-400">{
`{
  "bundleId": "EVB-2026-001",
  "status": "SEALED",
  "evidenceItems": [
    { "type": "RECEIPT", "hash": "a1b2c3..." },
    { "type": "INVOICE", "hash": "d4e5f6..." }
  ],
  "bundleHash": "SHA256(sorted(hashes))",
  "sealedAt": "2026-01-08T10:00:00Z",
  "verifyIntegrity": true
}`
              }</pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Audit-Ready Infrastructure</h2>
          <p className="text-blue-100 mb-6 text-sm">
            Build on infrastructure designed for scrutiny, not hidden from it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/governance/nigeria-first"
              className="w-full sm:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-all"
            >
              Nigeria-First Design →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
