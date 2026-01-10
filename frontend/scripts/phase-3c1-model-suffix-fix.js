/**
 * PHASE 3C-1: Model Name Suffix Corrections
 * 
 * Fix patterns where model names have incorrect suffixes
 * e.g., prisma.analytics_dashboardsWidget -> prisma.analytics_dashboard_widgets
 */

const fs = require('fs');
const path = require('path');

const stats = { filesProcessed: 0, filesModified: 0, fixes: 0 };

// Specific model name corrections from validation errors
const MODEL_NAME_FIXES = {
  // Analytics
  'prisma.analytics_dashboardsWidget': 'prisma.analytics_dashboard_widgets',
  
  // SVM/Commerce
  'prisma.svm_ordersItem': 'prisma.svm_order_items',
  'prisma.svm_promotionsUsage': 'prisma.svm_promotion_usage',
  
  // Billing
  'prisma.billing_addonsSubscription': 'prisma.billing_addon_subscriptions',
  
  // Commerce Wallet
  'prisma.commerce_walletsLedger': 'prisma.commerce_wallet_ledger',
  
  // CRM
  'prisma.crm_campaignsAudience': 'prisma.crm_campaign_audiences',
  
  // Procurement
  'prisma.proc_goods_receiptsItem': 'prisma.proc_goods_receipt_items',
  'prisma.proc_purchase_ordersItem': 'prisma.proc_purchase_order_items',
  'prisma.proc_purchase_requestsItem': 'prisma.proc_purchase_request_items',
  'prisma.proc_suppliersPerformance': 'prisma.proc_supplier_performance',
  
  // Payment
  'prisma.pay_walletsTransaction': 'prisma.pay_wallet_transactions',
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;
    
    for (const [wrong, correct] of Object.entries(MODEL_NAME_FIXES)) {
      const regex = new RegExp(wrong.replace(/\./g, '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        localFixes += matches.length;
      }
    }
    
    stats.fixes += localFixes;
    
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
  console.log('PHASE 3C-1: Model Name Suffix Corrections');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) console.log(`  ✓ ${path.relative(srcDir, file)}`);
  }
  
  console.log('');
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total fixes: ${stats.fixes}`);
}

main();
