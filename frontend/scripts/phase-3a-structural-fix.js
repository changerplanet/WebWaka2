/**
 * PHASE 3A: TypeScript Structural Remediation
 * 
 * Now that syntax errors are fixed, we can apply structural fixes for:
 * - Class A: Include Relation Casing (TS2353)
 * - Class B/E: Property/Model Name Mismatches (TS2551, TS2561)
 * - Class D: Implicit Any (TS7006) - already fixed via syntax fixes
 * 
 * PRIMARY FIX: Prisma model name corrections (camelCase -> snake_case)
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  modelNameFixes: 0,
  includeRelationFixes: 0,
  propertyAccessFixes: 0,
  modifiedFiles: [],
};

// ============================================================================
// PRISMA MODEL NAME CORRECTIONS
// These fix TS2551 errors like: Property 'svmCart' does not exist... Did you mean 'svm_carts'?
// ============================================================================

const PRISMA_MODEL_CORRECTIONS = {
  // Commerce/SVM module
  'prisma.svmCart': 'prisma.svm_carts',
  'prisma.svmCartItem': 'prisma.svm_cart_items',
  'prisma.svmOrder': 'prisma.svm_orders',
  'prisma.svmOrderItem': 'prisma.svm_order_items',
  'prisma.svmPromotion': 'prisma.svm_promotions',
  'prisma.svmProduct': 'prisma.svm_products',
  'prisma.svmCollection': 'prisma.svm_collections',
  'prisma.svmShippingZone': 'prisma.svm_shipping_zones',
  'prisma.svmShippingRate': 'prisma.svm_shipping_rates',
  
  // Accounting module
  'prisma.acctFinancialPeriod': 'prisma.acct_financial_periods',
  'prisma.acctLedgerEntry': 'prisma.acct_ledger_entries',
  'prisma.acctLedgerAccount': 'prisma.acct_ledger_accounts',
  'prisma.acctJournalEntry': 'prisma.acct_journal_entries',
  'prisma.acctChartOfAccount': 'prisma.acct_chart_of_accounts',
  'prisma.acctCostCenter': 'prisma.acct_cost_centers',
  'prisma.acctBudget': 'prisma.acct_budgets',
  'prisma.acctBudgetLine': 'prisma.acct_budget_lines',
  
  // CRM module
  'prisma.crmConfiguration': 'prisma.crm_configurations',
  'prisma.crmContact': 'prisma.crm_contacts',
  'prisma.crmDeal': 'prisma.crm_deals',
  'prisma.crmActivity': 'prisma.crm_activities',
  'prisma.crmPipeline': 'prisma.crm_pipelines',
  'prisma.crmStage': 'prisma.crm_stages',
  
  // Commerce Wallet
  'prisma.commerceWallet': 'prisma.commerce_wallets',
  'prisma.commerceWalletTransaction': 'prisma.commerce_wallet_transactions',
  
  // Product - case sensitivity
  'prisma.Product': 'prisma.product',
  
  // HR module
  'prisma.hrEmployee': 'prisma.hr_employees',
  'prisma.hrEmployeeProfile': 'prisma.hr_employee_profiles',
  'prisma.hrPayrollPeriod': 'prisma.hr_payroll_periods',
  'prisma.hrPayrollCalculation': 'prisma.hr_payroll_calculations',
  'prisma.hrPayslip': 'prisma.hr_payslips',
  'prisma.hrLeaveRequest': 'prisma.hr_leave_requests',
  'prisma.hrLeaveBalance': 'prisma.hr_leave_balances',
  'prisma.hrEmployeeContract': 'prisma.hr_employee_contracts',
  
  // Inventory module
  'prisma.invAudit': 'prisma.inv_audits',
  'prisma.invAuditItem': 'prisma.inv_audit_items',
  'prisma.invTransfer': 'prisma.inv_transfers',
  'prisma.invTransferItem': 'prisma.inv_transfer_items',
  
  // Warehouse module
  'prisma.whWarehouse': 'prisma.wh_warehouses',
  'prisma.whLocation': 'prisma.wh_locations',
  'prisma.whZone': 'prisma.wh_zones',
  
  // Logistics module
  'prisma.logZone': 'prisma.log_zones',
  'prisma.logZoneArea': 'prisma.log_zone_areas',
  'prisma.logZoneRate': 'prisma.log_zone_rates',
  'prisma.logDriver': 'prisma.log_drivers',
  'prisma.logVehicle': 'prisma.log_vehicles',
  'prisma.logJob': 'prisma.log_jobs',
  'prisma.logAssignment': 'prisma.log_assignments',
  
  // Marketing module
  'prisma.mktWorkflow': 'prisma.mkt_workflows',
  'prisma.mktWorkflowStep': 'prisma.mkt_workflow_steps',
  'prisma.mktWorkflowEnrollment': 'prisma.mkt_workflow_enrollments',
  'prisma.mktCampaign': 'prisma.mkt_campaigns',
  'prisma.mktTemplate': 'prisma.mkt_templates',
  
  // Legal module
  'prisma.legDocumentTemplate': 'prisma.leg_document_templates',
  'prisma.legTemplateCategory': 'prisma.leg_template_categories',
  'prisma.legMatter': 'prisma.leg_matters',
  'prisma.legDocument': 'prisma.leg_documents',
  
  // Procurement module
  'prisma.procPurchaseOrder': 'prisma.proc_purchase_orders',
  'prisma.procPurchaseOrderItem': 'prisma.proc_purchase_order_items',
  'prisma.procPurchaseRequest': 'prisma.proc_purchase_requests',
  'prisma.procPurchaseRequestItem': 'prisma.proc_purchase_request_items',
  'prisma.procSupplier': 'prisma.proc_suppliers',
  'prisma.procGoodsReceipt': 'prisma.proc_goods_receipts',
  'prisma.procGoodsReceiptItem': 'prisma.proc_goods_receipt_items',
  
  // Sites & Funnels module
  'prisma.sfTemplate': 'prisma.sf_templates',
  'prisma.sfTemplateCategory': 'prisma.sf_template_categories',
  'prisma.sfSite': 'prisma.sf_sites',
  'prisma.sfPage': 'prisma.sf_pages',
  'prisma.sfFunnel': 'prisma.sf_funnels',
  'prisma.sfFunnelStep': 'prisma.sf_funnel_steps',
  
  // Integration module
  'prisma.integrationInstance': 'prisma.integration_instances',
  'prisma.integrationProvider': 'prisma.integration_providers',
  'prisma.integrationWebhook': 'prisma.integration_webhooks',
  'prisma.integrationLog': 'prisma.integration_logs',
  
  // Developer module
  'prisma.developerApp': 'prisma.developer_apps',
  'prisma.apiKey': 'prisma.api_keys',
  
  // Billing module
  'prisma.billInvoice': 'prisma.bill_invoices',
  'prisma.billInvoiceItem': 'prisma.bill_invoice_items',
  'prisma.billPayment': 'prisma.bill_payments',
  
  // POS module
  'prisma.posTerminal': 'prisma.pos_terminals',
  'prisma.posSale': 'prisma.pos_sales',
  'prisma.posSaleItem': 'prisma.pos_sale_items',
  
  // Project Management module
  'prisma.pmProject': 'prisma.pm_projects',
  'prisma.pmTask': 'prisma.pm_tasks',
  'prisma.pmMilestone': 'prisma.pm_milestones',
  'prisma.pmBudget': 'prisma.pm_budgets',
  
  // Political module
  'prisma.polCandidate': 'prisma.pol_candidates',
  'prisma.polCampaign': 'prisma.pol_campaigns',
  'prisma.polDonation': 'prisma.pol_donations',
};

// ============================================================================
// INCLUDE RELATION CORRECTIONS  
// These fix TS2353/TS2561 errors in include clauses
// ============================================================================

const INCLUDE_RELATION_CORRECTIONS = {
  // Format: 'wrongRelation': 'correctRelation'
  // Integration relations
  'provider': 'integration_providers',
  'instance': 'integration_instances',
  'instances': 'integration_instances',
  
  // HR relations
  'employeeProfile': 'hr_employee_profiles',
  'calculations': 'hr_payroll_calculations',
  'payslips': 'hr_payslips',
  'contracts': 'hr_employee_contracts',
  
  // Inventory relations
  'audit': 'inv_audits',
  'warehouse': 'wh_warehouses',
  'sourceWarehouse': 'wh_warehouses',
  'destinationWarehouse': 'wh_warehouses',
  
  // Developer relations
  'apiKeys': 'api_keys',
  'app': 'developer_apps',
  
  // Tenant relations (casing)
  'Subscription': 'subscription',
  'BusinessProfile': 'businessProfile',
  
  // Logistics relations
  'driver': 'log_drivers',
  'vehicle': 'log_vehicles',
  'job': 'log_jobs',
  'areas': 'log_zone_areas',
  
  // Marketing relations
  'steps': 'mkt_workflow_steps',
  'enrollments': 'mkt_workflow_enrollments',
  
  // Procurement relations
  'supplier': 'proc_suppliers',
  'receipts': 'proc_goods_receipts',
  'purchaseOrder': 'proc_purchase_orders',
};

// ============================================================================
// FILE PROCESSING
// ============================================================================

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Apply Prisma model name corrections
    for (const [wrong, correct] of Object.entries(PRISMA_MODEL_CORRECTIONS)) {
      const regex = new RegExp(wrong.replace('.', '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        stats.modelNameFixes += matches.length;
      }
    }
    
    // Apply include relation corrections
    // Match pattern: include: { wrongName: true } or include: { wrongName: { ... } }
    for (const [wrong, correct] of Object.entries(INCLUDE_RELATION_CORRECTIONS)) {
      // Pattern 1: in include clause - wrongName: true
      const includePattern = new RegExp(`(include\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:)`, 'g');
      const includeMatches = content.match(includePattern);
      if (includeMatches) {
        content = content.replace(includePattern, `$1${correct}$2`);
        stats.includeRelationFixes += includeMatches.length;
      }
      
      // Pattern 2: in select clause
      const selectPattern = new RegExp(`(select\\s*:\\s*\\{[^}]*?)\\b${wrong}(\\s*:)`, 'g');
      const selectMatches = content.match(selectPattern);
      if (selectMatches) {
        content = content.replace(selectPattern, `$1${correct}$2`);
        stats.includeRelationFixes += selectMatches.length;
      }
    }
    
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
      if (['node_modules', '.next', 'dist', '.git', 'scripts'].includes(entry.name)) {
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
  console.log('║  PHASE 3A: TypeScript Structural Remediation                  ║');
  console.log('║  Fixing Prisma Model Names and Include Relations              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  console.log(`Processing ${files.length} TypeScript files`);
  console.log('');
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ Modified: ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PHASE 3A RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed:    ${stats.filesProcessed}`);
  console.log(`  Files modified:     ${stats.filesModified}`);
  console.log('');
  console.log('  Fixes Applied:');
  console.log(`    Model Name Fixes:     ${stats.modelNameFixes}`);
  console.log(`    Include Relation:     ${stats.includeRelationFixes}`);
  console.log('');
  console.log(`  Total Fixes: ${stats.modelNameFixes + stats.includeRelationFixes}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Save stats
  fs.writeFileSync(
    path.resolve(__dirname, '../docs/phase-3a-stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

main();
