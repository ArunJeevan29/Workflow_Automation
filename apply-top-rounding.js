const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Target: main card/container divs: bg-white border border-gray-200 shadow-sm (flex flex-col)
  // Replace them by adding rounded-t-md (top corners only)
  content = content.replace(
    /className="(bg-white border border-gray-200(?: shadow-sm)?(?: flex flex-col)?)">/g,
    (match, classes) => {
      if (classes.includes('rounded-t')) return match; // already has top rounding, skip
      return `className="${classes} rounded-t-md">`;
    }
  );

  // Also handle shadow-sm before flex flex-col
  content = content.replace(
    /className="bg-white border border-gray-200 shadow-sm flex flex-col"/g,
    'className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-t-md"'
  );
  content = content.replace(
    /className="bg-white border border-gray-200 shadow-sm"/g,
    'className="bg-white border border-gray-200 shadow-sm rounded-t-md"'
  );
  content = content.replace(
    /className="bg-white border border-gray-200 flex flex-col"/g,
    'className="bg-white border border-gray-200 flex flex-col rounded-t-md"'
  );
  content = content.replace(
    /className="bg-white border border-gray-200"/g,
    'className="bg-white border border-gray-200 rounded-t-md"'
  );

  // Deduplicate if added twice
  content = content.replace(/rounded-t-md rounded-t-md/g, 'rounded-t-md');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

const targetDir = path.join(__dirname, 'client', 'src');
walkDir(targetDir, processFile);
console.log('Done applying top-rounded style.');
