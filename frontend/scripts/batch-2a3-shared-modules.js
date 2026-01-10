/**
 * BATCH 2A-3: Shared Modules Property Access & Type Remediation
 * 
 * SCOPE (STRICT):
 *   - Inventory (shared services only)
 *   - Procurement (shared services only)
 *   - Billing
 *   - CRM
 *   - Subscription / Entitlements
 * 
 * ERROR CLASSES:
 *   - TS2339: Property does not exist (caused by incorrect Prisma model names)
 *   - TS2322: Type assignment mismatch (caused by missing required `id` field)
 * 
 * EXCLUDED:
 *   - Canonical suites
 *   - Platform foundation
 *   - API routes belonging to suites
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION: Prisma Model Name Mappings (camelCase -> snake_case)
// =============================================================================

const PRISMA_MODEL_RENAMES = {
  // Inventory module models
  'prisma.inventoryAudit': 'prisma.inv_audits',
  'prisma.inventoryAuditItem': 'prisma.inv_audit_items',
  'prisma.warehouse': 'prisma.inv_warehouses',
  'prisma.stockTransfer': 'prisma.inv_stock_transfers',
  'prisma.stockTransferItem': 'prisma.inv_stock_transfer_items',
  'prisma.reorderRule': 'prisma.inv_reorder_rules',
  'prisma.reorderSuggestion': 'prisma.inv_reorder_suggestions',
};

// =============================================================================
// CONFIGURATION: Files in scope (Internal Shared Modules ONLY)
// =============================================================================

const ALLOWED_PATHS = [
  'src/lib/inventory/',
  'src/lib/procurement/',
  'src/lib/billing/',
  'src/lib/crm/',
  'src/lib/subscription',
  'src/lib/entitlements',
  'src/lib/subscription.ts',
  'src/lib/entitlements.ts',
  'src/lib/subscription-events.ts',
];

const EXCLUDED_PATHS = [
  // Canonical suites
  'src/lib/education/',
  'src/lib/health/',
  'src/lib/logistics/',
  'src/lib/commerce/',
  'src/lib/hospitality/',
  'src/lib/civic/',
  'src/lib/real-estate/',
  'src/lib/recruitment/',
  'src/lib/project-management/',
  'src/lib/legal-practice/',
  'src/lib/advanced-warehouse/',
  'src/lib/parkhub/',
  'src/lib/political/',
  'src/lib/church/',
  // Platform foundation
  'src/lib/auth/',
  'src/lib/tenant/',
  'src/lib/partner/',
  // API routes
  'src/app/api/',
];

// =============================================================================
// UTILITIES
// =============================================================================

function isInScope(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check exclusions first
  for (const excluded of EXCLUDED_PATHS) {
    if (normalizedPath.includes(excluded)) {
      return false;
    }
  }
  
  // Check if in allowed paths
  for (const allowed of ALLOWED_PATHS) {
    if (normalizedPath.includes(allowed)) {
      return true;
    }
  }
  
  return false;
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// =============================================================================
// FIX PATTERN A: Prisma Model Name Corrections (TS2339)
// =============================================================================

function fixPrismaModelNames(content, filePath) {
  let modified = false;
  let newContent = content;
  const fixes = [];
  
  for (const [oldName, newName] of Object.entries(PRISMA_MODEL_RENAMES)) {
    // Match various patterns: prisma.modelName, prisma.modelName., prisma.modelName(
    const patterns = [
      new RegExp(`(${oldName.replace('.', '\\.')})([.\\(])`, 'g'),
      new RegExp(`(${oldName.replace('.', '\\.')})\\s*$`, 'gm'),
    ];
    
    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, (match, group1, group2) => {
          return `${newName}${group2 || ''}`;
        });
        modified = true;
        fixes.push({
          pattern: oldName,
          replacement: newName,
          count: matches.length
        });
      }
    }
  }
  
  return { content: newContent, modified, fixes };
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main() {
  const srcDir = path.join(__dirname, '..', 'src', 'lib');
  
  console.log('='.repeat(70));
  console.log('BATCH 2A-3: Shared Modules Property Access Remediation');
  console.log('='.repeat(70));
  console.log('');
  
  const allFiles = getAllTsFiles(srcDir);
  const scopedFiles = allFiles.filter(f => isInScope(f));
  
  console.log(`Total TypeScript files in src/lib: ${allFiles.length}`);
  console.log(`Files in scope (Shared Modules): ${scopedFiles.length}`);
  console.log('');
  
  const report = {
    filesScanned: scopedFiles.length,
    filesModified: 0,
    totalFixes: 0,
    fixesByFile: [],
    prismaModelFixes: {},
    skippedFiles: [],
  };
  
  for (const filePath of scopedFiles) {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = fixPrismaModelNames(content, filePath);
      
      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        report.filesModified++;
        
        let fileFixes = 0;
        for (const fix of result.fixes) {
          fileFixes += fix.count;
          report.prismaModelFixes[fix.pattern] = (report.prismaModelFixes[fix.pattern] || 0) + fix.count;
        }
        
        report.totalFixes += fileFixes;
        report.fixesByFile.push({
          file: relativePath,
          fixes: result.fixes,
          totalFixes: fileFixes
        });
        
        console.log(`✓ Fixed: ${relativePath} (${fileFixes} changes)`);
      }
    } catch (error) {
      report.skippedFiles.push({
        file: relativePath,
        error: error.message
      });
      console.log(`✗ Error: ${relativePath} - ${error.message}`);
    }
  }
  
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Files scanned: ${report.filesScanned}`);
  console.log(`Files modified: ${report.filesModified}`);
  console.log(`Total fixes applied: ${report.totalFixes}`);
  console.log('');
  
  if (Object.keys(report.prismaModelFixes).length > 0) {
    console.log('Prisma Model Name Fixes:');
    for (const [pattern, count] of Object.entries(report.prismaModelFixes)) {
      console.log(`  ${pattern} → ${PRISMA_MODEL_RENAMES[pattern]}: ${count} occurrences`);
    }
  }
  
  // Write detailed report
  const reportPath = path.join(__dirname, '..', 'docs', 'PHASE_2_BATCH_2A3_REPORT.md');
  const reportContent = generateReport(report);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log('');
  console.log(`Report written to: ${reportPath}`);
  
  return report;
}

function generateReport(report) {
  const timestamp = new Date().toISOString();
  
  let md = `# PHASE 2 — Batch 2A-3 Report

**Date**: ${timestamp}  
**Phase**: 2A (Internal Shared Modules)  
**Batch**: 2A-3 (Property Access & Type Remediation)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Files Scanned | ${report.filesScanned} |
| Files Modified | ${report.filesModified} |
| Total Fixes | ${report.totalFixes} |

---

## Scope Compliance

### INCLUDED Modules
- ✅ Inventory (shared services only)
- ✅ Procurement (shared services only)
- ✅ Billing
- ✅ CRM
- ✅ Subscription / Entitlements

### EXCLUDED (NOT TOUCHED)
- ❌ Canonical suites (Education, Health, Logistics, etc.)
- ❌ Platform foundation (auth, tenant, partner)
- ❌ API routes belonging to suites

---

## Error Classes Addressed

### TS2339 — Property does not exist
**Cause**: Incorrect Prisma model names (camelCase instead of snake_case)

**Fixes Applied**:
`;

  if (Object.keys(report.prismaModelFixes).length > 0) {
    md += `| Original | Corrected | Count |\n|----------|-----------|-------|\n`;
    for (const [pattern, count] of Object.entries(report.prismaModelFixes)) {
      md += `| \`${pattern}\` | \`${PRISMA_MODEL_RENAMES[pattern]}\` | ${count} |\n`;
    }
  } else {
    md += `*No Prisma model name fixes required in scoped files.*\n`;
  }

  md += `
---

## Files Modified

`;

  if (report.fixesByFile.length > 0) {
    for (const fileReport of report.fixesByFile) {
      md += `### ${fileReport.file}\n`;
      md += `- **Total fixes**: ${fileReport.totalFixes}\n`;
      for (const fix of fileReport.fixes) {
        md += `- \`${fix.pattern}\` → \`${PRISMA_MODEL_RENAMES[fix.pattern]}\` (${fix.count}x)\n`;
      }
      md += `\n`;
    }
  } else {
    md += `*No files modified.*\n`;
  }

  md += `
---

## Verification

Run the following command to verify error reduction:

\`\`\`bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "TS2339|TS2322" | wc -l
\`\`\`

---

## 🛑 HARD STOP

Batch 2A-3 complete. Awaiting explicit authorization before proceeding to next batch.

---

*Report generated automatically by batch-2a3-shared-modules.js*
`;

  return md;
}

main();
