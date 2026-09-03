#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function check(cmd, name, url) {
    try {
        execSync(cmd, { stdio: 'ignore' });
        return true;
    } catch {
        console.log('\n\n==============================');
        console.log(`\x1b[31m${name} is not installed!\x1b[0m`);
        console.log(`Please install ${name} from: ${url}`);
        console.log('==============================\n\n');
        process.exit(1);
    }
}

// 1. Check prerequisites
check('git --version', 'Git', 'https://git-scm.com/downloads');
check('node --version', 'Node.js', 'https://nodejs.org/');
check('npm --version', 'Node.js (npm)', 'https://nodejs.org/');
check('mongod --version', 'MongoDB', 'https://www.mongodb.com/try/download/community');

// 2. Create .env if missing
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `MONGO_URI=mongodb://localhost:27017/simpleAirline\nPORT=5000\nJWT_SECRET=your_jwt_secret\nSESSION_SECRET=your_session_secret\n`);
    console.log('Created default .env file.');
}

// 3. Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 4. Seed database
console.log('Seeding database...');
execSync('node scripts/seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 5. Show demo accounts
console.log('\nDemo accounts:');
console.log('Admin:    admin@admin.com / pswd1');
console.log('User(s):  alice@example.com / pswd1, bob@example.com / pswd1, carol@example.com / pswd1');

// 6. Start server
console.log('Starting server...');
try {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
    });
} catch (e) {
    console.log('\n\n\n\n\n\n\n==============================');
    console.log('Could not start the server automatically.');
    console.log('Please run: npm start');
    console.log('Or: node server.js');
    console.log('Then open your browser and go to: http://localhost:5000');
    console.log('==============================\n\n\n\n\n\n\n');
    process.exit(0);
}

// 7. Open browser
setTimeout(() => {
    const url = 'http://localhost:5000';
    try {
        if (process.platform === 'win32') {
            execSync(`start ${url}`);
        } else if (process.platform === 'darwin') {
            execSync(`open ${url}`);
        } else {
            execSync(`xdg-open ${url}`);
        }
    } catch (e) {
        console.log('\n\n\n\n\n\n\n\nPlease open your browser and go to: ' + url + '\n\n\n\n\n\n\n\n');
    }
}, 4000);
