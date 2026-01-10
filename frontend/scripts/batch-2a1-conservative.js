/**
 * BATCH 2A-1: Platform Foundation - Context-Aware Include Fixes
 * 
 * Error Classes:
 * - TS2561: Include clause with "Did you mean" suggestions
 * - TS2551: Model name casing errors
 * 
 * Strategy: Apply ONLY the TypeScript-suggested corrections
 * (partner -> Partner for PartnerReferral, product -> Product for ProductVariant)
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  fixes: 0,
};

// Context-specific fixes based on TypeScript error suggestions
// Format: 'wrong pattern' -> 'correct pattern'
const CONTEXT_FIXES = [
  // PartnerReferral includes (Partner is PascalCase)
  { model: 'PartnerReferral', wrong: 'partner:', correct: 'Partner:' },
  { model: 'PartnerReferral', wrong: 'tenant:', correct: 'Tenant:' },
  
  // PartnerReferralCode includes
  { model: 'PartnerReferralCode', wrong: 'partner:', correct: 'Partner:' },
  
  // ProductVariant includes
  { model: 'ProductVariant', wrong: 'product:', correct: 'Product:' },
  
  // InventoryLevel includes  
  { model: 'InventoryLevel', wrong: 'product:', correct: 'Product:' },
  
  // Entitlement includes
  { model: 'Entitlement', wrong: 'subscription:', correct: 'Subscription:' },
  
  // Model name fixes
  { global: true, wrong: 'prisma.userIntent', correct: 'prisma.user_intents' },
  { global: true, wrong: 'prisma.crmLoyaltyRule', correct: 'prisma.crm_loyalty_rules' },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;

    // Apply global model name fixes
    for (const fix of CONTEXT_FIXES.filter(f => f.global)) {
      const regex = new RegExp(fix.wrong.replace(/\./g, '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, fix.correct);
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
  console.log('BATCH 2A-1: Platform Foundation - Model Name Fixes Only');
  console.log('(Context-aware include fixes require more analysis)');
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
