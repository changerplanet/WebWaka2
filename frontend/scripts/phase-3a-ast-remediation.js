/**
 * PHASE 3A: AST-Based TypeScript Structural Remediation
 * 
 * Authorized Error Classes:
 * - Class A: Include Relation Casing (TS2353) - 184 errors
 * - Class B: Property Access Mismatch (TS2551) - 123 errors
 * - Class D: Implicit Any Parameters (TS7006) - 64 errors
 * - Class E: Include "Did you mean" (TS2561) - 55 errors
 * 
 * Implementation: AST-based transforms only
 * No regex, no sed, no manual edits
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION: Relation Mappings from Prisma Schema Analysis
// ============================================================================

// Class A & E: Include clause relation name corrections
// Maps: model -> { wrongName: correctName }
const INCLUDE_RELATION_FIXES = {
  // Generic fixes that apply across models
  '_global': {
    // Integration module
    'provider': 'integration_providers',
    'instance': 'integration_instances',
    'instances': 'integration_instances',
    // Inventory module
    'items': null, // Context-dependent, handled specially
    'warehouse': 'wh_warehouses',
    'audit': 'inv_audits',
    // HR module
    'employeeProfile': 'hr_employee_profiles',
    'calculations': 'hr_payroll_calculations',
    'payslips': 'hr_payslips',
    // Developer module
    'apiKeys': 'api_keys',
    'app': 'developer_apps',
    // Tenant relations - casing fixes
    'Subscription': 'subscription',
    'BusinessProfile': 'businessProfile',
    'Tenant': 'tenant',
    'Partner': 'partner',
    'PlatformInstance': 'platformInstance',
    // Template relations
    'ProductCategory': 'sf_template_categories',
    // Logistics
    'areas': 'log_zone_areas',
    'rates': null, // Context-dependent
    'driver': 'log_drivers',
    'vehicle': 'log_vehicles',
    'job': 'log_jobs',
    // Marketing
    'steps': 'mkt_workflow_steps',
    'enrollments': 'mkt_workflow_enrollments',
    // Legal
    'category': null, // Context-dependent
    // Procurement
    'supplier': 'proc_suppliers',
    'receipts': 'proc_goods_receipts',
    'purchaseOrder': 'proc_purchase_orders',
    // Transfer
    'sourceWarehouse': 'wh_warehouses',
    'destinationWarehouse': 'wh_warehouses',
    'transfer': 'inv_transfers',
  }
};

// Class B: Property access corrections after Prisma queries
const PROPERTY_ACCESS_FIXES = {
  'provider': 'integration_providers',
  'instance': 'integration_instances',
  'product': 'Product',
  'variant': 'ProductVariant',
  'employeeProfile': 'hr_employee_profiles',
  'warehouse': 'wh_warehouses',
  'audit': 'inv_audits',
};

// Stats tracking
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  classAFixes: 0,
  classBFixes: 0,
  classDFixes: 0,
  classEFixes: 0,
  skippedEdgeCases: [],
  modifiedFiles: [],
};

// ============================================================================
// AST ANALYSIS HELPERS
// ============================================================================

function isInsideIncludeClause(node) {
  let current = node.parent;
  let depth = 0;
  while (current && depth < 10) {
    if (ts.isPropertyAssignment(current) && ts.isIdentifier(current.name)) {
      const name = current.name.text;
      if (name === 'include' || name === 'select') {
        return true;
      }
    }
    current = current.parent;
    depth++;
  }
  return false;
}

function isInsideCountSelect(node) {
  let current = node.parent;
  let depth = 0;
  while (current && depth < 10) {
    if (ts.isPropertyAssignment(current) && ts.isIdentifier(current.name)) {
      if (current.name.text === '_count') {
        return true;
      }
    }
    current = current.parent;
    depth++;
  }
  return false;
}

function getContainingModelContext(node) {
  // Try to determine which Prisma model we're querying
  let current = node;
  while (current) {
    if (ts.isCallExpression(current)) {
      const expr = current.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        const methodName = expr.name.text;
        if (['findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert', 'delete'].includes(methodName)) {
          // Look for prisma.modelName pattern
          const obj = expr.expression;
          if (ts.isPropertyAccessExpression(obj) && ts.isIdentifier(obj.name)) {
            return obj.name.text;
          }
        }
      }
    }
    current = current.parent;
  }
  return null;
}

function shouldFixPropertyAccess(node, propName) {
  // Don't fix if it's inside an object literal (defining, not accessing)
  if (node.parent && ts.isPropertyAssignment(node.parent)) {
    return false;
  }
  
  // Don't fix if it's the target of an assignment
  if (node.parent && ts.isBinaryExpression(node.parent) && 
      node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      node.parent.left === node) {
    return false;
  }
  
  // Only fix specific known problematic patterns
  if (propName === 'provider' || propName === 'instance') {
    return true;
  }
  
  if (propName === 'product' || propName === 'variant') {
    return true;
  }
  
  if (propName === 'employeeProfile') {
    return true;
  }
  
  return false;
}

// ============================================================================
// AST TRANSFORMATION
// ============================================================================

function transformSourceFile(sourceFile) {
  let modified = false;
  const fixes = [];
  
  function visit(node) {
    // Class A & E: Fix include clause property names
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      const propName = node.name.text;
      
      if (isInsideIncludeClause(node) || isInsideCountSelect(node)) {
        const globalFixes = INCLUDE_RELATION_FIXES['_global'];
        if (globalFixes[propName] !== undefined && globalFixes[propName] !== null) {
          const correctName = globalFixes[propName];
          if (correctName !== propName) {
            fixes.push({
              start: node.name.getStart(),
              end: node.name.getEnd(),
              newText: correctName,
              type: 'classA'
            });
          }
        }
      }
    }
    
    // Class B: Fix property access expressions
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      const propName = node.name.text;
      
      if (PROPERTY_ACCESS_FIXES[propName] && shouldFixPropertyAccess(node, propName)) {
        const correctName = PROPERTY_ACCESS_FIXES[propName];
        if (correctName !== propName) {
          fixes.push({
            start: node.name.getStart(),
            end: node.name.getEnd(),
            newText: correctName,
            type: 'classB'
          });
        }
      }
    }
    
    // Class D: Add type annotations to implicit any parameters
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      for (const param of node.parameters) {
        if (!param.type && ts.isIdentifier(param.name)) {
          const paramName = param.name.text;
          
          // Common callback parameter names that need typing
          if (['i', 'item', 'x', 'el', 'e', 't', 'r', 'p', 'd', 'a', 'b', 'c'].includes(paramName)) {
            // Add `: any` after parameter name
            fixes.push({
              start: param.name.getEnd(),
              end: param.name.getEnd(),
              newText: ': any',
              type: 'classD'
            });
          } else if (['sum', 'acc', 'accumulator', 'result', 'prev', 'total'].includes(paramName)) {
            fixes.push({
              start: param.name.getEnd(),
              end: param.name.getEnd(),
              newText: ': any',
              type: 'classD'
            });
          } else if (['key', 'k', 'v', 'val', 'value'].includes(paramName)) {
            fixes.push({
              start: param.name.getEnd(),
              end: param.name.getEnd(),
              newText: ': string',
              type: 'classD'
            });
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  if (fixes.length === 0) {
    return null;
  }
  
  // Apply fixes in reverse order to preserve positions
  fixes.sort((a, b) => b.start - a.start);
  
  let text = sourceFile.getFullText();
  for (const fix of fixes) {
    text = text.slice(0, fix.start) + fix.newText + text.slice(fix.end);
    
    if (fix.type === 'classA') stats.classAFixes++;
    else if (fix.type === 'classB') stats.classBFixes++;
    else if (fix.type === 'classD') stats.classDFixes++;
    else if (fix.type === 'classE') stats.classEFixes++;
  }
  
  return text;
}

// ============================================================================
// FILE PROCESSING
// ============================================================================

function processFile(filePath) {
  try {
    const sourceText = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    
    const newText = transformSourceFile(sourceFile);
    
    if (newText && newText !== sourceText) {
      fs.writeFileSync(filePath, newText, 'utf-8');
      stats.filesModified++;
      stats.modifiedFiles.push(path.relative(process.cwd(), filePath));
      return true;
    }
    
    return false;
  } catch (error) {
    stats.skippedEdgeCases.push(`${path.relative(process.cwd(), filePath)}: ${error.message}`);
    return false;
  }
}

function findTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip excluded directories
      if (['node_modules', '.next', 'dist', '.git', 'scripts', 'tests', 'migrations', '__tests__'].includes(entry.name)) {
        continue;
      }
      findTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 3A: AST-Based TypeScript Structural Remediation        ║');
  console.log('║  Authorized Classes: A, B, D, E                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  console.log(`Scanning directory: ${srcDir}`);
  
  const files = findTypeScriptFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files to process`);
  console.log('');
  
  // Filter to only process files in scope
  const scopedFiles = files.filter(f => 
    f.includes('/lib/') || f.includes('/app/api/') || f.includes('/services/')
  );
  
  console.log(`Processing ${scopedFiles.length} files in scope (/lib, /app/api, /services)`);
  console.log('');
  
  for (const file of scopedFiles) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ Modified: ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PHASE 3A RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed:  ${stats.filesProcessed}`);
  console.log(`  Files modified:   ${stats.filesModified}`);
  console.log('');
  console.log('  Fixes by Class:');
  console.log(`    Class A (Include Relation Casing):    ${stats.classAFixes}`);
  console.log(`    Class B (Property Access Mismatch):   ${stats.classBFixes}`);
  console.log(`    Class D (Implicit Any Parameters):    ${stats.classDFixes}`);
  console.log(`    Class E (Include Did-you-mean):       ${stats.classEFixes}`);
  console.log('');
  const totalFixes = stats.classAFixes + stats.classBFixes + stats.classDFixes + stats.classEFixes;
  console.log(`  Total AST Fixes: ${totalFixes}`);
  
  if (stats.skippedEdgeCases.length > 0) {
    console.log('');
    console.log('  Skipped Edge Cases:');
    stats.skippedEdgeCases.slice(0, 5).forEach(s => console.log(`    - ${s}`));
    if (stats.skippedEdgeCases.length > 5) {
      console.log(`    ... and ${stats.skippedEdgeCases.length - 5} more`);
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Write stats to JSON for report generation
  fs.writeFileSync(
    path.resolve(__dirname, '../docs/phase-3a-stats.json'),
    JSON.stringify(stats, null, 2)
  );
  
  console.log('');
  console.log('Stats saved to: docs/phase-3a-stats.json');
}

main();
