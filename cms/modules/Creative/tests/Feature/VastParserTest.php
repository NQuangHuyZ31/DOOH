<?php

namespace Modules\Creative\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Creative\Services\VastParserService;
use Tests\TestCase;

class VastParserTest extends TestCase
{
	use RefreshDatabase;

	protected VastParserService $parser;

	protected function setUp(): void
	{
		parent::setUp();
		$this->artisan('migrate');
		$this->parser = app(VastParserService::class);
	}

	protected function getSampleVastXml(): string
	{
		return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<VAST version="3.0">
	<Ad id="AD-TEST-001">
		<InLine>
			<AdSystem>DOOH-DSP</AdSystem>
			<AdTitle>Premium Car Launch</AdTitle>
			<Error><![CDATA[https://track.dsp.com/error]]></Error>
			<Impression><![CDATA[https://track.dsp.com/imp?id=123]]></Impression>
			<Creatives>
				<Creative id="CR-01" sequence="1">
					<Linear>
						<Duration>00:00:15</Duration>
						<TrackingEvents>
							<Tracking event="start"><![CDATA[https://track.dsp.com/start]]></Tracking>
							<Tracking event="complete"><![CDATA[https://track.dsp.com/complete]]></Tracking>
						</TrackingEvents>
						<MediaFiles>
							<MediaFile delivery="progressive" type="video/mp4" width="1920" height="1080" bitrate="2500">
								<![CDATA[https://cdn.dsp.com/media/car_1080p.mp4]]>
							</MediaFile>
						</MediaFiles>
					</Linear>
				</Creative>
			</Creatives>
		</InLine>
	</Ad>
</VAST>
XML;
	}

	public function test_parse_vast_xml_linear_ad_success(): void
	{
		$parsed = $this->parser->parse($this->getSampleVastXml());

		$this->assertTrue($parsed['has_ad']);
		$this->assertSame('3.0', $parsed['version']);
		$this->assertSame('Premium Car Launch', $parsed['ad_title']);
		$this->assertSame('DOOH-DSP', $parsed['ad_system']);
		$this->assertSame(15, $parsed['duration_seconds']);
		$this->assertSame(1920, $parsed['width']);
		$this->assertSame(1080, $parsed['height']);
		$this->assertSame('16:9', $parsed['aspect_ratio']);
		$this->assertSame('https://cdn.dsp.com/media/car_1080p.mp4', $parsed['primary_media_url']);
		$this->assertContains('https://track.dsp.com/imp?id=123', $parsed['impressions']);
		$this->assertArrayHasKey('start', $parsed['tracking_events']);
		$this->assertArrayHasKey('complete', $parsed['tracking_events']);
	}

	public function test_parse_vast_empty_no_ad(): void
	{
		$emptyXml = '<VAST version="3.0"/>';
		$parsed = $this->parser->parse($emptyXml);

		$this->assertFalse($parsed['has_ad']);
		$this->assertSame('3.0', $parsed['version']);
		$this->assertNull($parsed['ad_title']);
		$this->assertNull($parsed['duration_seconds']);
		$this->assertEmpty($parsed['impressions']);
	}

	public function test_parse_vast_invalid_xml_throws_exception(): void
	{
		$this->expectException(\DomainException::class);
		$this->parser->parse('<NotVastRoot><Child/></NotVastRoot>');
	}

	public function test_parse_vast_url_via_http(): void
	{
		Http::fake([
			'https://ads.dsp.com/vast.xml' => Http::response($this->getSampleVastXml(), 200),
		]);

		$parsed = $this->parser->parse('https://ads.dsp.com/vast.xml');

		$this->assertTrue($parsed['has_ad']);
		$this->assertSame(15, $parsed['duration_seconds']);
		$this->assertSame('https://cdn.dsp.com/media/car_1080p.mp4', $parsed['primary_media_url']);
	}

	public function test_parse_vast_endpoint_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$response = $this->postJson('/admin/api/creative/parse-vast', [
			'xml' => $this->getSampleVastXml(),
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.duration_seconds', 15)
			->assertJsonPath('data.width', 1920)
			->assertJsonPath('data.height', 1080)
			->assertJsonPath('data.primary_media_url', 'https://cdn.dsp.com/media/car_1080p.mp4');
	}

	public function test_create_creative_with_vast_auto_extracts_metadata(): void
	{
		$this->authenticateAsSuperAdmin();

		Http::fake([
			'https://ads.dsp.com/campaign-123.xml' => Http::response($this->getSampleVastXml(), 200),
		]);

		$response = $this->postJson('/admin/api/creative', [
			'name' => 'Programmatic Campaign Asset',
			'type' => 'vast',
			'media_url' => 'https://ads.dsp.com/campaign-123.xml',
		]);

		$response->assertStatus(201)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.type', 'vast')
			->assertJsonPath('data.duration_seconds', 15)
			->assertJsonPath('data.width', 1920)
			->assertJsonPath('data.height', 1080)
			->assertJsonPath('data.aspect_ratio', '16:9')
			->assertJsonPath('data.metadata.vast.has_ad', true);

		$this->assertDatabaseHas('creatives', [
			'name' => 'Programmatic Campaign Asset',
			'type' => 'vast',
			'duration_seconds' => 15,
			'width' => 1920,
			'height' => 1080,
		]);
	}
}
