'use strict';

/**
 * Laravel Mix (Webpack 5) configuration for DOOH CMS (Ureka Modular Architecture)
 *
 * Each module in modules/<Name>/ compiles into:
 *     public/modules/<Name>/index.js
 *     public/modules/<Name>/app.css (if CSS exists)
 * Core additionally compiles:
 *     public/modules/Core/vendor.js (shared libraries: react, antd, axios, redux, etc.)
 * public/entrypoints.json maps modules to their compiled assets for Blade @moduleCss / @moduleJs.
 *
 * Usage:
 *     npm run mix                       # Build all modules
 *     npm run mix:core                  # Build only Core module
 *     npm run mix:auth                  # Build Core + Auth module
 *     npm run mix:venue                 # Build Core + Venue module
 *     npm run mix:module <Name>         # Build Core + specified <Name> module
 *     npm run mix:prod                  # Build all modules in production mode
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mix = require('laravel-mix');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { discoverModules, aliases, root } = require('./build/modules');
const EntrypointsPlugin = require('./build/EntrypointsPlugin');
const StableVendorIdsPlugin = require('./build/StableVendorIdsPlugin');

try {
    const dotenv = require('dotenv');
    const dotenvExpand = require('dotenv-expand');
    dotenvExpand.expand(dotenv.config({ path: path.join(root, '.env') }));
} catch {
    // Ignore if .env or dotenv is absent
}

try {
    require('webpackbar').prototype.apply = function apply() {};
} catch {
    // Ignore if webpackbar is absent
}

// 1. Resolve target modules to compile
const requested = (process.env.MIX_MODULES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const allModules = discoverModules();

// Core is always included to keep shared vendor runtime synchronized
const selected = requested.length
    ? allModules.filter(
          (m) =>
              m.name.toLowerCase() === 'core' ||
              requested.includes(m.name.toLowerCase()) ||
              requested.includes(m.id.toLowerCase())
      )
    : allModules;

console.log(
    `[Laravel Mix] Build Target: ${requested.length ? requested.join(', ').toUpperCase() : 'ALL MODULES'} | Compiling: [${selected.map((m) => m.name).join(', ')}]`
);

// Preserve and merge mix-manifest.json across partial single-module builds
const Mix = require('laravel-mix/src/Mix');
const mixManifest = Mix.primary.manifest;
const manifestPath = path.join(root, 'public', 'mix-manifest.json');
if (fs.existsSync(manifestPath)) {
    try {
        const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        mixManifest.manifest = { ...existingManifest };
    } catch {
        // Ignore invalid JSON
    }
}

function safeWriteFileSync(filePath, content, retries = 5, delayMs = 150) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content, 'utf8');
            return;
        } catch (err) {
            if (attempt === retries) throw err;
            const stop = Date.now() + delayMs;
            while (Date.now() < stop) {}
        }
    }
}

mixManifest.refresh = function () {
    const manifestFile = this.path();
    if (!manifestFile) return this;

    let existing = {};
    if (fs.existsSync(manifestFile)) {
        try {
            existing = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        } catch {
            existing = {};
        }
    }

    this.manifest = { ...existing, ...this.manifest };

    const publicModulesDir = path.join(root, 'public', 'modules');
    if (fs.existsSync(publicModulesDir)) {
        const moduleDirs = fs
            .readdirSync(publicModulesDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);

        for (const mod of moduleDirs) {
            const jsKey = `/modules/${mod}/index.js`;
            const jsFile = path.join(publicModulesDir, mod, 'index.js');
            if (fs.existsSync(jsFile) && !this.manifest[jsKey]) {
                this.manifest[jsKey] = jsKey;
            }

            const cssKey = `/modules/${mod}/app.css`;
            const cssFile = path.join(publicModulesDir, mod, 'app.css');
            if (fs.existsSync(cssFile) && !this.manifest[cssKey]) {
                this.manifest[cssKey] = cssKey;
            }
        }
    }

    safeWriteFileSync(manifestFile, JSON.stringify(this.manifest, null, 4));

    const entrypointsPath = path.join(root, 'public', 'entrypoints.json');
    if (fs.existsSync(entrypointsPath)) {
        try {
            const entrypoints = JSON.parse(fs.readFileSync(entrypointsPath, 'utf8'));
            let modified = false;

            const resolveVersioned = (filePath) => {
                if (!filePath || typeof filePath !== 'string') return filePath;
                const clean = filePath.split('?')[0];
                const key = clean.startsWith('/') ? clean : `/${clean}`;
                return this.manifest[key] || filePath;
            };

            for (const modName of Object.keys(entrypoints)) {
                if (Array.isArray(entrypoints[modName].js)) {
                    entrypoints[modName].js = entrypoints[modName].js.map(resolveVersioned);
                    modified = true;
                }
                if (Array.isArray(entrypoints[modName].css)) {
                    entrypoints[modName].css = entrypoints[modName].css.map(resolveVersioned);
                    modified = true;
                }
            }

            if (modified) {
                safeWriteFileSync(entrypointsPath, JSON.stringify(entrypoints, null, 2));
            }
        } catch {
            // Ignore parse error
        }
    }

    return this;
};

// 2. Vendor chunk settings
const VENDOR_TEST = /[\\/]node_modules[\\/]/;
const VENDOR_CHUNK = 'modules/Core/vendor';

mix.setPublicPath('public');
mix.disableNotifications();

mix.options({
    processCssUrls: false,
    terser: {
        extractComments: false,
        parallel: false,
    },
});

mix.babelConfig({
    presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
});

// 3. Register module entries
for (const m of selected) {
    mix.js(m.entry, `${m.outDir}/index.js`);

    const cssPath = path.join(m.dir, 'resources/css/app.css');
    if (fs.existsSync(cssPath)) {
        mix.postCss(cssPath, `${m.outDir}/app.css`);
    }
}

// 4. Webpack configuration
mix.webpackConfig({
    cache: {
        type: 'filesystem',
    },
    resolve: {
        alias: aliases(),
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    output: {
        publicPath: 'auto',
        uniqueName: 'dooh_cms',
        chunkLoadingGlobal: 'webpackChunk_dooh_cms',
        chunkFilename: 'modules/Core/chunks/[name].js',
    },
    optimization: {
        moduleIds: mix.inProduction() ? 'deterministic' : 'named',
        runtimeChunk: {
            name: VENDOR_CHUNK,
        },
        splitChunks: {
            cacheGroups: {
                defaultVendors: false,
                default: false,
                vendor: {
                    test: VENDOR_TEST,
                    name: VENDOR_CHUNK,
                    chunks: 'all',
                    enforce: true,
                    priority: 20,
                },
            },
        },
    },
    plugins: [
        new StableVendorIdsPlugin({
            test: VENDOR_TEST,
            chunks: [VENDOR_CHUNK],
        }),
        new webpack.DefinePlugin({
            'import.meta.glob': 'undefined',
            'import.meta.env.VITE_ADMIN_PREFIX': JSON.stringify(
                process.env.VITE_ADMIN_PREFIX || process.env.CMS_ADMIN_PREFIX || '/admin'
            ),
            'import.meta.env.VITE_API_PREFIX': JSON.stringify(
                process.env.VITE_API_PREFIX || process.env.CMS_API_PREFIX || '/admin/api'
            ),
            'import.meta.env.VITE_API_URL': JSON.stringify(
                process.env.VITE_API_URL || process.env.MIX_API_URL || ''
            ),
            'process.env.VITE_API_URL': JSON.stringify(
                process.env.VITE_API_URL || process.env.MIX_API_URL || ''
            ),
        }),
        new EntrypointsPlugin({
            file: path.join(root, 'public', 'entrypoints.json'),
        }),
    ],
    performance: { hints: false },
});

mix.override((config) => {
    for (const plugin of config.plugins) {
        if (plugin.constructor && plugin.constructor.name === 'MiniCssExtractPlugin') {
            plugin.options.filename = (pathData) => {
                const chunkName = (pathData.chunk && pathData.chunk.name) || '';
                if (chunkName.endsWith('.css')) return chunkName;
                const base = chunkName.replace(/\/(index|app)$/, '');
                return `${base}/app.css`;
            };
        }
    }
});

if (mix.inProduction()) {
    mix.version();
}
