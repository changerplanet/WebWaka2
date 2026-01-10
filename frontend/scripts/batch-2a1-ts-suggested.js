/**
 * BATCH 2A-1: Platform Foundation - TypeScript-Suggested Fixes
 * 
 * Error Classes Addressed:
 * - TS2561: Include clause "Did you mean" (Apply exact TypeScript suggestions)
 * - TS2353: Include unknown property (Apply schema-validated corrections)
 * 
 * Strategy: Use TypeScript error messages as source of truth for corrections
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  includeFixes: 0,
  propertyFixes: 0,
};

// Fixes derived from TS2561 "Did you mean" suggestions
// These are model-context-specific based on actual Prisma schema
const INCLUDE_FIXES = {
  // PartnerUser: partner is lowercase
  'PartnerUserInclude': { 'Partner:': 'partner:' },
  
  // TenantMembership: tenant is lowercase
  'TenantMembershipInclude': { 'Tenant:': 'tenant:' },
  
  // PlatformInstance: tenant is lowercase
  'PlatformInstanceInclude': { 'Tenant:': 'tenant:' },
  
  // User _count: Session is PascalCase
  'UserCountOutputTypeSelect': { 'sessions:': 'Session:' },
  
  // acct_ledger_accounts: chartOfAccountId not chartOfAccount
  'acct_ledger_accountsOrderByWithRelationInput': { 'chartOfAccount:': 'chartOfAccountId:' },
};

// Global include relation fixes that apply across multiple models
const GLOBAL_INCLUDE_FIXES = [
  // Accounting relations - use schema names
  { wrong: 'chartOfAccount:', correct: 'acct_chart_of_accounts:' },
  { wrong: 'ledgerAccount:', correct: 'acct_ledger_accounts:' },
  { wrong: 'journalEntries:', correct: 'acct_journal_entries:' },
  { wrong: 'journalEntry:', correct: 'acct_journal_entries:' },
  
  // Capability relations
  { wrong: 'activations:', correct: 'core_tenant_capability_activations:' },
  { wrong: 'capabilities:', correct: 'core_tenant_capability_activations:' },
  
  // User relations
  { wrong: 'partnerMembership:', correct: 'partnerUser:' },
  
  // Marketing relations in education context
  { wrong: 'mkt_workflow_enrollments:', correct: 'mkt_enrollments:' },
];

// AuditLog input fixes - remove invalid property
const AUDIT_LOG_FIX = { wrong: 'ipAddress:', correct: '' };

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;

    // Apply global include relation fixes
    for (const fix of GLOBAL_INCLUDE_FIXES) {
      // Match inside include/select blocks
      const includePattern = new RegExp(
        `(include\\s*:\\s*\\{[^}]*?)\\b${fix.wrong}`,
        'g'
      );
      const selectPattern = new RegExp(
        `(select\\s*:\\s*\\{[^}]*?)\\b${fix.wrong}`,
        'g'
      );
      const countPattern = new RegExp(
        `(_count\\s*:\\s*\\{\\s*select\\s*:\\s*\\{[^}]*?)\\b${fix.wrong}`,
        'g'
      );
      
      for (const pattern of [includePattern, selectPattern, countPattern]) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, `$1${fix.correct}`);
          localFixes += matches.length;
          stats.includeFixes += matches.length;
        }
      }
    }

    stats.propertyFixes += localFixes;

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
  console.log('BATCH 2A-1: Platform Foundation Remediation');
  console.log('Error Classes: TS2353, TS2561 (Include Relations)');
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
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed: ${stats.filesProcessed}`);
  console.log(`  Files modified:  ${stats.filesModified}`);
  console.log(`  Include fixes:   ${stats.includeFixes}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main();
