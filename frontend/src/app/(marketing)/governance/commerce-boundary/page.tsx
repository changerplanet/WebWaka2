/**
 * Commerce Boundary Deep Dive
 * 
 * Explains FACTS ONLY architecture and why verticals don't touch money.
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Wallet, Shield, Database, FileCheck } from 'lucide-react'

export const metadata = {
  title: 'Commerce Boundary — WebWaka Governance',
  description: 'Understanding the Commerce Boundary: why verticals emit facts and Commerce handles money.',
}

const factsVsExecution = [
  {
    vertical: 'Education Suite',
    fact: 'Fee of ₦150,000 owed for Term 2',
    execution: 'Invoice generation, payment collection, receipt',
  },
  {
    vertical: 'Health Suite',
    fact: 'Consultation charge of ₦25,000',
    execution: 'Billing, HMO claim, payment reconciliation',
  },
  {
    vertical: 'Church Suite',
    fact: 'Tithe of ₦50,000 given',
    execution: 'Receipt, accounting journal, donor tracking',
  },
  {
    vertical: 'Logistics Suite',
    fact: 'Delivery fee of ₦3,500 for job',
    execution: 'Invoice, driver payout, commission calculation',
  },
]

export default function CommerceBoundaryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-slate-900 to-gray-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/governance" className="inline-flex items-center gap-2 text-purple-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </Link>
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
              <Wallet className="w-4 h-4" />
              Commerce Boundary
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Facts vs. Execution
            </h1>
            <p className="text-base text-gray-300">
              In WebWaka, industry verticals record what happened. Commerce Suite executes what needs to happen with money. This separation is not a limitation—it is architectural integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Core Concept */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is the Commerce Boundary?</h2>
              <p className="text-gray-600 mb-4">
                The Commerce Boundary is a fundamental architectural principle: <strong>verticals emit immutable facts, Commerce Suite handles financial execution.</strong>
              </p>
              <p className="text-gray-600 mb-4">
                When a school records that a fee is owed, it creates a <em>fee fact</em>. When a church records a tithe, it creates a <em>giving fact</em>. These facts are append-only and cannot be modified.
              </p>
              <p className="text-gray-600">
                Commerce Suite picks up these facts and handles invoicing, payment processing, wallet management, and accounting. This creates one clean financial layer that auditors can inspect.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-4">Boundary Enforcement</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">✕</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Verticals CANNOT:</p>
                    <p className="text-xs text-gray-600">Process payments, manage wallets, generate receipts, calculate VAT, touch accounting journals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Verticals CAN:</p>
                    <p className="text-xs text-gray-600">Emit fee facts, giving facts, expense facts, charge facts — all append-only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Table */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Facts vs. Execution Examples</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vertical</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fact (Emitted)</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Execution (Commerce)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {factsVsExecution.map((row) => (
                  <tr key={row.vertical}>
                    <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">{row.vertical}</td>
                    <td className="px-4 md:px-6 py-4 text-sm text-purple-600">{row.fact}</td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-600">{row.execution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why This Matters</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Audit Safety', desc: 'One financial layer to inspect. No hidden ledgers.' },
              { icon: Database, title: 'Data Integrity', desc: 'Facts are append-only. No modifications. No deletions.' },
              { icon: FileCheck, title: 'Compliance Ready', desc: 'Regulators see clear money flows.' },
              { icon: Wallet, title: 'Clean Architecture', desc: 'Separation of concerns enforced at platform level.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-gray-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">See It In Action</h2>
          <p className="text-purple-100 mb-6 text-sm">
            Experience how the Commerce Boundary works across our 14 verticals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/commerce-demo"
              className="w-full sm:w-auto px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              Explore Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/governance/audit-first"
              className="w-full sm:w-auto px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg transition-all"
            >
              Audit-First Design →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
