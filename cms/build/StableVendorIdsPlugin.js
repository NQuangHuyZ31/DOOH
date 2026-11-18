'use strict';

/**
 * StableVendorIdsPlugin (Ureka Modular Architecture):
 *
 * Assigns immutable, path-based IDs to vendor modules and chunks so that
 * a partial build (e.g. `npm run mix:venue`) never changes module IDs or chunk IDs
 * of untouched modules previously built on disk.
 */
class StableVendorIdsPlugin {
    /**
     * @param {{ test?: RegExp, chunks?: string[] }} options
     */
    constructor(options = {}) {
        this.test = options.test || /[\\/]node_modules[\\/]/;
        this.chunks = options.chunks || ['modules/Core/vendor'];
    }

    apply(compiler) {
        compiler.hooks.compilation.tap('StableVendorIdsPlugin', (compilation) => {
            compilation.hooks.moduleIds.tap('StableVendorIdsPlugin', (modules) => {
                const { chunkGraph } = compilation;
                for (const module of modules) {
                    const resource = module.resource || (module.nameForCondition && module.nameForCondition());
                    if (!resource || chunkGraph.getModuleId(module) !== null) continue;

                    const cleanPath = resource.split('?')[0];
                    if (/\.(css|scss|less|sass|svg|png|jpe?g|gif|webp|woff2?|eot|ttf|otf)$/i.test(cleanPath)) {
                        continue;
                    }

                    const normalized = resource.replace(/\\/g, '/');
                    let id = null;

                    if (normalized.includes('/node_modules/')) {
                        id = normalized.split('/node_modules/').pop();
                    } else if (normalized.includes('/modules/')) {
                        id = 'modules/' + normalized.split('/modules/').pop();
                    }

                    if (id) {
                        chunkGraph.setModuleId(module, id);
                    }
                }
            });

            compilation.hooks.chunkIds.tap('StableVendorIdsPlugin', (chunks) => {
                for (const chunk of chunks) {
                    const name = (chunk.name || '').replace(/^\/+/, '');
                    if (chunk.id === null && name) {
                        chunk.id = name;
                        chunk.ids = [name];
                    }
                }
            });
        });
    }
}

module.exports = StableVendorIdsPlugin;
