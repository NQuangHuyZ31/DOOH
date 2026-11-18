<?php

namespace Modules\Core\Support;

/**
 * Discovers and manages registered modules and their compiled Mix/Webpack entrypoints.
 * Modeled after cms-tiktok-crawler's ModuleRegistry pattern.
 */
class ModuleRegistry
{
    /** @var array<string, string>|null */
    private ?array $modules = null;

    /** @var array<string, mixed>|null */
    private ?array $entrypointsCache = null;

    /** @var array<string, string>|null */
    private ?array $mixManifestCache = null;

    /** @var array<string, bool> */
    private array $dommedCss = [];

    /** @var array<string, bool> */
    private array $dommedJs = [];

    /**
     * @param string|null $basePath
     * @param string[] $disabled
     */
    public function __construct(
        private readonly ?string $basePath = null,
        private readonly array $disabled = [],
    ) {}

    /**
     * @return array<string, string>
     */
    public function all(): array
    {
        if ($this->modules !== null) {
            return $this->modules;
        }

        $base = $this->basePath ?? base_path('modules');
        $basePath = (str_starts_with($base, '/') || preg_match('/^[a-zA-Z]:/', $base))
            ? $base
            : base_path($base);
        $modules = [];

        foreach (glob($basePath . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
            $name = basename($dir);

            if (!is_dir($dir . '/src') && !is_dir($dir . '/routes') && !is_dir($dir . '/resources')) {
                continue;
            }

            if ($name !== 'Core' && in_array($name, $this->disabled, true)) {
                continue;
            }

            $modules[$name] = $dir;
        }

        ksort($modules);

        return $this->modules = $modules;
    }

    /**
     * @return array<string, array{name: string, route_prefix: string, js: string[], css: string[]}>
     */
    public function getEntrypoints(): array
    {
        if ($this->entrypointsCache !== null) {
            return $this->entrypointsCache;
        }

        $manifestPath = public_path('entrypoints.json');
        if (!file_exists($manifestPath)) {
            $manifestPath = public_path('entrypoint.json');
        }

        if (!file_exists($manifestPath)) {
            return $this->entrypointsCache = [];
        }

        $content = (string) file_get_contents($manifestPath);
        $decoded = json_decode($content, true);

        return $this->entrypointsCache = (is_array($decoded) ? $decoded : []);
    }

    public function renderCss(?string $module = null): string
    {
        $targetModule = $module ?: 'all';
        $endpoints = $this->getEntrypoints();

        $cssFiles = [];
        if (isset($endpoints['Core']['css'])) {
            foreach ($endpoints['Core']['css'] as $file) {
                if (!in_array($file, $cssFiles, true)) {
                    $cssFiles[] = $file;
                }
            }
        }

        if ($targetModule === 'all') {
            foreach ($endpoints as $modName => $modConfig) {
                if ($modName === 'Core' || in_array($modName, $this->disabled, true)) {
                    continue;
                }
                if (isset($modConfig['css']) && is_array($modConfig['css'])) {
                    foreach ($modConfig['css'] as $file) {
                        if (!in_array($file, $cssFiles, true)) {
                            $cssFiles[] = $file;
                        }
                    }
                }
            }
        } elseif (
            $targetModule !== 'Core' &&
            !in_array($targetModule, $this->disabled, true) &&
            isset($endpoints[$targetModule]['css'])
        ) {
            foreach ($endpoints[$targetModule]['css'] as $file) {
                if (!in_array($file, $cssFiles, true)) {
                    $cssFiles[] = $file;
                }
            }
        }

        $html = [];
        foreach ($cssFiles as $file) {
            $url = $this->resolveAssetUrl($file);
            if (isset($this->dommedCss[$url])) {
                continue;
            }

            $this->dommedCss[$url] = true;
            $html[] = sprintf('<link rel="stylesheet" href="%s">', e($url));
        }

        return implode("\n    ", $html);
    }

    /**
     * Render HTML <script src="..."> tags in deterministic order:
     * 1. Core vendor runtime (/modules/Core/vendor.js)
     * 2. Feature module scripts (/modules/<Module>/index.js) which call registerRoutes(...)
     * 3. Core bootstrap script (/modules/Core/index.js) which mounts React Router
     */
    public function renderJs(?string $module = null): string
    {
        $targetModule = $module ?: 'all';
        $endpoints = $this->getEntrypoints();

        $vendorFiles = [];
        $coreAppFiles = [];
        $moduleFiles = [];

        if (isset($endpoints['Core']['js']) && is_array($endpoints['Core']['js'])) {
            foreach ($endpoints['Core']['js'] as $file) {
                $clean = explode('?', (string) $file)[0];
                if (str_ends_with($clean, '/vendor.js')) {
                    $vendorFiles[] = $file;
                } else {
                    $coreAppFiles[] = $file;
                }
            }
        }

        if ($targetModule === 'all') {
            foreach ($endpoints as $modName => $modConfig) {
                if ($modName === 'Core' || in_array($modName, $this->disabled, true)) {
                    continue;
                }
                if (isset($modConfig['js']) && is_array($modConfig['js'])) {
                    foreach ($modConfig['js'] as $file) {
                        if (!in_array($file, $moduleFiles, true)) {
                            $moduleFiles[] = $file;
                        }
                    }
                }
            }
        } elseif (
            $targetModule !== 'Core' &&
            !in_array($targetModule, $this->disabled, true) &&
            isset($endpoints[$targetModule]['js'])
        ) {
            foreach ($endpoints[$targetModule]['js'] as $file) {
                if (!in_array($file, $moduleFiles, true)) {
                    $moduleFiles[] = $file;
                }
            }
        }

        $jsFiles = array_merge($vendorFiles, $moduleFiles, $coreAppFiles);

        $html = [];
        foreach ($jsFiles as $file) {
            $url = $this->resolveAssetUrl($file);
            if (isset($this->dommedJs[$url])) {
                continue;
            }

            $this->dommedJs[$url] = true;
            $html[] = sprintf('<script src="%s"></script>', e($url));
        }

        return implode("\n    ", $html);
    }

    public function renderAssets(?string $module = null): string
    {
        $css = $this->renderCss($module);
        $js = $this->renderJs($module);

        return trim($css . ($css && $js ? "\n    " : '') . $js);
    }

    public function resetDomCache(): void
    {
        $this->dommedCss = [];
        $this->dommedJs = [];
        $this->entrypointsCache = null;
        $this->mixManifestCache = null;
    }

    public function resolveAssetUrl(string $file): string
    {
        $path = $file;

        if (!str_contains($path, '?')) {
            $manifest = $this->getMixManifest();
            $cleanPath = '/' . ltrim($path, '/');
            if (isset($manifest[$cleanPath])) {
                $path = $manifest[$cleanPath];
            }
        }

        if (config('app.asset_url')) {
            return asset(ltrim($path, '/'));
        }

        return '/' . ltrim($path, '/');
    }

    /**
     * @return array<string, string>
     */
    public function getMixManifest(): array
    {
        if ($this->mixManifestCache !== null) {
            return $this->mixManifestCache;
        }

        $manifestPath = public_path('mix-manifest.json');
        if (!file_exists($manifestPath)) {
            return $this->mixManifestCache = [];
        }

        $content = (string) file_get_contents($manifestPath);
        $decoded = json_decode($content, true);

        return $this->mixManifestCache = (is_array($decoded) ? $decoded : []);
    }
}
