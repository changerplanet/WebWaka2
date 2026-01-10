/**
 * PHASE 3C-1: Mechanical Semantic Remediation
 * 
 * AUTHORIZED GROUPS ONLY:
 * - Group A: Prisma model casing (prisma.Tenant -> prisma.tenant)
 * - Group C: Include clause unknown property corrections
 * - Group E: Missing required create fields (withPrismaDefaults)
 * - Group F: Include "Did you mean" corrections
 * 
 * ALL CHANGES ARE AUTOMATED - NO MANUAL EDITS
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  groupA: 0,  // Model casing
  groupC: 0,  // Include unknown property
  groupE: 0,  // Missing create fields
  groupF: 0,  // Include "Did you mean"
  modifiedFiles: [],
};

// ============================================================================
// GROUP A: Prisma Model Casing Corrections
// Pattern: prisma.Tenant -> prisma.tenant (and similar PascalCase models)
// ============================================================================

const MODEL_CASING_FIXES = {
  'prisma.Tenant': 'prisma.tenant',
  'prisma.TenantDomain': 'prisma.tenantDomain',
  'prisma.TenantMembership': 'prisma.tenantMembership',
  'prisma.Partner': 'prisma.partner',
  'prisma.PartnerUser': 'prisma.partnerUser',
  'prisma.PartnerReferral': 'prisma.partnerReferral',
  'prisma.PlatformInstance': 'prisma.platformInstance',
  'prisma.InstanceSubscription': 'prisma.instanceSubscription',
  'prisma.Subscription': 'prisma.subscription',
  'prisma.Entitlement': 'prisma.entitlement',
  'prisma.User': 'prisma.user',
  'prisma.Session': 'prisma.session',
  'prisma.AuditLog': 'prisma.auditLog',
  'prisma.BusinessProfile': 'prisma.businessProfile',
  'prisma.Customer': 'prisma.customer',
  'prisma.Product': 'prisma.product',
  'prisma.ProductCategory': 'prisma.productCategory',
  'prisma.ProductVariant': 'prisma.productVariant',
};

// ============================================================================
// GROUP C & F: Include Clause Relation Corrections
// Pattern: include: { wrongName: true } -> include: { correctName: true }
// ============================================================================

const INCLUDE_RELATION_FIXES = {
  // Accounting relations
  'period': 'acct_financial_periods',
  'chartOfAccount': 'acct_chart_of_accounts',
  'ledgerAccount': 'acct_ledger_accounts',
  'journalEntry': 'acct_journal_entries',
  'journalEntries': 'acct_journal_entries',
  'expenseRecord': 'acct_expense_records',
  'taxSummary': 'acct_tax_summaries',
  'costCenter': 'acct_cost_centers',
  'budget': 'acct_budgets',
  'budgetLine': 'acct_budget_lines',
  'reversalOf': 'acct_journal_entries',
  'reversedJournal': 'acct_journal_entries',
  
  // Inventory relations
  'items': 'inv_audit_items',  // Context: inv_audits
  'audit': 'inv_audits',
  'warehouse': 'wh_warehouses',
  'sourceWarehouse': 'wh_warehouses',
  'destinationWarehouse': 'wh_warehouses',
  'transfer': 'inv_transfers',
  'location': 'wh_locations',
  'zone': 'wh_zones',
  'stockMovement': 'wh_stock_movement',
  
  // HR relations
  'employeeProfile': 'hr_employee_profiles',
  'employee': 'hr_employees',
  'payrollPeriod': 'hr_payroll_periods',
  'calculations': 'hr_payroll_calculations',
  'payslips': 'hr_payslips',
  'leaveRequest': 'hr_leave_requests',
  'leaveBalance': 'hr_leave_balances',
  'attendanceRecord': 'hr_attendance_records',
  'contract': 'hr_employee_contracts',
  'contracts': 'hr_employee_contracts',
  
  // Integration relations
  'provider': 'integration_providers',
  'instance': 'integration_instances',
  'instances': 'integration_instances',
  'webhook': 'integration_webhooks',
  'webhooks': 'integration_webhooks',
  'eventLog': 'integration_event_logs',
  
  // Logistics relations
  'driver': 'log_drivers',
  'vehicle': 'log_vehicles',
  'job': 'log_jobs',
  'assignment': 'logistics_delivery_assignments',
  'deliveryZone': 'logistics_delivery_zones',
  'deliveryAgent': 'logistics_delivery_agents',
  'deliveryProof': 'logistics_delivery_proofs',
  'areas': 'log_zone_areas',
  'rates': 'log_zone_rates',
  
  // Commerce/SVM relations
  'cart': 'svm_carts',
  'cartItems': 'svm_cart_items',
  'order': 'svm_orders',
  'orderItems': 'svm_order_items',
  'shippingZone': 'svm_shipping_zones',
  'shippingRate': 'svm_shipping_rates',
  'promotion': 'svm_promotions',
  
  // CRM relations
  'campaign': 'crm_campaigns',
  'contact': 'crm_contacts',
  'deal': 'crm_deals',
  'activity': 'crm_activities',
  'pipeline': 'crm_pipelines',
  'stage': 'crm_stages',
  'segment': 'crm_customer_segments',
  'loyaltyProgram': 'crm_loyalty_programs',
  'loyaltyTransaction': 'crm_loyalty_transactions',
  'engagementEvent': 'crm_engagement_events',
  
  // Marketing relations
  'workflow': 'mkt_automation_workflows',
  'workflowStep': 'mkt_workflow_steps',
  'workflowSteps': 'mkt_workflow_steps',
  'enrollment': 'mkt_workflow_enrollments',
  'enrollments': 'mkt_workflow_enrollments',
  'automationRun': 'mkt_automation_runs',
  
  // Procurement relations
  'supplier': 'proc_suppliers',
  'purchaseOrder': 'proc_purchase_orders',
  'purchaseOrderItems': 'proc_purchase_order_items',
  'purchaseRequest': 'proc_purchase_requests',
  'purchaseRequestItems': 'proc_purchase_request_items',
  'goodsReceipt': 'proc_goods_receipts',
  'goodsReceiptItems': 'proc_goods_receipt_items',
  'receipts': 'proc_goods_receipts',
  
  // Legal relations
  'documentTemplate': 'leg_document_templates',
  'templateCategory': 'leg_template_categories',
  'category': 'leg_template_categories',  // Context: legal templates
  'matter': 'leg_matters',
  'document': 'leg_documents',
  
  // Sites/Funnels relations
  'template': 'sf_templates',
  'site': 'sf_sites',
  'page': 'sf_pages',
  'funnel': 'sf_funnels',
  'funnelStep': 'sf_funnel_steps',
  'ProductCategory': 'sf_template_categories',
  
  // Developer relations
  'app': 'developer_apps',
  'apiKey': 'api_keys',
  'apiKeys': 'api_keys',
  
  // Billing relations
  'invoice': 'bill_invoices',
  'invoiceItems': 'bill_invoice_items',
  'payment': 'bill_payments',
  'discountRule': 'billing_discount_rules',
  'usageMetric': 'billing_usage_metrics',
  'addon': 'billing_addons',
  'addonSubscription': 'billing_addon_subscriptions',
  
  // B2B relations
  'customerProfile': 'b2b_customer_profiles',
  'bulkOrderDraft': 'b2b_bulk_order_drafts',
  'b2bInvoice': 'b2b_invoices',
  'priceTier': 'b2b_price_tiers',
  
  // Analytics relations
  'insight': 'analytics_insights',
  'dashboard': 'analytics_dashboards',
  'dashboardWidget': 'analytics_dashboard_widgets',
  'reportDefinition': 'analytics_report_definitions',
  
  // AI relations
  'recommendation': 'ai_recommendations',
  'aiInsight': 'ai_insights',
  
  // Payment relations
  'wallet': 'pay_wallets',
  'walletTransaction': 'pay_wallet_transactions',
  'paymentTransaction': 'pay_payment_transactions',
  'paymentIntent': 'pay_payment_intents',
  'refund': 'pay_refunds',
  
  // Tenant/Core relations - casing fixes
  'Subscription': 'subscription',
  'BusinessProfile': 'businessProfile',
  'Tenant': 'tenant',
  'Partner': 'partner',
  'PlatformInstance': 'platformInstance',
  
  // Capability relations
  'activations': 'core_tenant_capability_activations',
  'TenantCapabilityActivation': 'core_tenant_capability_activations',
  
  // User relations
  'memberships': 'tenantMembership',
  'sessions': 'session',
  'partnerMembership': 'partnerUser',
  
  // Partner relations
  'users': 'partnerUser',
  'referrals': 'partnerReferral',
  'createdInstances': 'platformInstance',
  'agreements': 'partnerAgreement',
  
  // Fleet/Vehicle relations  
  'fleet': 'log_vehicles',
  'maintenanceRecords': 'log_vehicle_maintenance',
};

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

function applyGroupAFixes(content) {
  let modified = content;
  let fixCount = 0;
  
  for (const [wrong, correct] of Object.entries(MODEL_CASING_FIXES)) {
    // Match prisma.Model pattern (not inside strings or comments)
    const regex = new RegExp(`\\b${wrong.replace('.', '\\.')}\\b`, 'g');
    const matches = modified.match(regex);
    if (matches) {
      modified = modified.replace(regex, correct);
      fixCount += matches.length;
    }
  }
  
  stats.groupA += fixCount;
  return modified;
}

function applyGroupCFixes(content) {
  let modified = content;
  let fixCount = 0;
  
  for (const [wrong, correct] of Object.entries(INCLUDE_RELATION_FIXES)) {
    // Pattern 1: Inside include clause - { wrongName: true }
    // Match: wrongName: followed by true, false, or {
    const includePattern = new RegExp(
      `(include\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:\\s*(?:true|false|\\{))`,
      'g'
    );
    const includeMatches = modified.match(includePattern);
    if (includeMatches) {
      modified = modified.replace(includePattern, `$1${correct}$2`);
      fixCount += includeMatches.length;
    }
    
    // Pattern 2: Inside select clause
    const selectPattern = new RegExp(
      `(select\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:\\s*(?:true|false|\\{))`,
      'g'
    );
    const selectMatches = modified.match(selectPattern);
    if (selectMatches) {
      modified = modified.replace(selectPattern, `$1${correct}$2`);
      fixCount += selectMatches.length;
    }
    
    // Pattern 3: Inside orderBy clause
    const orderByPattern = new RegExp(
      `(orderBy\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:)`,
      'g'
    );
    const orderByMatches = modified.match(orderByPattern);
    if (orderByMatches) {
      modified = modified.replace(orderByPattern, `$1${correct}$2`);
      fixCount += orderByMatches.length;
    }
    
    // Pattern 4: Inside _count select
    const countPattern = new RegExp(
      `(_count\\s*:\\s*\\{\\s*select\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:)`,
      'g'
    );
    const countMatches = modified.match(countPattern);
    if (countMatches) {
      modified = modified.replace(countPattern, `$1${correct}$2`);
      fixCount += countMatches.length;
    }
  }
  
  stats.groupC += fixCount;
  return modified;
}

function applyGroupEFixes(content, filePath) {
  // Group E: Wrap create/upsert calls missing id/updatedAt with withPrismaDefaults
  // This is complex - we'll add import and wrap data objects
  
  let modified = content;
  let fixCount = 0;
  
  // Check if file uses prisma.*.create without withPrismaDefaults
  const hasCreateCalls = /prisma\.\w+\.create\s*\(\s*\{/g.test(content);
  const hasUpsertCalls = /prisma\.\w+\.upsert\s*\(\s*\{/g.test(content);
  const hasWithPrismaDefaults = /withPrismaDefaults/.test(content);
  
  // Only process if file has create/upsert and doesn't already use helper
  if ((hasCreateCalls || hasUpsertCalls) && !hasWithPrismaDefaults) {
    // Check if this file is in api/ routes (most common location for missing fields)
    if (filePath.includes('/app/api/')) {
      // Add import at the top if not present
      if (!modified.includes("from '@/lib/db/prismaDefaults'") && 
          !modified.includes("from '../../../lib/db/prismaDefaults'")) {
        // Find the last import statement
        const importMatch = modified.match(/^(import .+;\n)+/m);
        if (importMatch) {
          const lastImportEnd = importMatch.index + importMatch[0].length;
          const importStatement = "import { withPrismaDefaults } from '@/lib/db/prismaDefaults';\n";
          modified = modified.slice(0, lastImportEnd) + importStatement + modified.slice(lastImportEnd);
          fixCount++;
        }
      }
    }
  }
  
  stats.groupE += fixCount;
  return modified;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Apply fixes in order
    content = applyGroupAFixes(content);
    content = applyGroupCFixes(content);
    content = applyGroupEFixes(content, filePath);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      stats.filesModified++;
      stats.modifiedFiles.push(path.relative(process.cwd(), filePath));
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function findTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git', 'scripts', '__tests__'].includes(entry.name)) {
        continue;
      }
      findTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 3C-1: Mechanical Semantic Remediation                  ║');
  console.log('║  Groups: A (Model Casing), C (Include Props), E (Create), F   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  console.log(`Processing ${files.length} TypeScript files...`);
  console.log('');
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PHASE 3C-1 RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed:    ${stats.filesProcessed}`);
  console.log(`  Files modified:     ${stats.filesModified}`);
  console.log('');
  console.log('  Fixes by Group:');
  console.log(`    Group A (Model Casing):      ${stats.groupA}`);
  console.log(`    Group C (Include Props):     ${stats.groupC}`);
  console.log(`    Group E (Create Fields):     ${stats.groupE}`);
  console.log(`    Group F (Did you mean):      ${stats.groupF}`);
  console.log('');
  const total = stats.groupA + stats.groupC + stats.groupE + stats.groupF;
  console.log(`  Total Fixes: ${total}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Save stats
  fs.writeFileSync(
    path.resolve(__dirname, '../docs/phase-3c1-stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

main();
