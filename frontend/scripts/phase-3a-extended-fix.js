/**
 * PHASE 3A: Extended Prisma Model Name Corrections
 * 
 * Fixing remaining TS2551 errors with comprehensive model mappings
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  fixes: 0,
};

// Extended Prisma model name corrections based on error analysis
const PRISMA_MODEL_CORRECTIONS = {
  // Logistics module
  'prisma.logisticsDeliveryAssignment': 'prisma.logistics_delivery_assignments',
  'prisma.logisticsDeliveryAgent': 'prisma.logistics_delivery_agents',
  'prisma.logisticsDeliveryZone': 'prisma.logistics_delivery_zones',
  'prisma.logisticsConfiguration': 'prisma.logistics_configurations',
  
  // Accounting module - extended
  'prisma.acctExpenseRecord': 'prisma.acct_expense_records',
  'prisma.chartOfAccount': 'prisma.acct_chart_of_accounts',
  
  // CRM module - extended
  'prisma.crmCampaign': 'prisma.crm_campaigns',
  'prisma.crmCustomerSegment': 'prisma.crm_customer_segments',
  'prisma.crmLoyaltyProgram': 'prisma.crm_loyalty_programs',
  'prisma.crmEngagementEvent': 'prisma.crm_engagement_events',
  'prisma.crmSegmentMembership': 'prisma.crm_segment_memberships',
  'prisma.crmLoyaltyTransaction': 'prisma.crm_loyalty_transactions',
  
  // HR module - extended
  'prisma.hrAttendanceRecord': 'prisma.hr_attendance_records',
  'prisma.hr_employeesProfile': 'prisma.hr_employee_profiles',
  'prisma.hrConfiguration': 'prisma.hr_configurations',
  
  // Payment module
  'prisma.payWallet': 'prisma.pay_wallets',
  'prisma.payRefund': 'prisma.pay_refunds',
  'prisma.payPaymentTransaction': 'prisma.pay_payment_transactions',
  'prisma.payPaymentIntent': 'prisma.pay_payment_intents',
  
  // Integration module - extended
  'prisma.integrationEventLog': 'prisma.integration_event_logs',
  
  // B2B module
  'prisma.b2BCustomerProfile': 'prisma.b2b_customer_profiles',
  'prisma.b2BBulkOrderDraft': 'prisma.b2b_bulk_order_drafts',
  'prisma.b2BInvoice': 'prisma.b2b_invoices',
  
  // Marketing module - extended
  'prisma.mktAutomationWorkflow': 'prisma.mkt_automation_workflows',
  
  // Billing module
  'prisma.billingAdjustment': 'prisma.billing_adjustments',
  'prisma.billingGracePolicy': 'prisma.billing_grace_policies',
  'prisma.billingDiscountRule': 'prisma.billing_discount_rules',
  'prisma.billingBundle': 'prisma.billing_bundles',
  
  // Automation module
  'prisma.automationRule': 'prisma.automation_rules',
  'prisma.automationRun': 'prisma.automation_runs',
  
  // AI module
  'prisma.aIRecommendation': 'prisma.ai_recommendations',
  'prisma.aIInsight': 'prisma.ai_insights',
  
  // Analytics module
  'prisma.analyticsInsight': 'prisma.analytics_insights',
  
  // Tax module
  'prisma.taxComputationRecord': 'prisma.tax_computation_records',
  
  // Compliance module
  'prisma.complianceStatus': 'prisma.compliance_statuses',
  
  // Additional patterns found
  'prisma.period': 'prisma.acct_financial_periods',
  'prisma.tenant': 'prisma.Tenant',  // Tenant is PascalCase
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    for (const [wrong, correct] of Object.entries(PRISMA_MODEL_CORRECTIONS)) {
      const regex = new RegExp(wrong.replace('.', '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        stats.fixes += matches.length;
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      stats.filesModified++;
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
  console.log('PHASE 3A: Extended Prisma Model Corrections');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total fixes: ${stats.fixes}`);
}

main();
