/**
 * PHASE 3C-1: Remaining Model Name Fixes
 */

const fs = require('fs');
const path = require('path');

const stats = { filesProcessed: 0, filesModified: 0, fixes: 0 };

const MODEL_NAME_FIXES = {
  // Education - contact model
  'prisma.contact.': 'prisma.crm_contacts.',
  
  // SVM promotion usage - correct model name
  'prisma.svm_promotion_usage': 'prisma.svm_promotions_usage',
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let localFixes = 0;
    
    for (const [wrong, correct] of Object.entries(MODEL_NAME_FIXES)) {
      while (content.includes(wrong)) {
        content = content.replace(wrong, correct);
        localFixes++;
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
  console.log('PHASE 3C-1: Remaining Model Name Fixes');
  const srcDir = path.resolve(__dirname, '../src');
  const files = findTypeScriptFiles(srcDir);
  
  for (const file of files) {
    stats.filesProcessed++;
    const modified = processFile(file);
    if (modified) console.log(`  ✓ ${path.relative(srcDir, file)}`);
  }
  
  console.log(`\nFiles modified: ${stats.filesModified}, Fixes: ${stats.fixes}`);
}

main();
