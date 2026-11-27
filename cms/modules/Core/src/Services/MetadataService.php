<?php

namespace Modules\Core\Services;

class MetadataService
{
    /**
     * @param array<string, mixed>|null $metadataConfig
     * @param array<string, mixed>|null $modulesConfig
     */
    public function __construct(
        private readonly ?array $metadataConfig = null,
        private readonly ?array $modulesConfig = null,
        private readonly ?string $timezone = null,
    ) {}

    /**
     * Assemble shared CMS metadata and optionally filter by top-level keys.
     *
     * @param string|array<int, string>|null $keys
     * @return array<string, mixed>
     */
    public function getMetadata(string|array|null $keys = null): array
    {
        $metadata = $this->resolveMetadataConfig();
        $modules = $this->resolveModulesConfig();

        $disabledModules = is_array($modules['disabled'] ?? null) ? $modules['disabled'] : [];
        $allModules = is_array($modules['modules'] ?? null) ? $modules['modules'] : [];
        $enabledModules = array_values(array_filter(
            $allModules,
            static fn(string $module): bool => $module === 'Core' || !in_array($module, $disabledModules, true)
        ));

        $payload = [
            'app' => [
                'default_module' => (string) ($modules['default_module'] ?? 'venues'),
                'timezone' => $this->resolveTimezone(),
                'modules' => $enabledModules,
            ],
            'pagination' => $metadata['pagination'] ?? [
                'default_per_page' => 10,
                'per_page_options' => [10, 20, 50, 100],
            ],
            'statuses' => $metadata['statuses'] ?? [],
            'enums' => $metadata['enums'] ?? [],
        ];

        $normalizedKeys = $this->normalizeKeys($keys);
        if ($normalizedKeys === []) {
            return $payload;
        }

        return array_intersect_key($payload, array_flip($normalizedKeys));
    }

    /**
     * @param string|array<int, string>|null $keys
     * @return string[]
     */
    protected function normalizeKeys(string|array|null $keys): array
    {
        if ($keys === null || $keys === '' || $keys === []) {
            return [];
        }

        $rawKeys = is_array($keys) ? $keys : explode(',', $keys);
        $cleaned = [];

        foreach ($rawKeys as $item) {
            foreach (explode(',', (string) $item) as $part) {
                $trimmed = trim($part);
                if ($trimmed !== '' && !in_array($trimmed, $cleaned, true)) {
                    $cleaned[] = $trimmed;
                }
            }
        }

        return $cleaned;
    }

    /**
     * @return array<string, mixed>
     */
    protected function resolveMetadataConfig(): array
    {
        if ($this->metadataConfig !== null) {
            return $this->metadataConfig;
        }

        if (function_exists('app') && app()->bound('config')) {
            $configured = config('metadata');
            if (is_array($configured) && $configured !== []) {
                return $configured;
            }
        }

        $file = dirname(__DIR__, 2) . '/configs/metadata.php';

        return file_exists($file) ? (require $file) : [];
    }

    /**
     * @return array<string, mixed>
     */
    protected function resolveModulesConfig(): array
    {
        if ($this->modulesConfig !== null) {
            return $this->modulesConfig;
        }

        if (function_exists('app') && app()->bound('config')) {
            $configured = config('modules');
            if (is_array($configured) && $configured !== []) {
                return $configured;
            }
        }

        $file = dirname(__DIR__, 2) . '/configs/modules.php';

        return file_exists($file) ? (require $file) : [];
    }

    protected function resolveTimezone(): string
    {
        if ($this->timezone !== null) {
            return $this->timezone;
        }

        if (function_exists('app') && app()->bound('config')) {
            return (string) config('app.timezone', 'UTC');
        }

        return 'UTC';
    }

	public static function enumValues(string $enumKey): array
	{
		$items = (new self())->resolveMetadataConfig()['enums'][$enumKey] ?? [];

		return array_values(array_filter(array_column($items, 'value'), fn ($v) => is_string($v) && $v !== ''));
	}

	public static function defaultEnumValue(string $enumKey, string $fallback = ''): string
	{
		$values = self::enumValues($enumKey);

		return $values[0] ?? $fallback;
	}
}
