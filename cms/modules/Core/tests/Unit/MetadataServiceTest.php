<?php

namespace Modules\Core\Tests\Unit;

use Modules\Core\Services\MetadataService;
use PHPUnit\Framework\TestCase;

class MetadataServiceTest extends TestCase
{
    public function test_get_metadata_returns_full_structure_by_default(): void
    {
        $service = new MetadataService(
            metadataConfig: [
                'pagination' => [
                    'default_per_page' => 20,
                    'per_page_options' => [20, 50, 100],
                ],
                'statuses' => [
                    'common' => [
                        ['value' => 'active', 'label' => 'Active', 'color' => 'success'],
                    ],
                ],
                'enums' => [],
            ],
            modulesConfig: [
                'default_module' => 'venues',
                'modules' => ['Core', 'Auth', 'Venue', 'Simulator'],
                'disabled' => ['Simulator'],
            ],
            timezone: 'Asia/Ho_Chi_Minh'
        );

        $result = $service->getMetadata();

        $this->assertArrayHasKey('app', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertArrayHasKey('statuses', $result);
        $this->assertArrayHasKey('enums', $result);

        $this->assertSame('venues', $result['app']['default_module']);
        $this->assertSame('Asia/Ho_Chi_Minh', $result['app']['timezone']);
        $this->assertSame(['Core', 'Auth', 'Venue'], $result['app']['modules']);
        $this->assertSame(20, $result['pagination']['default_per_page']);
    }

    public function test_get_metadata_filters_by_comma_separated_keys(): void
    {
        $service = new MetadataService();

        $result = $service->getMetadata('statuses, enums');

        $this->assertSame(['statuses', 'enums'], array_keys($result));
        $this->assertArrayHasKey('common', $result['statuses']);
        $this->assertArrayHasKey('tags', $result['statuses']);
    }

    public function test_get_metadata_filters_by_array_keys_and_ignores_unknown_keys(): void
    {
        $service = new MetadataService();

        $result = $service->getMetadata(['pagination', 'non_existent']);

        $this->assertSame(['pagination'], array_keys($result));
        $this->assertSame(10, $result['pagination']['default_per_page']);
    }
}
