#!/usr/bin/env node
const path = require('path');

const args = process.argv.slice(2);
const isDev = args.includes('--dev') || args.includes('--development');
const isProd = !isDev;
const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
const moduleName = nonFlagArgs[0] || 'all';

process.env.NODE_ENV = isProd ? 'production' : 'development';
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=8192`.trim();
}

console.log(`\n======================================================`);
console.log(` DOOH CMS - Modular Build Runner (Laravel Mix / Webpack)`);
console.log(` Target Module : ${moduleName.toUpperCase()}`);
console.log(` Environment   : ${isProd ? 'PRODUCTION (Optimized & Minified)' : 'DEVELOPMENT'}`);
console.log(`======================================================\n`);

process.env.MIX_MODULES = moduleName.toLowerCase() === 'all' ? '' : moduleName;

const binDir = path.resolve(__dirname, '../node_modules/.bin');
process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;

process.argv = [process.argv[0], path.resolve(__dirname, '../node_modules/laravel-mix/bin/cli.js')];
if (isProd) {
    process.argv.push('--production');
}

require('../node_modules/laravel-mix/bin/cli.js');
