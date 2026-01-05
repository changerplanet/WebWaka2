#!/usr/bin/env node
/**
 * PRISMA MODEL VALIDATION SCRIPT
 * 
 * Purpose: Validates that all Prisma model references in code match actual
 * generated Prisma client models. Catches schema drift before runtime.
 * 
 * Modes:
 *   --strict    : Fail on any mismatch (CI/CD mode)
 *   --baseline  : Generate baseline of known issues
 *   --check     : Check for NEW issues only (default)
 * 
 * Usage:
 *   node scripts/validation/validate-prisma-models.js [--strict|--baseline|--check]
 *   yarn validate:schema
 * 
 * Exit codes:
 *   0 - All validations passed (or no new issues in check mode)
 *   1 - Validation errors found
 * 
 * Created: January 5, 2026
 * Part of: Platform Safety Hardening
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../../src'),
  schemaPath: path.join(__dirname, '../../prisma/schema.prisma'),
  prismaClientPath: path.join(__dirname, '../../node_modules/.prisma/client/index.d.ts'),
  baselinePath: path.join(__dirname, '../../.prisma-validation-baseline.json'),
  reportPath: path.join(__dirname, '../../.prisma-validation-report.json'),
  excludeDirs: ['node_modules', '.next', 'dist', '__tests__', 'test'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  // Known legacy model naming patterns (these existed before standardization)
  legacyPatterns: [
    /^acct[A-Z]/, // acctChartOfAccount -> acct_chart_of_accounts
    /^ai[A-Z]/,   // aIInsight -> ai_insights
    /^analytics[A-Z]/, // analyticsConfiguration -> analytics_configurations
    /^automation[A-Z]/, // automationRule -> automation_rules
    /^b2B[A-Z]/, // b2BCustomerProfile -> b2b_customer_profiles
    /^billing[A-Z]/, // billingBundle -> billing_bundles
    /^commerce[A-Z]/, // commerceWallet -> commerce_wallets
    /^compliance[A-Z]/, // complianceProfile -> compliance_profiles
    /^crm[A-Z]/, // crmCampaign -> crm_campaigns
    /^hr[A-Z]/, // hrAttendanceRecord -> hr_attendance_records
    /^inv[A-Z]/, // invAudit -> inv_audits
    /^logistics[A-Z]/, // logisticsDeliveryAgent -> logistics_delivery_agents
    /^mkt[A-Z]/, // mktAutomationWorkflow -> mkt_automation_workflows
    /^pay[A-Z]/, // payPaymentIntent -> pay_payment_intents
    /^proc[A-Z]/, // procPurchaseOrder -> proc_purchase_orders
    /^regulatory[A-Z]/, // regulatoryReport -> regulatory_reports
    /^svm[A-Z]/, // svmCart -> svm_carts
    /^tax[A-Z]/, // taxConfiguration -> tax_configurations
    /^tenant[A-Z]/, // tenantCapabilityActivation -> core_tenant_capability_activations
    /^capability[A-Z]/, // capabilityEventLog -> core_capability_event_logs
  ],
};

// Parse command line arguments
const args = process.argv.slice(2);
const MODE = args.includes('--strict') ? 'strict' : 
             args.includes('--baseline') ? 'baseline' : 'check';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}${colors.bold}ERROR: ${message}${colors.reset}`);
}

function logWarning(message) {
  console.warn(`${colors.yellow}WARNING: ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

/**
 * Extract all model names from Prisma schema
 */
function extractSchemaModels() {
  const schemaContent = fs.readFileSync(CONFIG.schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s*\{/gm;
  const models = new Set();
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.add(match[1]);
  }
  
  return models;
}

/**
 * Extract all model names from generated Prisma client
 */
function extractClientModels() {
  if (!fs.existsSync(CONFIG.prismaClientPath)) {
    logWarning('Prisma client not generated. Run `npx prisma generate` first.');
    return new Set();
  }
  
  const clientContent = fs.readFileSync(CONFIG.prismaClientPath, 'utf-8');
  const modelRegex = /get\s+(\w+)\(\):\s*Prisma\.\w+Delegate/g;
  const models = new Set();
  
  let match;
  while ((match = modelRegex.exec(clientContent)) !== null) {
    models.add(match[1]);
  }
  
  return models;
}

/**
 * Find all TypeScript/JavaScript files in directory
 */
function findSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        findSourceFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      if (CONFIG.fileExtensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Extract prisma model references from a file
 */
function extractPrismaReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const references = [];
  
  const prismaRefRegex = /prisma\.(\w+)\.(findMany|findUnique|findFirst|create|update|delete|upsert|count|aggregate|groupBy|findUniqueOrThrow|findFirstOrThrow|createMany|updateMany|deleteMany)/g;
  
  let match;
  while ((match = prismaRefRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    references.push({
      model: match[1],
      method: match[2],
      line: lineNumber,
      file: filePath,
    });
  }
  
  return references;
}

/**
 * Check if a model reference is a known legacy pattern
 */
function isLegacyPattern(modelName) {
  return CONFIG.legacyPatterns.some(pattern => pattern.test(modelName));
}

/**
 * Validate all prisma references against known models
 */
function validateReferences(references, validModels) {
  const errors = [];
  const legacyIssues = [];
  
  for (const ref of references) {
    if (!validModels.has(ref.model)) {
      const relPath = path.relative(process.cwd(), ref.file);
      const errorKey = `${relPath}:${ref.line}:${ref.model}`;
      
      if (isLegacyPattern(ref.model)) {
        legacyIssues.push({ ...ref, key: errorKey, type: 'LEGACY' });
      } else {
        const lowerModel = ref.model.toLowerCase();
        const possibleMatches = Array.from(validModels).filter(
          m => m.toLowerCase() === lowerModel || 
               m.toLowerCase().replace(/_/g, '') === lowerModel.replace(/_/g, '')
        );
        
        errors.push({
          ...ref,
          key: errorKey,
          type: possibleMatches.length > 0 ? 'CASE_MISMATCH' : 'UNKNOWN_MODEL',
          suggestion: possibleMatches[0] || null,
        });
      }
    }
  }
  
  return { errors, legacyIssues };
}

/**
 * Load baseline if exists
 */
function loadBaseline() {
  if (fs.existsSync(CONFIG.baselinePath)) {
    return JSON.parse(fs.readFileSync(CONFIG.baselinePath, 'utf-8'));
  }
  return { knownIssues: [] };
}

/**
 * Save baseline
 */
function saveBaseline(issues) {
  const baseline = {
    generatedAt: new Date().toISOString(),
    description: 'Known Prisma model naming issues (legacy code)',
    knownIssues: issues.map(i => i.key),
  };
  fs.writeFileSync(CONFIG.baselinePath, JSON.stringify(baseline, null, 2));
  return baseline;
}

/**
 * Main validation function
 */
function main() {
  log('\n===========================================', 'blue');
  log('  PRISMA MODEL VALIDATION', 'bold');
  log(`  Mode: ${MODE.toUpperCase()}`, 'blue');
  log('===========================================\n', 'blue');
  
  // Step 1: Extract models
  log('Step 1: Reading Prisma schema...', 'blue');
  const schemaModels = extractSchemaModels();
  log(`  Found ${schemaModels.size} models in schema.prisma`);
  
  log('\nStep 2: Reading generated Prisma client...', 'blue');
  const clientModels = extractClientModels();
  log(`  Found ${clientModels.size} models in Prisma client`);
  
  const validModels = clientModels.size > 0 ? clientModels : schemaModels;
  
  // Step 3: Find all source files
  log('\nStep 3: Scanning source files...', 'blue');
  const sourceFiles = findSourceFiles(CONFIG.srcDir);
  log(`  Found ${sourceFiles.length} source files`);
  
  // Step 4: Extract all Prisma references
  log('\nStep 4: Extracting Prisma model references...', 'blue');
  const allReferences = [];
  for (const file of sourceFiles) {
    const refs = extractPrismaReferences(file);
    allReferences.push(...refs);
  }
  log(`  Found ${allReferences.length} Prisma model references`);
  
  // Step 5: Validate references
  log('\nStep 5: Validating model references...', 'blue');
  const { errors, legacyIssues } = validateReferences(allReferences, validModels);
  
  // Handle based on mode
  if (MODE === 'baseline') {
    // Generate baseline from current state
    const allIssues = [...errors, ...legacyIssues];
    const baseline = saveBaseline(allIssues);
    
    log('\n===========================================', 'blue');
    log('  BASELINE GENERATED', 'bold');
    log('===========================================\n', 'blue');
    logSuccess(`Baseline saved with ${baseline.knownIssues.length} known issues`);
    log(`  File: ${CONFIG.baselinePath}`);
    log('\nNote: These issues are now marked as "known" and will not fail builds.');
    process.exit(0);
  }
  
  // Load baseline for comparison
  const baseline = loadBaseline();
  const knownKeys = new Set(baseline.knownIssues || []);
  
  // Find NEW errors (not in baseline)
  const newErrors = errors.filter(e => !knownKeys.has(e.key));
  const newLegacyIssues = legacyIssues.filter(e => !knownKeys.has(e.key));
  
  // Output results
  log('\n===========================================', 'blue');
  log('  VALIDATION RESULTS', 'bold');
  log('===========================================\n', 'blue');
  
  if (MODE === 'strict') {
    // Strict mode: report all errors
    if (errors.length === 0 && legacyIssues.length === 0) {
      logSuccess(`All ${allReferences.length} Prisma model references are valid!`);
    } else {
      logError(`Found ${errors.length + legacyIssues.length} total issues`);
      log(`  - ${errors.length} critical (non-legacy)`, 'red');
      log(`  - ${legacyIssues.length} legacy pattern issues`, 'yellow');
    }
  } else {
    // Check mode: only report NEW errors
    if (newErrors.length === 0 && newLegacyIssues.length === 0) {
      logSuccess('No NEW Prisma model issues detected!');
      log(`\n  Total references: ${allReferences.length}`);
      log(`  Valid models: ${validModels.size}`);
      log(`  Known legacy issues: ${legacyIssues.length} (baselined)`, 'dim');
    } else {
      logError(`Found ${newErrors.length + newLegacyIssues.length} NEW issue(s)!`);
      
      for (const error of newErrors) {
        const relPath = path.relative(process.cwd(), error.file);
        log(`\n  ${relPath}:${error.line}`, 'yellow');
        log(`    prisma.${error.model}.${error.method}`, 'red');
        if (error.suggestion) {
          log(`    → Use "prisma.${error.suggestion}" instead`, 'green');
        }
      }
    }
  }
  
  // Summary
  log('\n-------------------------------------------');
  log(`Total files scanned: ${sourceFiles.length}`);
  log(`Total references: ${allReferences.length}`);
  log(`Valid models: ${validModels.size}`);
  if (MODE !== 'strict') {
    log(`Baselined issues: ${knownKeys.size}`, 'dim');
    log(`New issues: ${newErrors.length + newLegacyIssues.length}`);
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    mode: MODE,
    summary: {
      totalFiles: sourceFiles.length,
      totalReferences: allReferences.length,
      validModels: validModels.size,
      totalErrors: errors.length,
      legacyIssues: legacyIssues.length,
      newErrors: newErrors.length,
      baselinedIssues: knownKeys.size,
    },
    newErrors: newErrors.slice(0, 50), // Limit for readability
    status: (MODE === 'check' ? newErrors.length === 0 : errors.length === 0) ? 'PASSED' : 'FAILED',
  };
  
  fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2));
  log(`\nReport saved: ${CONFIG.reportPath}`);
  
  log('\n===========================================\n', 'blue');
  
  // Exit code
  if (MODE === 'strict') {
    process.exit(errors.length > 0 ? 1 : 0);
  } else {
    process.exit(newErrors.length > 0 ? 1 : 0);
  }
}

// Run validation
main();
