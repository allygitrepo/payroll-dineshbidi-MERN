const fs = require('fs');
const path = require('path');
const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  }
  return filelist;
};

const files = walkSync(path.resolve('src/modules'));
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('<Pagination')) {
    // Check if it imports Pagination
    if (!content.includes('Pagination,') && !content.includes(', Pagination') && !content.match(/import\s*\{\s*Pagination\s*\}/) && !content.match(/import\s+Pagination/)) {
      console.log('Fixing import in:', file);
      
      // Calculate relative path to shared/components
      const relPath = path.relative(path.dirname(file), path.resolve('src/shared/components')).replace(/\\/g, '/');
      const importStatement = `import { Pagination } from '${relPath}';\n`;
      
      // Add the import right after the React import or at the top
      content = importStatement + content;
      fs.writeFileSync(file, content, 'utf-8');
      updatedCount++;
    }
  }
}
console.log('Fixed imports in', updatedCount, 'files.');
