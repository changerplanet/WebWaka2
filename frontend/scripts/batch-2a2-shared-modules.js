/**
 * BATCH 2A-2: Internal Shared Modules Remediation
 * 
 * SCOPE: lib/inventory, lib/billing, lib/crm, lib/procurement, lib/payments, lib/integrations, lib/marketing
 * EXCLUDED: Suite-specific routes, Platform foundation, Demo files
 * 
 * Error Classes:
 * - TS2353: Include clause unknown property
 * - TS2551/TS2561: "Did you mean" relation mismatches
 * - TS2322: Type assignment (missing required fields) - logged, not fixed
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  includeFixes: 0,
  skippedOutOfScope: 0,
};

// Shared module path patterns (ONLY these are in scope)
const SHARED_MODULE_PATTERNS = [
  '/lib/inventory/',
  '/lib/billing/',
  '/lib/crm/',
  '/lib/procurement/',
  '/lib/payments/',
  '/lib/integrations/',
  '/lib/marketing/',
];

// Include relation fixes based on schema analysis
const INCLUDE_RELATION_FIXES = {
  // Billing module
  'items:': 'billing_bundle_items:',           // billing_bundles
  'Plan:': 'plan:',                            // Subscription (lowercase)
  'bill_invoices:': 'invoice:',                // bill_invoice_payments (relation name)
  'inv_audit_items:': 'bill_invoice_items:',   // bill_invoices (wrong module)
  
  // CRM module
  'audiences:': 'crm_campaign_audiences:',     // crm_campaigns
  'transactions:': 'crm_loyalty_transactions:', // crm_loyalty_programs
  'segment:': 'crm_customer_segments:',         // crm_loyalty_rules
  'rules:': 'crm_loyalty_rules:',               // crm_loyalty_programs
  'memberships:': 'crm_segment_memberships:',   // crm_customer_segments
  
  // Inventory module
  'items:': 'inv_audit_items:',                // inv_audits (context-specific)
  'warehouse:': 'wh_warehouses:',              // inv_audits, inv_transfers
  'sourceWarehouse:': 'wh_warehouses:',        // inv_transfers
  'destinationWarehouse:': 'wh_warehouses:',   // inv_transfers
  
  // Integration module
  'provider:': 'integration_providers:',       // integration_instances
  'instance:': 'integration_instances:',       // integration_webhooks
  
  // Procurement module
  'supplier:': 'proc_suppliers:',              // proc_purchase_orders
  'purchaseOrder:': 'proc_purchase_orders:',   // proc_goods_receipts
  
  // Marketing module
  'steps:': 'mkt_workflow_steps:',             // mkt_workflows
  'enrollments:': 'mkt_workflow_enrollments:', // mkt_workflows
};

function isInScope(filePath) {
  return SHARED_MODULE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function processFile(filePath) {
  // Check if file is in scope
  if (!isInScope(filePath)) {
    stats.skippedOutOfScope++;
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;

    // Apply include relation fixes
    for (const [wrong, correct] of Object.entries(INCLUDE_RELATION_FIXES)) {
      // Match inside include: { ... } blocks
      const includePattern = new RegExp(
        `(include\\s*:\\s*\\{[^}]*?)\\b${wrong}`,
        'g'
      );
      const matches = content.match(includePattern);
      if (matches) {
        content = content.replace(includePattern, `$1${correct}`);
        localFixes += matches.length;
      }

      // Match inside select: { ... } blocks  
      const selectPattern = new RegExp(
        `(select\\s*:\\s*\\{[^}]*?)\\b${wrong}`,
        'g'
      );
      const selectMatches = content.match(selectPattern);
      if (selectMatches) {
        content = content.replace(selectPattern, `$1${correct}`);
        localFixes += selectMatches.length;
      }

      // Match inside _count: { select: { ... } } blocks
      const countPattern = new RegExp(
        `(_count\\s*:\\s*\\{\\s*select\\s*:\\s*\\{[^}]*?)\\b${wrong}`,
        'g'
      );
      const countMatches = content.match(countPattern);
      if (countMatches) {
        content = content.replace(countPattern, `$1${correct}`);
        localFixes += countMatches.length;
      }
    }

    stats.includeFixes += localFixes;

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
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  BATCH 2A-2: Internal Shared Modules Remediation              ║');
  console.log('║  Scope: Inventory, Billing, CRM, Procurement, Payments,       ║');
  console.log('║         Integrations, Marketing                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);

  console.log(`Scanning ${files.length} files (filtering to shared modules only)...`);
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
  console.log('  BATCH 2A-2 RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files scanned:        ${stats.filesProcessed}`);
  console.log(`  Files in scope:       ${stats.filesProcessed - stats.skippedOutOfScope}`);
  console.log(`  Files modified:       ${stats.filesModified}`);
  console.log(`  Include fixes:        ${stats.includeFixes}`);
  console.log(`  Skipped (out of scope): ${stats.skippedOutOfScope}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Save stats
  fs.writeFileSync(
    path.resolve(__dirname, '../docs/batch-2a2-stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

main();
