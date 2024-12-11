const fs = require('fs');
const path = require('path');

const dirs = ['public'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

const requiredFiles = {
    'public/suggestions.html': 'suggestions.html',
    'public/style.css': 'style.css'
};

Object.entries(requiredFiles).forEach(([dest, source]) => {
    const destPath = path.join(__dirname, dest);
    const sourcePath = path.join(__dirname, source);
    
    if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${source} to ${dest}`);
    }
});

const checkRequirements = () => {
    const nodeVersion = process.version;
    console.log(`Node.js version: ${nodeVersion}`);
    
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production';
    }
    
    console.log('Environment:', process.env.NODE_ENV);
};

checkRequirements();
console.log('Setup completed successfully!'); 