'use client'

/**
 * Audit Log Export - Static Bundles Documentation
 * 
 * Documentation page explaining audit log export format and process.
 * NO LIVE FEEDS. NO UI-BASED GENERATION. NO STREAMING.
 * 
 * @route /audit/export
 * @phase P4 - Audit Log Export
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileArchive,
  Shield,
  Lock,
  FileText,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Ban,
  Eye,
  Database,
  Layers,
  FileJson,
} from 'lucide-react'

// =============================================================================
// ACCESS GATE
// =============================================================================

function AccessGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const hasAccess = searchParams.get('demo') === 'true' || searchParams.get('regulator') === 'true'
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-slate-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Access Restricted
            </h1>
            <p className="text-slate-600 mb-6">
              Audit export documentation is available to authorized parties only.
              Access requires invitation from WebWaka governance team.
            </p>
            <p className="text-xs text-slate-400">
              WebWaka Audit Export • Authorized Access Only
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// =============================================================================
// SECTION COMPONENT
// =============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

// =============================================================================
// MAIN CONTENT
// =============================================================================

function AuditExportContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <FileArchive className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Audit Log Export</h1>
              <p className="text-slate-300">Static evidence bundles for verification</p>
            </div>
          </div>
          
          {/* Purpose Banner */}
          <div className="bg-white/10 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Evidence Bundle for Verification</div>
                <p className="text-sm text-slate-300 mt-1">
                  Audit log exports are static, point-in-time evidence bundles. They are not 
                  monitoring tools, surveillance systems, or enforcement mechanisms. Each bundle 
                  is immutable, integrity-verified, and scoped to a specific verification purpose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Section 1: Export Format */}
        <SectionCard icon={FileJson} title="1. Export Bundle Format">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Each audit export is delivered as a static bundle containing structured data 
              and verification artifacts. The format is designed for auditability, not automation.
            </p>
            
            {/* Bundle Structure */}
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
              <div className="text-slate-400 mb-2"># Audit Export Bundle Structure</div>
              <div className="text-green-400">
                <div>audit-export-[tenant]-[date]/</div>
                <div className="pl-4 text-slate-300">├── README.md</div>
                <div className="pl-4 text-slate-300">├── manifest.json</div>
                <div className="pl-4 text-slate-300">├── metadata/</div>
                <div className="pl-8 text-slate-400">│   ├── scope.json</div>
                <div className="pl-8 text-slate-400">│   ├── governance.json</div>
                <div className="pl-8 text-slate-400">│   └── integrity.json</div>
                <div className="pl-4 text-slate-300">├── audit-logs/</div>
                <div className="pl-8 text-slate-400">│   ├── entries.json</div>
                <div className="pl-8 text-slate-400">│   └── entries.csv</div>
                <div className="pl-4 text-slate-300">└── verification/</div>
                <div className="pl-8 text-slate-400">    ├── sha256-manifest.txt</div>
                <div className="pl-8 text-slate-400">    └── signature.sig</div>
              </div>
            </div>
            
            {/* File Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">README.md</span>
                </div>
                <p className="text-xs text-slate-600">
                  Human-readable explanation of bundle contents, scope, and intended use.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">manifest.json</span>
                </div>
                <p className="text-xs text-slate-600">
                  Machine-readable index of all files with sizes and checksums.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">entries.json</span>
                </div>
                <p className="text-xs text-slate-600">
                  Audit log entries in structured JSON format for programmatic analysis.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">sha256-manifest.txt</span>
                </div>
                <p className="text-xs text-slate-600">
                  Cryptographic hashes of all files for integrity verification.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 2: Bundle Contents */}
        <SectionCard icon={Layers} title="2. Bundle Contents">
          <div className="space-y-6">
            
            {/* Metadata */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Metadata (scope.json)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-slate-300">{
`{
  "export_id": "exp_2026010912345",
  "generated_at": "2026-01-09T12:00:00Z",
  "scope": {
    "tenant_id": "tnt_demo_retail_store",
    "tenant_name": "Demo Retail Store",
    "domain": "demo-retail.webwaka.com",
    "suite": "commerce",
    "time_range": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-09T00:00:00Z"
    }
  },
  "requested_by": "Regulatory Authority",
  "purpose": "Compliance verification",
  "entries_count": 1247
}`
                }</pre>
              </div>
            </div>
            
            {/* Governance Assertions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Governance Assertions (governance.json)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-slate-300">{
`{
  "platform_version": "2.0.0",
  "governance_model": "v2-FROZEN",
  "assertions": {
    "business_logic_immutable": true,
    "commerce_boundary_enforced": true,
    "append_only_discipline": true,
    "tenant_isolation_active": true,
    "audit_logging_enabled": true
  },
  "vertical": "commerce",
  "vertical_status": "v2-FROZEN",
  "freeze_date": "2026-01-01T00:00:00Z"
}`
                }</pre>
              </div>
            </div>
            
            {/* Audit Entries Sample */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Audit Entries (entries.json - sample)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-slate-300">{
`{
  "entries": [
    {
      "id": "aud_001",
      "timestamp": "2026-01-09T10:30:00Z",
      "actor_id": "usr_abc123",
      "actor_role": "STAFF",
      "action": "transaction.create",
      "resource_type": "transaction",
      "resource_id": "txn_xyz789",
      "metadata": {
        "amount": 15000,
        "currency": "NGN",
        "payment_method": "cash"
      },
      "ip_address": "[REDACTED]",
      "session_id": "ses_def456"
    }
  ],
  "pagination": {
    "total": 1247,
    "page": 1,
    "per_page": 1000
  }
}`
                }</pre>
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 3: Integrity Verification */}
        <SectionCard icon={Hash} title="3. Integrity Verification">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Each export bundle includes cryptographic verification to ensure data integrity 
              and detect any tampering after generation.
            </p>
            
            {/* Integrity File */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Integrity Manifest (integrity.json)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-slate-300">{
`{
  "algorithm": "SHA-256",
  "generated_at": "2026-01-09T12:00:00Z",
  "bundle_hash": "a1b2c3d4e5f6...",
  "files": {
    "metadata/scope.json": "sha256:abc123...",
    "metadata/governance.json": "sha256:def456...",
    "audit-logs/entries.json": "sha256:ghi789...",
    "audit-logs/entries.csv": "sha256:jkl012..."
  },
  "verification_instructions": "See README.md"
}`
                }</pre>
              </div>
            </div>
            
            {/* Verification Steps */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">How to Verify</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">1</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Download Complete Bundle</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Ensure all files are present as listed in manifest.json
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">2</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Verify File Hashes</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Run <code className="bg-slate-200 px-1 rounded">sha256sum</code> on each file and compare to sha256-manifest.txt
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">3</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Confirm Bundle Hash</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Verify bundle_hash in integrity.json matches your computed hash
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">4</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Review Audit Entries</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Analyze entries.json or entries.csv for the specific verification purpose
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Integrity verification ensures the bundle has not been modified since generation. 
                Any hash mismatch indicates potential tampering and should be reported immediately.
              </p>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 4: Request Process */}
        <SectionCard icon={Download} title="4. Request Process">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Audit log exports are generated upon formal request through governance channels. 
              There is no self-service export capability.
            </p>
            
            {/* Who Can Request */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Who CAN Request
                </h4>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Authorized regulatory bodies</li>
                  <li>• Licensed auditors with formal engagement</li>
                  <li>• WebWaka governance team (internal)</li>
                  <li>• Tenant owners (for their own data only)</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-3 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Who CANNOT Request
                </h4>
                <ul className="text-xs text-red-800 space-y-1">
                  <li>• Partners (for tenant data)</li>
                  <li>• General users</li>
                  <li>• Automated systems</li>
                  <li>• Third parties without authorization</li>
                </ul>
              </div>
            </div>
            
            {/* Request Steps */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Request Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">1</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Submit Formal Request</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Contact WebWaka governance team through official channels with:
                      requesting authority, purpose, scope (tenant, time range), legal basis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">2</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Governance Review</div>
                    <p className="text-xs text-slate-600 mt-1">
                      WebWaka reviews request validity, verifies authorization, and approves scope
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">3</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Bundle Generation</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Static bundle is generated with requested scope, integrity verification applied
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">4</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Secure Delivery</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Bundle delivered through secure channel, access logged, tenant notified (if applicable)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* What This Is NOT */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-900">What Audit Export Is NOT</div>
              <p className="text-sm text-amber-700 mt-2 mb-4">
                This system provides static evidence bundles only. It is explicitly NOT:
              </p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• A real-time monitoring or surveillance system</li>
                <li>• A live data feed or streaming API</li>
                <li>• A self-service export tool for partners or tenants</li>
                <li>• An enforcement or suspension mechanism</li>
                <li>• A continuous audit integration</li>
                <li>• A substitute for formal regulatory engagement</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Governance Notice */}
        <div className="bg-slate-100 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Governance Notice</h3>
              <p className="text-sm text-slate-600">
                Audit log exports are governed by WebWaka's data governance policies. 
                All export requests are logged, all access is tracked, and all bundles 
                include integrity verification. This ensures accountability and prevents 
                unauthorized access to tenant data.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-700">
                  <Lock className="w-3 h-3" /> Access Controlled
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-700">
                  <Eye className="w-3 h-3" /> Fully Logged
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-700">
                  <Hash className="w-3 h-3" /> Integrity Verified
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-700">
                  <Clock className="w-3 h-3" /> Point-in-Time
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            WebWaka Audit Log Export • Static Evidence Bundles • Not Monitoring, Not Surveillance, Not Enforcement
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function AuditExportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <AccessGate>
        <AuditExportContent />
      </AccessGate>
    </Suspense>
  )
}
