/**
 * Partner Activation Hub
 * 
 * P2-C Partner Activation
 * 
 * PURPOSE: Enable serious, governance-aligned partners to understand
 * where they can build, where they cannot interfere, and how to onboard
 * without governance risk.
 * 
 * This is activation, not hype.
 */

import Link from 'next/link'
import { 
  ArrowRight, Shield, Lock, CheckCircle, XCircle,
  Users, Building2, Briefcase, BookOpen, AlertTriangle,
  Target, Layers, Zap
} from 'lucide-react'

export const metadata = {
  title: 'Partner Activation — WebWaka Platform',
  description: 'Understand where you can build, where you cannot interfere, and how to activate as a WebWaka Partner.',
}

const whoShouldPartner = [
  {
    title: 'Implementation Partners',
    description: 'You configure, deploy, and support WebWaka platforms for clients in specific markets.',
    fit: true,
  },
  {
    title: 'Sector Specialists',
    description: 'You have deep expertise in Education, Health, Church, or other verticals and want to serve that market.',
    fit: true,
  },
  {
    title: 'Technology Partners',
    description: 'You provide complementary services (payments, infrastructure, analytics) that integrate via defined APIs.',
    fit: true,
  },
  {
    title: 'Advisory Partners',
    description: 'You advise organizations on digital transformation and want to recommend governance-safe infrastructure.',
    fit: true,
  },
]

const whoShouldNot = [
  'You want to build your own features on top of WebWaka',
  'You expect to modify v2-FROZEN suite behavior',
  'You want to bypass Commerce Boundary for direct payments',
  'You expect revenue sharing or commission structures',
  'You want to white-label and remove WebWaka governance',
  'You expect "partner certification" that implies endorsement',
]

const maturityExpectations = [
  {
    level: 'Technical Understanding',
    requirement: 'You understand API integration, multi-tenant architecture, and can read technical documentation.',
  },
  {
    level: 'Governance Alignment',
    requirement: 'You accept that FREEZE, Commerce Boundary, and safeguards are non-negotiable.',
  },
  {
    level: 'Client Relationship',
    requirement: 'You will own the client relationship, provide support, and handle first-line inquiries.',
  },
  {
    level: 'Honest Representation',
    requirement: 'You will represent WebWaka accurately, without over-promising or misrepresenting capabilities.',
  },
]

const activationPath = [
  {
    step: 1,
    name: 'Understand',
    description: 'Read governance documentation, explore demos, understand boundaries.',
    action: 'Review /governance and /suites',
  },
  {
    step: 2,
    name: 'Align',
    description: 'Complete self-assessment checklist. Confirm governance alignment.',
    action: 'Complete checklist below',
  },
  {
    step: 3,
    name: 'Build',
    description: 'Identify your target market, select suites, plan your service offering.',
    action: 'Review partner playbooks',
  },
  {
    step: 4,
    name: 'Validate',
    description: 'Submit partner application for review. Demonstrate alignment.',
    action: 'Apply via /partners/get-started',
  },
]

const alignmentChecklist = [
  'I have read the Governance Overview (/governance)',
  'I understand what v2-FROZEN means and accept it',
  'I understand Commerce Boundary and will not attempt to bypass it',
  'I will not claim capabilities that are not implemented',
  'I will use only approved language when describing WebWaka',
  'I accept that Partners cannot modify core platform behavior',
  'I will provide honest representation to clients',
  'I understand that "Partner" does not imply certification or endorsement',
]

export default function PartnerActivatePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-slate-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              Partner Activation
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Activation, Not Hype
            </h1>

            <p className="text-lg text-slate-300 mb-6">
              WebWaka Partners are serious implementers who understand governance boundaries. This page helps you determine if partnership is right for you—and how to activate correctly.
            </p>

            <p className="text-slate-400 mb-8">
              Read this entire page before applying. Partnership requires governance alignment.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link 
                href="#checklist"
                className="px-5 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Self-Assessment Checklist
              </Link>
              <Link 
                href="/partners/playbooks"
                className="px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Partner Playbooks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 text-sm">
              <strong>This is not a quick signup.</strong> Partnership requires understanding governance and accepting boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Who Should Partner */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Should Partner */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Who Should Partner
              </h2>
              <div className="space-y-4">
                {whoShouldPartner.map((item) => (
                  <div key={item.title} className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Should NOT Partner */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Who Should NOT Partner
              </h2>
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <ul className="space-y-3">
                  {whoShouldNot.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maturity Expectations */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Partner Maturity Expectations</h2>
          <p className="text-gray-600 mb-8">
            WebWaka Partners are expected to meet these baseline requirements.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {maturityExpectations.map((item) => (
              <div key={item.level} className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.level}</h3>
                <p className="text-sm text-gray-600">{item.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activation Path */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Activation Path</h2>
          <p className="text-gray-600 mb-8">
            Follow this sequence to activate as a governance-aligned partner.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activationPath.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-full">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <p className="text-xs text-emerald-600 font-medium">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Assessment Checklist */}
      <section id="checklist" className="py-12 md:py-16 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Shield className="w-10 h-10 text-emerald-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Governance Alignment Checklist</h2>
            <p className="text-emerald-100">
              Before applying, confirm you can check every box honestly.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8">
            <div className="space-y-4">
              {alignmentChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-5 h-5 rounded border-2 border-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-gray-600 mb-4">
                If you can honestly check all boxes, you may be ready to apply.
              </p>
              <Link 
                href="/partners/get-started"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all"
              >
                Proceed to Application
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Partner Resources</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/partners/playbooks" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <BookOpen className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Partner Playbooks</h3>
              <p className="text-sm text-gray-600">Role-specific guidance</p>
            </Link>
            <Link href="/partners/extension-map" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Layers className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Extension Map</h3>
              <p className="text-sm text-gray-600">Where you can build</p>
            </Link>
            <Link href="/partners/language-guide" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Shield className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Language Guide</h3>
              <p className="text-sm text-gray-600">How to describe WebWaka</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
