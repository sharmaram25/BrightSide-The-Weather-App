const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if png-to-ico is installed
try {
  require.resolve('png-to-ico');
} catch (e) {
  console.log('Installing png-to-ico package...');
  exec('npm install png-to-ico', (error) => {
    if (error) {
      console.error('Error installing png-to-ico:', error);
      return;
    }
    console.log('png-to-ico installed successfully. Rerun this script.');
    process.exit(0);
  });
  return;
}

const pngToIco = require('png-to-ico');

async function createIco() {
  try {
    const publicDir = path.join(__dirname, '../public');
    const favicon16Path = path.join(publicDir, 'favicon-16.png');
    const favicon32Path = path.join(publicDir, 'favicon-32.png');
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');

    console.log('Creating favicon.ico from PNG files...');
    
    // Convert to ICO
    const icoBuffer = await pngToIco([favicon16Path, favicon32Path]);
    
    // Write the ICO file
    fs.writeFileSync(faviconIcoPath, icoBuffer);
    
    console.log(`favicon.ico created successfully at ${faviconIcoPath}`);
  } catch (error) {
    console.error('Error creating favicon.ico:', error);
  }
}

createIco();
