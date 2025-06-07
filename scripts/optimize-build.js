/**
 * Build Optimization Script
 * 
 * This script performs post-build optimizations:
 * 1. Logs build size information
 * 2. Can be extended for additional optimizations
 */
const fs = require('fs');
const path = require('path');

console.log('\n🚀 Starting build optimization process...');

// Path to the build directory
const buildDir = path.join(__dirname, '../build');

// Function to get directory size
function getDirectorySize(directory) {
  let totalSize = 0;
  
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  
  return totalSize;
}

// Function to format size in human-readable format
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Log build size information
try {
  const totalBuildSize = getDirectorySize(buildDir);
  const jsDir = path.join(buildDir, 'static/js');
  const cssDir = path.join(buildDir, 'static/css');
  
  const jsSize = fs.existsSync(jsDir) ? getDirectorySize(jsDir) : 0;
  const cssSize = fs.existsSync(cssDir) ? getDirectorySize(cssDir) : 0;
  
  console.log('\n📊 Build Size Information:');
  console.log(`Total Build Size: ${formatSize(totalBuildSize)}`);
  console.log(`JavaScript Size: ${formatSize(jsSize)}`);
  console.log(`CSS Size: ${formatSize(cssSize)}`);
  
  // Add a timestamp file for cache busting if needed
  fs.writeFileSync(
    path.join(buildDir, 'build-timestamp.txt'),
    new Date().toISOString()
  );
  
  console.log('\n✅ Build optimization completed successfully!\n');
} catch (error) {
  console.error('\n❌ Error during build optimization:', error);
  process.exit(1);
}
