#!/usr/bin/env node
/**
 * PRISMA MODEL VALIDATION SCRIPT
 * 
 * Purpose: Validates that all Prisma model references in code match actual
 * generated Prisma client models. Catches schema drift before runtime.
 * 
 * Usage:
 *   node scripts/validation/validate-prisma-models.js
 *   yarn validate:schema
 * 
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 * 
 * Created: January 5, 2026
 * Part of: Platform Safety Hardening
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../../src'),
  schemaPath: path.join(__dirname, '../../prisma/schema.prisma'),
  prismaClientPath: path.join(__dirname, '../../node_modules/.prisma/client/index.d.ts'),
  excludeDirs: ['node_modules', '.next', 'dist', '__tests__', 'test'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
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
  // Match lines like: get modelName(): Prisma.ModelNameDelegate<ExtArgs>;
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
  
  // Match patterns like: prisma.modelName.findMany, prisma.modelName.create, etc.
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
 * Validate all prisma references against known models
 */
function validateReferences(references, validModels) {
  const errors = [];
  const warnings = [];
  
  for (const ref of references) {
    if (!validModels.has(ref.model)) {
      // Check if it might be a case mismatch
      const lowerModel = ref.model.toLowerCase();
      const possibleMatches = Array.from(validModels).filter(
        m => m.toLowerCase() === lowerModel || 
             m.toLowerCase().replace(/_/g, '') === lowerModel.replace(/_/g, '')
      );
      
      if (possibleMatches.length > 0) {
        errors.push({
          ...ref,
          type: 'CASE_MISMATCH',
          suggestion: possibleMatches[0],
          message: `Model "${ref.model}" not found. Did you mean "${possibleMatches[0]}"?`,
        });
      } else {
        errors.push({
          ...ref,
          type: 'UNKNOWN_MODEL',
          message: `Model "${ref.model}" does not exist in Prisma schema.`,
        });
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.totalFiles,
      totalReferences: results.totalReferences,
      validModels: results.validModels,
      errors: results.errors.length,
      warnings: results.warnings.length,
    },
    errors: results.errors,
    warnings: results.warnings,
    status: results.errors.length === 0 ? 'PASSED' : 'FAILED',
  };
  
  return report;
}

/**
 * Main validation function
 */
function main() {
  log('\n===========================================', 'blue');
  log('  PRISMA MODEL VALIDATION', 'bold');
  log('  Platform Safety Hardening', 'blue');
  log('===========================================\n', 'blue');
  
  // Step 1: Extract models from schema
  log('Step 1: Reading Prisma schema...', 'blue');
  const schemaModels = extractSchemaModels();
  log(`  Found ${schemaModels.size} models in schema.prisma`);
  
  // Step 2: Extract models from generated client
  log('\nStep 2: Reading generated Prisma client...', 'blue');
  const clientModels = extractClientModels();
  log(`  Found ${clientModels.size} models in Prisma client`);
  
  // Use client models as the source of truth (they reflect actual generated code)
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
  const { errors, warnings } = validateReferences(allReferences, validModels);
  
  // Step 6: Generate report
  const report = generateReport({
    totalFiles: sourceFiles.length,
    totalReferences: allReferences.length,
    validModels: validModels.size,
    errors,
    warnings,
  });
  
  // Output results
  log('\n===========================================', 'blue');
  log('  VALIDATION RESULTS', 'bold');
  log('===========================================\n', 'blue');
  
  if (errors.length === 0) {
    logSuccess(`All ${allReferences.length} Prisma model references are valid!`);
    log(`\n  Files scanned: ${sourceFiles.length}`);
    log(`  Valid models: ${validModels.size}`);
    log(`  References checked: ${allReferences.length}`);
  } else {
    logError(`Found ${errors.length} invalid model reference(s):\n`);
    
    // Group errors by file
    const errorsByFile = {};
    for (const error of errors) {
      const relPath = path.relative(process.cwd(), error.file);
      if (!errorsByFile[relPath]) {
        errorsByFile[relPath] = [];
      }
      errorsByFile[relPath].push(error);
    }
    
    for (const [file, fileErrors] of Object.entries(errorsByFile)) {
      log(`\n  ${file}:`, 'yellow');
      for (const error of fileErrors) {
        log(`    Line ${error.line}: prisma.${error.model}.${error.method}`, 'red');
        if (error.suggestion) {
          log(`      → Suggestion: Use "prisma.${error.suggestion}" instead`, 'green');
        }
      }
    }
    
    log('\n-------------------------------------------');
    log(`Total errors: ${errors.length}`, 'red');
  }
  
  if (warnings.length > 0) {
    log(`\nWarnings: ${warnings.length}`, 'yellow');
    for (const warning of warnings) {
      logWarning(`  ${warning.message}`);
    }
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, '../../.prisma-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nReport saved to: ${reportPath}`);
  
  log('\n===========================================\n', 'blue');
  
  // Exit with appropriate code
  if (errors.length > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

// Run validation
main();
