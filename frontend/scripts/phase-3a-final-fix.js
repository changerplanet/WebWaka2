/**
 * PHASE 3A: Final Model & Property Corrections
 */

const fs = require('fs');
const path = require('path');

const stats = { filesProcessed: 0, filesModified: 0, fixes: 0 };

const CORRECTIONS = {
  // Model case fixes (PascalCase -> camelCase for Prisma)
  'prisma.Tenant': 'prisma.Tenant',  // Actually keep PascalCase - core model
  'prisma.TenantDomain': 'prisma.tenantDomain',
  'prisma.TenantMembership': 'prisma.tenantMembership',
  'prisma.TenantCapabilityActivation': 'prisma.core_tenant_capability_activations',
  'prisma.Product': 'prisma.product',
  
  // Extended model fixes
  'prisma.svm_cartsItem': 'prisma.svm_cart_items',
  'prisma.billingUsageMetric': 'prisma.billing_usage_metrics',
  'prisma.billingAddOn': 'prisma.billing_addons',
  'prisma.billingAddOnSubscription': 'prisma.billing_addon_subscriptions',
  'prisma.analyticsDashboard': 'prisma.analytics_dashboards',
  'prisma.analyticsConfiguration': 'prisma.analytics_configurations',
  'prisma.analyticsReportDefinition': 'prisma.analytics_report_definitions',
  'prisma.analyticsDashboardWidget': 'prisma.analytics_dashboard_widgets',
  'prisma.procConfiguration': 'prisma.proc_configurations',
  'prisma.proc_suppliersPriceList': 'prisma.proc_supplier_price_lists',
  'prisma.userIntent': 'prisma.user_intents',
  'prisma.stockMovement': 'prisma.wh_stock_movement',
  'prisma.regulatoryReport': 'prisma.regulatory_reports',
  'prisma.mktAutomationRun': 'prisma.mkt_automation_runs',
  'prisma.mktConfiguration': 'prisma.mkt_configurations',
  'prisma.logisticsDeliveryProof': 'prisma.logistics_delivery_proofs',
  'prisma.pay_walletsTransaction': 'prisma.pay_wallet_transactions',
  'prisma.commerceWalletLedger': 'prisma.commerce_wallet_ledger',
  'prisma.b2BPriceTier': 'prisma.b2b_price_tiers',
  'prisma.journalEntry': 'prisma.acct_journal_entries',
  'prisma.chartOfAccount': 'prisma.acct_chart_of_accounts',
  
  // Additional fixes from analysis
  'prisma.crmContact': 'prisma.crm_contacts',
  'prisma.crmDeal': 'prisma.crm_deals',
  'prisma.crmPipeline': 'prisma.crm_pipelines',
  'prisma.crmStage': 'prisma.crm_stages',
  'prisma.crmActivity': 'prisma.crm_activities',
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    for (const [wrong, correct] of Object.entries(CORRECTIONS)) {
      if (wrong !== correct) {
        const regex = new RegExp(wrong.replace(/\./g, '\\.'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, correct);
          stats.fixes += matches.length;
        }
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
      if (!['node_modules', '.next', 'dist', '.git', 'scripts'].includes(entry.name)) {
        findTypeScriptFiles(fullPath, files);
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  console.log('PHASE 3A: Final Model Corrections');
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) console.log(`  ✓ ${path.relative(srcDir, file)}`);
  }
  
  console.log(`\nFiles modified: ${stats.filesModified}, Fixes: ${stats.fixes}`);
}

main();
