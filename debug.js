const fs = require('fs');
const path = require('path');

console.log('🔍 ThreeCraft Debug Checker\n');

// Check if node_modules exists
console.log('1. Checking dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules directory exists');

    // Check for key dependencies
    const keyDeps = ['three', 'vite', 'typescript'];
    keyDeps.forEach(dep => {
        if (fs.existsSync(`node_modules/${dep}`)) {
            console.log(`✅ ${dep} is installed`);
        } else {
            console.log(`❌ ${dep} is missing`);
        }
    });
} else {
    console.log('❌ node_modules directory missing - run npm install');
}

// Check for required files
console.log('\n2. Checking required files...');
const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'index.html',
    'src/main.ts',
    'src/core/Game.ts',
    'src/core/Launcher.ts'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

// Check for environment variables
console.log('\n3. Checking environment setup...');
const envFile = '.env';
if (fs.existsSync(envFile)) {
    console.log('✅ .env file exists');
} else {
    console.log('⚠️  .env file missing (this might be okay if using defaults)');
}

// Check for assets
console.log('\n4. Checking assets...');
const assets = [
    'src/assets/sounds',
    'src/assets/textures',
    'public/menu-bg.jpeg'
];

assets.forEach(asset => {
    if (fs.existsSync(asset)) {
        console.log(`✅ ${asset} exists`);
    } else {
        console.log(`❌ ${asset} missing`);
    }
});

// Check package.json scripts
console.log('\n5. Checking package.json scripts...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.dev) {
        console.log('✅ dev script found:', packageJson.scripts.dev);
    } else {
        console.log('❌ dev script missing');
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
}

console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Open the browser console to check for errors');
console.log('3. If you see errors, they will help identify the specific issue');
console.log('4. You can also open test.html in your browser to run basic diagnostics');
