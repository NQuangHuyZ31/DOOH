<?php

namespace Modules\Creative\Services;

use Illuminate\Support\Facades\Http;
use Modules\Core\Support\DisplaySpecHelper;

class VastParserService
{
	public function parse(string $urlOrXml): array
	{
		$trimmed = trim($urlOrXml);
		$xmlContent = $this->resolveXmlContent($trimmed);

		libxml_use_internal_errors(true);
		$xml = simplexml_load_string($xmlContent, 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);

		if ($xml === false || strtolower($xml->getName()) !== 'vast') {
			libxml_clear_errors();
			throw new \DomainException('INVALID_VAST_XML: Root element must be <VAST>.');
		}

		$version = (string) ($xml['version'] ?? '3.0');

		// Check if any Ad element exists
		if (!isset($xml->Ad)) {
			return [
				'version' => $version,
				'has_ad' => false,
				'ad_title' => null,
				'ad_system' => null,
				'duration_seconds' => null,
				'width' => null,
				'height' => null,
				'aspect_ratio' => null,
				'primary_media_url' => null,
				'impressions' => [],
				'error_beacons' => [],
				'tracking_events' => [],
				'media_files' => [],
			];
		}

		$ad = $xml->Ad[0];
		$inline = $ad->InLine ?? null;

		$adTitle = $inline ? (string) $inline->AdTitle : null;
		$adSystem = $inline ? (string) $inline->AdSystem : null;

		$errorBeacons = [];
		if ($inline && isset($inline->Error)) {
			foreach ($inline->Error as $err) {
				$url = trim((string) $err);
				if (!empty($url)) {
					$errorBeacons[] = $url;
				}
			}
		}

		$impressions = [];
		if ($inline && isset($inline->Impression)) {
			foreach ($inline->Impression as $imp) {
				$url = trim((string) $imp);
				if (!empty($url)) {
					$impressions[] = $url;
				}
			}
		}

		$durationSeconds = null;
		$trackingEvents = [];
		$mediaFiles = [];

		if ($inline && isset($inline->Creatives->Creative)) {
			foreach ($inline->Creatives->Creative as $creativeNode) {
				if (isset($creativeNode->Linear)) {
					$linear = $creativeNode->Linear;

					if (isset($linear->Duration)) {
						$durationSeconds = $this->parseDuration((string) $linear->Duration);
					}

					if (isset($linear->TrackingEvents->Tracking)) {
						foreach ($linear->TrackingEvents->Tracking as $tracking) {
							$event = (string) ($tracking['event'] ?? '');
							$trackUrl = trim((string) $tracking);
							if (!empty($event) && !empty($trackUrl)) {
								$trackingEvents[$event][] = $trackUrl;
							}
						}
					}

					if (isset($linear->MediaFiles->MediaFile)) {
						foreach ($linear->MediaFiles->MediaFile as $mf) {
							$mediaUrl = trim((string) $mf);
							if (!empty($mediaUrl)) {
								$mediaFiles[] = [
									'url' => $mediaUrl,
									'type' => (string) ($mf['type'] ?? 'video/mp4'),
									'delivery' => (string) ($mf['delivery'] ?? 'progressive'),
									'width' => (int) ($mf['width'] ?? 1920),
									'height' => (int) ($mf['height'] ?? 1080),
									'bitrate' => isset($mf['bitrate']) ? (int) $mf['bitrate'] : null,
								];
							}
						}
					}
				}
			}
		}

		$bestMedia = $this->selectBestMediaFile($mediaFiles);
		$width = $bestMedia ? $bestMedia['width'] : 1920;
		$height = $bestMedia ? $bestMedia['height'] : 1080;
		$aspectRatio = DisplaySpecHelper::deriveAspectRatio($width, $height);

		return [
			'version' => $version,
			'has_ad' => true,
			'ad_title' => $adTitle,
			'ad_system' => $adSystem,
			'duration_seconds' => $durationSeconds,
			'width' => $width,
			'height' => $height,
			'aspect_ratio' => $aspectRatio,
			'primary_media_url' => $bestMedia ? $bestMedia['url'] : null,
			'impressions' => $impressions,
			'error_beacons' => $errorBeacons,
			'tracking_events' => $trackingEvents,
			'media_files' => $mediaFiles,
		];
	}

	protected function resolveXmlContent(string $input): string
	{
		if (str_starts_with($input, '<') || str_contains($input, '<?xml')) {
			return $input;
		}

		if (!filter_var($input, FILTER_VALIDATE_URL)) {
			throw new \DomainException('VAST_UNREACHABLE: Invalid VAST tag URL.');
		}

		try {
			$response = Http::timeout(5)->get($this->injectCacheBuster($input));
			if (!$response->successful()) {
				throw new \DomainException("VAST_UNREACHABLE: HTTP request returned status {$response->status()}.");
			}

			return $response->body();
		} catch (\Exception $e) {
			if ($e instanceof \DomainException) {
				throw $e;
			}
			throw new \DomainException('VAST_UNREACHABLE: ' . $e->getMessage());
		}
	}

	protected function injectCacheBuster(string $url): string
	{
		$buster = (string) random_int(100000000, 2147483647);
		$replaced = str_ireplace(['[TIMESTAMP]', '[CORRELATOR]', '[CACHEBUSTING]', '{timestamp}'], $buster, $url);

		if (preg_match('/([?&]correlator=)(&|$)/i', $replaced)) {
			// Use ${1} so PHP preg_replace never misreads $1 + leading digit as backreference $10-$19
			return (string) preg_replace('/([?&]correlator=)(&|$)/i', '${1}' . $buster . '$2', $replaced);
		}

		return $replaced;
	}

	public function parseDuration(string $durationStr): int
	{
		$parts = explode(':', trim($durationStr));
		if (count($parts) === 3) {
			$hours = (int) $parts[0];
			$minutes = (int) $parts[1];
			$seconds = (int) round((float) $parts[2]);

			return ($hours * 3600) + ($minutes * 60) + $seconds;
		}

		return (int) $durationStr;
	}

	protected function selectBestMediaFile(array $mediaFiles): ?array
	{
		if (empty($mediaFiles)) {
			return null;
		}

		// Prefer MP4 progressive
		foreach ($mediaFiles as $mf) {
			if (str_contains(strtolower($mf['type']), 'mp4') && strtolower($mf['delivery']) === 'progressive') {
				return $mf;
			}
		}

		// Fallback to any MP4
		foreach ($mediaFiles as $mf) {
			if (str_contains(strtolower($mf['type']), 'mp4')) {
				return $mf;
			}
		}

		return $mediaFiles[0];
	}
}
