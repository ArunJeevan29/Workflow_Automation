const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Match exact classes, ensuring they are not followed by a hyphen (so rounded doesn't match rounded-full)
  // Also ensuring we match boundaries properly.
  // Using replace with a function to ensure we only replace exact word matches
  const regex = /(?<=[\s"'`])(rounded|rounded-sm|rounded-md|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl)(?=[\s"'`])/g;
  
  content = content.replace(regex, '');
  
  // Cleanup multiple spaces inside className strings
  content = content.replace(/className=(["'`])\s+/g, 'className=$1');
  content = content.replace(/\s+(["'`])/g, '$1');
  
  // Since we replaced dynamically, we might leave double spaces "class1  class2"
  // Let's just string replace 2 spaces with 1 space a few times
  content = content.replace(/  +/g, ' ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated files for sharp edges: ${path.basename(filePath)}`);
  }
}

const targetDir = path.join(__dirname, 'client', 'src');
console.log('Targeting:', targetDir);
walkDir(targetDir, processFile);
console.log('Done removing rounded corners.');
