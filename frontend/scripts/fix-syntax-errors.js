/**
 * PHASE 3A FIX: Repair Pre-existing Syntax Errors
 * 
 * The codebase has 439 TS1005 syntax errors from a previous
 * transformation that added type annotations incorrectly.
 * 
 * Pattern to fix: .method(param: any => ...) -> .method((param: any) => ...)
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  syntaxFixes: 0,
  modifiedFiles: [],
};

// Fix patterns for malformed type annotations in arrow functions
const SYNTAX_FIX_PATTERNS = [
  // .method(X: any => ...) -> .method((X: any) => ...)
  { 
    regex: /\.(\w+)\(([a-z]): any =>/g, 
    replacement: '.$1(($2: any) =>' 
  },
  // .method(X: string => ...) -> .method((X: string) => ...)
  { 
    regex: /\.(\w+)\(([a-z]): string =>/g, 
    replacement: '.$1(($2: string) =>' 
  },
  // Two-param: .method((acc, x): any, any => ...) - various broken patterns
  {
    regex: /\.reduce\(\(([a-z]+), ([a-z])\): any, any =>/g,
    replacement: '.reduce(($1: any, $2: any) =>'
  },
  // Fix double-typed reduce
  {
    regex: /\.reduce\(\(([a-z]+): any, ([a-z]): any\): any, any =>/g,
    replacement: '.reduce(($1: any, $2: any) =>'
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;
    
    for (const pattern of SYNTAX_FIX_PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches) {
        content = content.replace(pattern.regex, pattern.replacement);
        localFixes += matches.length;
      }
    }
    
    stats.syntaxFixes += localFixes;
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      stats.filesModified++;
      stats.modifiedFiles.push(path.relative(process.cwd(), filePath));
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
      if (['node_modules', '.next', 'dist', '.git', 'scripts'].includes(entry.name)) {
        continue;
      }
      findTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 3A: Fixing Pre-existing Syntax Errors (TS1005)         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  // Also check middleware.ts
  const middlewarePath = path.resolve(__dirname, '../middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    files.push(middlewarePath);
  }
  
  console.log(`Processing ${files.length} TypeScript files`);
  console.log('');
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ Fixed: ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SYNTAX FIX RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Files processed:  ${stats.filesProcessed}`);
  console.log(`  Files modified:   ${stats.filesModified}`);
  console.log(`  Syntax fixes:     ${stats.syntaxFixes}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main();
