/**
 * PHASE 3A FIX: Repair Pre-existing Syntax Errors (Extended)
 * 
 * Pattern: .method(param: type => ...) -> .method((param: type) => ...)
 */

const fs = require('fs');
const path = require('path');

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  syntaxFixes: 0,
};

// Extended fix patterns for all common callback parameter names
const SYNTAX_FIX_PATTERNS = [
  // .method(X: any => ...) -> .method((X: any) => ...) for ALL method names and param names
  { 
    regex: /\.(\w+)\((\w+): any =>/g, 
    replacement: '.$1(($2: any) =>' 
  },
  // .method(X: string => ...) -> .method((X: string) => ...)
  { 
    regex: /\.(\w+)\((\w+): string =>/g, 
    replacement: '.$1(($2: string) =>' 
  },
  // .method(X: number => ...) -> .method((X: number) => ...)
  { 
    regex: /\.(\w+)\((\w+): number =>/g, 
    replacement: '.$1(($2: number) =>' 
  },
  // Two-param reduce patterns
  {
    regex: /\.reduce\(\((\w+): any, (\w+): any\): any, any =>/g,
    replacement: '.reduce(($1: any, $2: any) =>'
  },
  {
    regex: /\.reduce\(\((\w+), (\w+)\): any, any =>/g,
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
  console.log('Fixing remaining syntax errors...');
  
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) {
      console.log(`  ✓ Fixed: ${path.relative(srcDir, file)}`);
    }
  }
  
  console.log('');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Syntax fixes: ${stats.syntaxFixes}`);
}

main();
