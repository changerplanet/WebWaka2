/**
 * WebWaka Terms of Service Page
 * Platform: WebWaka by HandyLife Digital
 * Jurisdiction: Nigeria-first, globally scalable
 */

import Link from 'next/link'
import { Globe, FileText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — WebWaka Platform',
  description: 'WebWaka Terms of Service. Understand the terms governing your use of the WebWaka Platform operated by HandyLife Digital.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-gray-400">
            Last updated: January 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction and Acceptance</h2>
            <p className="text-gray-600 mb-4">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the WebWaka Platform 
              (&quot;Platform&quot;), operated by HandyLife Digital (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). WebWaka is a modular, 
              multi-tenant platform that enables organizations to manage their operations through configurable 
              capabilities and modules.
            </p>
            <p className="text-gray-600 mb-4">
              By accessing or using the Platform, you agree to be bound by these Terms. If you are using the 
              Platform on behalf of an organization, you represent that you have authority to bind that 
              organization to these Terms.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                <strong>Important:</strong> If you do not agree to these Terms, do not use the Platform. 
                Your continued use constitutes acceptance of these Terms and any updates.
              </p>
            </div>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <ul className="space-y-3 text-gray-600">
              <li><strong>&quot;Platform&quot;</strong> means the WebWaka software, applications, services, and related infrastructure provided by HandyLife Digital.</li>
              <li><strong>&quot;Tenant&quot;</strong> means an organization that subscribes to the Platform and configures it for their operations.</li>
              <li><strong>&quot;End User&quot;</strong> means any individual who accesses the Platform through a Tenant&apos;s configuration, including staff, operators, and customers.</li>
              <li><strong>&quot;Partner&quot;</strong> means an independent entity that resells, implements, or provides support for the Platform.</li>
              <li><strong>&quot;Tenant Data&quot;</strong> means all data uploaded, created, or processed by or on behalf of a Tenant through the Platform.</li>
              <li><strong>&quot;Modules&quot;</strong> or &quot;Capabilities&quot; means the configurable functional components of the Platform that Tenants can activate.</li>
              <li><strong>&quot;Subscription&quot;</strong> means the agreement under which a Tenant accesses the Platform and its Modules.</li>
            </ul>
          </section>

          {/* Platform Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Platform Description</h2>
            <p className="text-gray-600 mb-4">
              WebWaka is a modular platform that provides configurable capabilities across multiple industries 
              and use cases. The Platform operates on a multi-tenant architecture where:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Tenants select and activate the Modules they need</li>
              <li>Each Tenant&apos;s data is logically separated from other Tenants</li>
              <li>The Platform can operate offline and sync when connectivity is restored</li>
              <li>Configuration and customization are handled per Tenant</li>
            </ul>
            <p className="text-gray-600">
              We continuously develop and improve the Platform. We reserve the right to modify, update, or 
              discontinue features with reasonable notice, except where such changes would materially reduce 
              the functionality included in an active Subscription.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Account Creation</h3>
            <p className="text-gray-600 mb-4">
              To use the Platform, you must create an account by providing accurate and complete information. 
              You agree to update your information to keep it accurate.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Account Security</h3>
            <p className="text-gray-600 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all 
              activities that occur under your account. You must:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Use strong, unique passwords</li>
              <li>Protect your authentication credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Not share your account with unauthorized individuals</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Tenant Responsibility for End Users</h3>
            <p className="text-gray-600">
              Tenants are responsible for managing End User accounts within their configuration, including 
              setting appropriate access permissions, ensuring End Users comply with these Terms, and 
              deactivating access when appropriate.
            </p>
          </section>

          {/* Subscriptions and Payment */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscriptions and Payment</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Subscription Plans</h3>
            <p className="text-gray-600 mb-4">
              Access to the Platform requires a Subscription. Subscription plans, pricing, and included 
              Modules are described on our website or in separate order forms. We may offer free trials 
              or promotional pricing at our discretion.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Payment Terms</h3>
            <p className="text-gray-600 mb-4">
              Subscription fees are due in advance according to the billing cycle selected. Unless otherwise 
              stated, fees are non-refundable. We may change pricing with 30 days&apos; notice; changes apply at 
              the next renewal period.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Taxes</h3>
            <p className="text-gray-600 mb-4">
              Fees are exclusive of taxes. You are responsible for all applicable taxes, except for taxes 
              based on our income.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Suspension for Non-Payment</h3>
            <p className="text-gray-600">
              We may suspend access to the Platform if payment is overdue. We will provide notice before 
              suspension and restore access promptly upon payment.
            </p>
          </section>

          {/* Data Ownership */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Ownership and Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Tenant Data Ownership</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800">
                <strong>Tenants own their data.</strong> All Tenant Data remains the property of the Tenant. 
                We claim no ownership rights over Tenant Data.
              </p>
            </div>
            <p className="text-gray-600 mb-4">
              By using the Platform, Tenants grant us a limited license to host, store, process, and display 
              Tenant Data solely to provide the Platform services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Platform Intellectual Property</h3>
            <p className="text-gray-600 mb-4">
              We own all rights to the Platform, including its software, design, features, documentation, 
              and branding. Your Subscription grants you a limited, non-exclusive, non-transferable license 
              to use the Platform during your Subscription term.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Feedback</h3>
            <p className="text-gray-600">
              If you provide suggestions or feedback about the Platform, we may use it without obligation 
              to you. This does not affect your rights in your Tenant Data.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to the Platform or other accounts</li>
              <li>Interfere with or disrupt the Platform&apos;s operation</li>
              <li>Use the Platform for illegal, fraudulent, or abusive purposes</li>
              <li>Resell or redistribute the Platform without authorization</li>
              <li>Reverse engineer, decompile, or disassemble the Platform</li>
              <li>Remove or alter proprietary notices</li>
              <li>Use automated systems to access the Platform in violation of our policies</li>
            </ul>
            <p className="text-gray-600">
              We may investigate violations and take appropriate action, including suspending or terminating 
              access to the Platform.
            </p>
          </section>

          {/* Third Parties and Partners */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third Parties and Partners</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Partners</h3>
            <p className="text-gray-600 mb-4">
              Partners are <strong>independent entities</strong> and not employees, agents, or representatives 
              of HandyLife Digital. Any agreements between Tenants and Partners are separate from these Terms. 
              We are not responsible for Partner actions, representations, or services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Third-Party Services</h3>
            <p className="text-gray-600 mb-4">
              The Platform may integrate with third-party services. Your use of third-party services is 
              subject to their terms and policies. We are not responsible for third-party services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Links</h3>
            <p className="text-gray-600">
              The Platform may contain links to external websites. We do not endorse or control these sites 
              and are not responsible for their content.
            </p>
          </section>

          {/* Warranties and Disclaimers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Warranties and Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Our Commitments</h3>
            <p className="text-gray-600 mb-4">We commit to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Providing the Platform substantially as described</li>
              <li>Using commercially reasonable efforts to maintain availability</li>
              <li>Implementing appropriate security measures</li>
              <li>Providing support as specified in your Subscription</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 Disclaimer</h3>
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-sm">
                EXCEPT AS EXPRESSLY PROVIDED, THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT 
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS 
                FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE 
                UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-sm mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2">
                <li>WE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.</li>
                <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.</li>
                <li>THESE LIMITATIONS APPLY REGARDLESS OF THE THEORY OF LIABILITY.</li>
              </ul>
            </div>
            <p className="text-gray-600">
              Some jurisdictions do not allow certain limitations, so these may not fully apply to you.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-600 mb-4">
              You agree to indemnify and hold harmless HandyLife Digital and its officers, employees, and 
              agents from claims, damages, and expenses (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law or third-party rights</li>
              <li>Your Tenant Data or how you use it</li>
            </ul>
          </section>

          {/* Term and Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Term and Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Subscription Term</h3>
            <p className="text-gray-600 mb-4">
              Your Subscription begins on the effective date and continues for the term specified. Subscriptions 
              automatically renew unless cancelled before the renewal date.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Termination by You</h3>
            <p className="text-gray-600 mb-4">
              You may cancel your Subscription at any time through the Platform or by contacting us. 
              Cancellation takes effect at the end of the current billing period.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Termination by Us</h3>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your access immediately if you breach these Terms, fail to pay, 
              or if required by law. We may also discontinue the Platform with 90 days&apos; notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.4 Effect of Termination</h3>
            <p className="text-gray-600 mb-4">
              Upon termination:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Your right to use the Platform ends</li>
              <li>You may export your Tenant Data within 30 days</li>
              <li>After the export period, we may delete your Tenant Data</li>
              <li>Provisions that should survive (e.g., limitation of liability, indemnification) remain in effect</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Informal Resolution</h3>
            <p className="text-gray-600 mb-4">
              Before initiating formal proceedings, we encourage you to contact us to attempt to resolve 
              disputes informally.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Governing Law</h3>
            <p className="text-gray-600 mb-4">
              These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to 
              conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.3 Jurisdiction</h3>
            <p className="text-gray-600">
              Any disputes shall be resolved in the courts of Lagos State, Nigeria, unless otherwise agreed 
              or required by applicable law.
            </p>
          </section>

          {/* General Provisions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Entire Agreement</h3>
            <p className="text-gray-600 mb-4">
              These Terms, together with our Privacy Policy and any order forms, constitute the entire 
              agreement between you and HandyLife Digital regarding the Platform.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Amendments</h3>
            <p className="text-gray-600 mb-4">
              We may modify these Terms by posting updated Terms on the Platform. Material changes will be 
              communicated via email or Platform notification. Continued use after changes constitutes acceptance.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Waiver</h3>
            <p className="text-gray-600 mb-4">
              Our failure to enforce any provision does not waive our right to enforce it later.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.4 Severability</h3>
            <p className="text-gray-600 mb-4">
              If any provision is found unenforceable, the remaining provisions continue in effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.5 Assignment</h3>
            <p className="text-gray-600 mb-4">
              You may not assign these Terms without our consent. We may assign our rights and obligations 
              in connection with a merger, acquisition, or sale of assets.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.6 Force Majeure</h3>
            <p className="text-gray-600">
              Neither party is liable for failures caused by circumstances beyond reasonable control, 
              including natural disasters, war, terrorism, riots, government actions, or infrastructure failures.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 font-semibold mb-2">HandyLife Digital</p>
              <p className="text-gray-600">Email: <a href="mailto:legal@webwaka.com" className="text-green-600 hover:text-green-700">legal@webwaka.com</a></p>
              <p className="text-gray-600">General Inquiries: <a href="mailto:hello@webwaka.com" className="text-green-600 hover:text-green-700">hello@webwaka.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">
              Contact Us
            </Link>
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-green-400" />
            <span className="font-bold">WebWaka</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} WebWaka. Powered by HandyLife Digital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
