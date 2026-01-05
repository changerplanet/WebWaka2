/**
 * WebWaka Privacy Policy Page
 * Platform: WebWaka by HandyLife Digital
 * Jurisdiction: Nigeria-first, globally scalable
 */

import Link from 'next/link'
import { Globe, Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — WebWaka Platform',
  description: 'WebWaka Privacy Policy. Learn how we collect, use, and protect your data on the WebWaka Platform operated by HandyLife Digital.',
}

export default function PrivacyPolicyPage() {
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
            <Shield className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              This Privacy Policy explains how HandyLife Digital (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, 
              shares, and protects information through the WebWaka Platform (&quot;Platform&quot;). WebWaka is a modular, 
              multi-tenant platform that enables organizations to manage their operations across various industries.
            </p>
            <p className="text-gray-600 mb-4">
              By using the Platform, you agree to the collection and use of information in accordance with this policy. 
              This policy applies to all users of the Platform, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Tenants:</strong> Organizations that subscribe to and configure the Platform for their operations</li>
              <li><strong>End Users:</strong> Individuals who access the Platform through a Tenant&apos;s configuration (e.g., staff, operators, customers)</li>
              <li><strong>Partners:</strong> Independent entities that resell, implement, or support the Platform</li>
            </ul>
          </section>

          {/* Data Controller and Processor */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Controller and Processor Roles</h2>
            <p className="text-gray-600 mb-4">
              The WebWaka Platform operates under a shared responsibility model:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">HandyLife Digital as Platform Provider</h3>
              <p className="text-gray-600">
                We act as the <strong>data processor</strong> for Tenant Data. We process data on behalf of Tenants 
                according to their instructions and our service agreement. We are the <strong>data controller</strong> 
                for Platform Account Data (information you provide directly to us to create and manage your account).
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tenants as Data Controllers</h3>
              <p className="text-gray-600">
                Tenants are the <strong>data controllers</strong> for the data they collect and store on the Platform. 
                Tenants determine what data to collect, how to use it, and are responsible for ensuring their use 
                complies with applicable laws and their own privacy policies.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Partners as Independent Entities</h3>
              <p className="text-gray-600">
                Partners operate independently and are responsible for their own data practices. Any data shared 
                with Partners for implementation or support purposes is governed by separate agreements between 
                Tenants and Partners.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Platform Account Data</h3>
            <p className="text-gray-600 mb-4">
              When you create an account or interact with our Platform directly, we may collect:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Contact information (name, email address, phone number)</li>
              <li>Account credentials (encrypted passwords, authentication tokens)</li>
              <li>Organization information (business name, address, industry type)</li>
              <li>Billing information (payment method details, billing address)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Tenant Data</h3>
            <p className="text-gray-600 mb-4">
              Tenants may upload, create, or collect various types of data through the Platform based on their 
              configured modules and use cases. This may include but is not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Operational records and transaction data</li>
              <li>Customer or member information</li>
              <li>Staff and personnel records</li>
              <li>Financial and accounting data</li>
              <li>Inventory and resource data</li>
              <li>Communications and correspondence</li>
            </ul>
            <p className="text-gray-600 mb-4">
              <strong>Important:</strong> The specific types of Tenant Data collected depend entirely on how the 
              Tenant configures and uses the Platform. Tenants are responsible for ensuring they have appropriate 
              consent and legal basis to collect such data.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Technical and Usage Data</h3>
            <p className="text-gray-600 mb-4">
              We automatically collect certain technical information when you use the Platform:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Log data (IP address, access times, pages viewed, actions taken)</li>
              <li>Performance data (error logs, load times, feature usage)</li>
              <li>Location data (general geographic location based on IP address)</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Platform Account Data</h3>
            <p className="text-gray-600 mb-4">We use Platform Account Data to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Create and manage your account</li>
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process payments and billing</li>
              <li>Communicate with you about your account, updates, and support</li>
              <li>Enforce our terms and protect against fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Tenant Data</h3>
            <p className="text-gray-600 mb-4">We process Tenant Data solely to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Provide the Platform services as configured by the Tenant</li>
              <li>Store and retrieve data as requested by the Tenant</li>
              <li>Enable Platform functionality and features</li>
              <li>Provide technical support when requested</li>
              <li>Maintain security and integrity of the Platform</li>
            </ul>
            <p className="text-gray-600 mb-4">
              We do <strong>not</strong> use Tenant Data for our own marketing purposes, sell it to third parties, 
              or access it except as necessary to provide the service or as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Technical and Usage Data</h3>
            <p className="text-gray-600 mb-4">We use technical data to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Monitor and improve Platform performance</li>
              <li>Identify and fix technical issues</li>
              <li>Analyze usage patterns to improve features</li>
              <li>Ensure security and prevent abuse</li>
              <li>Generate aggregated, anonymized analytics</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 mb-4">We may share information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              We engage trusted third-party service providers to help operate the Platform (e.g., cloud hosting, 
              payment processing, email delivery). These providers are contractually obligated to protect your 
              data and use it only for the services they provide to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Partners</h3>
            <p className="text-gray-600 mb-4">
              With Tenant consent, we may share necessary information with Partners who are providing implementation, 
              support, or other services to the Tenant. Partners operate under their own agreements and privacy policies.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Legal Requirements</h3>
            <p className="text-gray-600 mb-4">
              We may disclose information if required by law, regulation, legal process, or governmental request, 
              or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Business Transfers</h3>
            <p className="text-gray-600 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as 
              part of that transaction. We will notify affected users of any change in ownership or control.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and audit logging</li>
              <li>Offline-capable architecture that protects data during connectivity issues</li>
            </ul>
            <p className="text-gray-600">
              While we strive to protect your data, no method of transmission or storage is 100% secure. 
              We encourage you to use strong passwords and protect your account credentials.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              <strong>Platform Account Data:</strong> We retain your account information for as long as your 
              account is active. Upon account termination, we will delete or anonymize your data within 90 days, 
              except where retention is required by law.
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Tenant Data:</strong> Tenants control the retention of their data. Tenants may delete 
              their data at any time through the Platform. Upon subscription termination, we provide Tenants 
              a reasonable period to export their data before deletion.
            </p>
            <p className="text-gray-600">
              <strong>Technical Data:</strong> Log and usage data is typically retained for up to 12 months 
              for operational purposes, after which it is deleted or anonymized.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 mb-4">
              Depending on your location and applicable law, you may have rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="text-gray-600 mb-4">
              <strong>For End Users:</strong> If you are an end user of a Tenant&apos;s configuration, please 
              direct your requests to the Tenant. The Tenant is the data controller for your information.
            </p>
            <p className="text-gray-600">
              To exercise your rights regarding Platform Account Data, contact us at{' '}
              <a href="mailto:privacy@webwaka.com" className="text-green-600 hover:text-green-700">
                privacy@webwaka.com
              </a>.
            </p>
          </section>

          {/* Nigeria Data Protection */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Nigeria Data Protection</h2>
            <p className="text-gray-600 mb-4">
              We are committed to complying with the Nigeria Data Protection Regulation (NDPR) and the 
              Nigeria Data Protection Act (NDPA). This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Processing personal data lawfully, fairly, and transparently</li>
              <li>Collecting data for specified, explicit, and legitimate purposes</li>
              <li>Ensuring data is adequate, relevant, and limited to what is necessary</li>
              <li>Keeping data accurate and up to date</li>
              <li>Implementing appropriate security measures</li>
              <li>Respecting data subject rights</li>
            </ul>
            <p className="text-gray-600">
              For inquiries related to data protection in Nigeria, contact our Data Protection Officer at{' '}
              <a href="mailto:dpo@webwaka.com" className="text-green-600 hover:text-green-700">
                dpo@webwaka.com
              </a>.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-600 mb-4">
              Your data may be processed in countries other than your country of residence. We ensure appropriate 
              safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Using service providers with adequate data protection standards</li>
              <li>Implementing contractual protections for cross-border transfers</li>
              <li>Complying with applicable data transfer regulations</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-gray-600">
              The Platform is not directed at children under 18. We do not knowingly collect personal information 
              from children. Tenants who use the Platform in contexts involving minors (e.g., educational institutions) 
              are responsible for ensuring appropriate consent and compliance with applicable child protection laws.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of material changes by 
              posting the updated policy on this page and updating the &quot;Last updated&quot; date. For significant 
              changes, we may provide additional notice via email or Platform notification. Your continued use 
              of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 font-semibold mb-2">HandyLife Digital</p>
              <p className="text-gray-600">Email: <a href="mailto:privacy@webwaka.com" className="text-green-600 hover:text-green-700">privacy@webwaka.com</a></p>
              <p className="text-gray-600">Data Protection Officer: <a href="mailto:dpo@webwaka.com" className="text-green-600 hover:text-green-700">dpo@webwaka.com</a></p>
              <p className="text-gray-600">General Inquiries: <a href="mailto:hello@webwaka.com" className="text-green-600 hover:text-green-700">hello@webwaka.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/terms" className="text-green-600 hover:text-green-700 font-medium">
              Terms of Service
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
