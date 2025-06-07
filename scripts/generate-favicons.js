const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp package...');
  exec('npm install sharp', (error) => {
    if (error) {
      console.error('Error installing sharp:', error);
      return;
    }
    console.log('Sharp installed successfully. Rerun this script.');
    process.exit(0);
  });
  return;
}

const sharp = require('sharp');

// Ensure directories exist
const publicDir = path.join(__dirname, '../public');
const faviconSourcePath = path.join(__dirname, '../src/assets/favicon.svg');

// Define favicon sizes to generate
const sizes = [16, 32, 48, 64, 128, 192, 512];

// Generate favicon.ico (uses 16x16 and 32x32)
async function generateFavicons() {
  try {
    console.log('Generating favicons from SVG source...');
    
    // Read the SVG file
    const svgBuffer = fs.readFileSync(faviconSourcePath);
    
    // Generate favicon.ico file
    const promises = sizes.map(async (size) => {
      const outputPath = path.join(publicDir, size === 192 ? 'logo192.png' : 
                                             size === 512 ? 'logo512.png' : 
                                             `favicon-${size}.png`);
      
      console.log(`Creating ${outputPath}...`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    });
    
    await Promise.all(promises);
    
    // Create favicon.ico with 16x16 and 32x32 versions
    console.log('Creating favicon.ico...');
    
    // Use sharp to create the individual PNGs that we'll compile into an ICO
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16.png'));
    
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
      
    // For favicon.ico, we need an external library, so let's handle it gracefully
    console.log('Favicon PNGs created successfully!');
    console.log('You can use an online converter to create an ICO file from favicon-16.png and favicon-32.png');
    console.log('Or if you have ImageMagick installed, run this command:');
    console.log(`magick convert ${path.join(publicDir, 'favicon-16.png')} ${path.join(publicDir, 'favicon-32.png')} ${path.join(publicDir, 'favicon.ico')}`);
    
    // Copy a favicon.svg to public as well
    fs.copyFileSync(faviconSourcePath, path.join(publicDir, 'favicon.svg'));
    
    console.log('All favicon files generated successfully.');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
