import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['modules/Core/resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@core': path.resolve(__dirname, 'modules/Core/resources/js'),
            '@modules': path.resolve(__dirname, 'modules'),
        },
    },
});
