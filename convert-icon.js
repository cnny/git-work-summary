const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng() {
    try {
        const svgBuffer = fs.readFileSync('./icon.svg');
        
        await sharp(svgBuffer)
            .resize(128, 128)
            .png()
            .toFile('./icon.png');
            
        console.log('✅ Successfully converted Git Work Summary SVG to PNG (128x128)');
        
        // Clean up the temporary script
        fs.unlinkSync('./convert-icon.js');
        console.log('🧹 Cleaned up conversion script');
        
    } catch (error) {
        console.error('❌ Error converting SVG to PNG:', error);
    }
}

convertSvgToPng();
