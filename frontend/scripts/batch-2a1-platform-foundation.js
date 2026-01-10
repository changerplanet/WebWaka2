/**
 * BATCH 2A-1: Platform Foundation Mechanical Remediation
 * 
 * Error Classes Addressed:
 * - TS2353/TS2561: Include clause relation casing (partner -> Partner, tenant -> Tenant)
 * - TS2551: Property vs ID access (need include for relation access)
 * - TS2551: Model name casing (crmLoyaltyRule -> crm_loyalty_rules, userIntent -> user_intents)
 * 
 * Ownership Layer: Platform Foundation
 * Scope: Global batch application
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  includeCasingFixes: 0,
  modelNameFixes: 0,
  totalFixes: 0,
};

// ============================================================================
// ERROR CLASS 1: Include Clause Relation Casing (TS2353/TS2561)
// Pattern: { include: { partner: true } } -> { include: { Partner: true } }
// ============================================================================

const INCLUDE_CASING_FIXES = {
  // PascalCase relations in include clauses
  'partner:': 'Partner:',
  'tenant:': 'Tenant:',
  'subscription:': 'Subscription:',
  'product:': 'Product:',
  'plan:': 'Plan:',      // If exists
  'location:': 'Location:',
  'addOn:': 'billing_addons:',  // Specific model name
  'category:': 'ProductCategory:',
};

// ============================================================================
// ERROR CLASS 2: Prisma Model Name Corrections (TS2551)
// Pattern: prisma.crmLoyaltyRule -> prisma.crm_loyalty_rules
// ============================================================================

const MODEL_NAME_FIXES = {
  'prisma.userIntent': 'prisma.user_intents',
  'prisma.crmLoyaltyRule': 'prisma.crm_loyalty_rules',
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;

    // Apply Include Casing Fixes within include/select clauses
    for (const [wrong, correct] of Object.entries(INCLUDE_CASING_FIXES)) {
      // Match inside include: { ... } blocks
      const includePattern = new RegExp(
        `(include\\s*:\\s*\\{[^}]*?)\\b${wrong}`,
        'g'
      );
      const includeMatches = content.match(includePattern);
      if (includeMatches) {
        content = content.replace(includePattern, `$1${correct}`);
        localFixes += includeMatches.length;
        stats.includeCasingFixes += includeMatches.length;
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
        stats.includeCasingFixes += selectMatches.length;
      }
    }

    // Apply Model Name Fixes
    for (const [wrong, correct] of Object.entries(MODEL_NAME_FIXES)) {
      const regex = new RegExp(wrong.replace(/\./g, '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        localFixes += matches.length;
        stats.modelNameFixes += matches.length;
      }
    }

    stats.totalFixes += localFixes;

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
  console.log('║  BATCH 2A-1: Platform Foundation Mechanical Remediation       ║');
  console.log('║  Error Classes: TS2353, TS2561, TS2551                        ║');
  console.log('║  Ownership: Platform Foundation                               ║');
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
  console.log('  BATCH 2A-1 RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed:      ${stats.filesProcessed}`);
  console.log(`  Files modified:       ${stats.filesModified}`);
  console.log('');
  console.log('  Fixes by Error Class:');
  console.log(`    Include Casing:     ${stats.includeCasingFixes}`);
  console.log(`    Model Names:        ${stats.modelNameFixes}`);
  console.log('');
  console.log(`  Total Fixes:          ${stats.totalFixes}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Save stats
  fs.writeFileSync(
    path.resolve(__dirname, '../docs/batch-2a1-stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

main();
