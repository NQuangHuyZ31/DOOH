<?php

namespace Modules\Creative\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Creative\Models\Creative;
use Modules\User\Models\User;

class CreativeSeeder extends Seeder
{
	public function run(): void
	{
		$user = User::first();
		$userId = $user?->id;

		$creatives = [
			[
				'code' => 'CR-202611-V001',
				'name' => 'VinFast VF9 Electric SUV Promo',
				'user_id' => $userId,
				'approved_by' => $userId,
				'approved_at' => now(),
				'type' => 'video',
				'status' => 'approved',
				'media_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
				'thumbnail_url' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
				'width' => 1920,
				'height' => 1080,
				'aspect_ratio' => '16:9',
				'duration_seconds' => 15,
				'file_size_bytes' => 8540000,
				'mime_type' => 'video/mp4',
				'metadata' => ['codec' => 'h264', 'bitrate' => '4500kbps', 'fps' => 30],
			],
			[
				'code' => 'CR-202611-I001',
				'name' => 'Highlands Coffee Morning Brew Poster',
				'user_id' => $userId,
				'approved_by' => $userId,
				'approved_at' => now(),
				'type' => 'image',
				'status' => 'approved',
				'media_url' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&h=1920&fit=crop',
				'thumbnail_url' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
				'width' => 1080,
				'height' => 1920,
				'aspect_ratio' => '9:16',
				'duration_seconds' => 10,
				'file_size_bytes' => 1850000,
				'mime_type' => 'image/jpeg',
				'metadata' => ['color_space' => 'sRGB'],
			],
			[
				'code' => 'CR-202611-H001',
				'name' => 'Shopee 11.11 Countdown Interactive',
				'user_id' => $userId,
				'type' => 'html5',
				'status' => 'pending_review',
				'media_url' => 'https://example.com/creatives/shopee-11-11/index.html',
				'thumbnail_url' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
				'width' => 1920,
				'height' => 1080,
				'aspect_ratio' => '16:9',
				'duration_seconds' => 15,
				'file_size_bytes' => 420000,
				'mime_type' => 'application/zip',
				'metadata' => ['sandbox' => 'allow-scripts allow-same-origin'],
			],
			[
				'code' => 'CR-202611-V002',
				'name' => 'Samsung Galaxy S25 Ultra VAST Tag',
				'user_id' => $userId,
				'type' => 'vast',
				'status' => 'draft',
				'media_url' => 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%203.0%20Samples/Inline_Linear_Tag-test.xml',
				'thumbnail_url' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
				'width' => 1920,
				'height' => 1080,
				'aspect_ratio' => '16:9',
				'duration_seconds' => 30,
				'file_size_bytes' => 12500000,
				'mime_type' => 'application/vast+xml',
				'metadata' => ['vast_version' => '3.0'],
			],
		];

		foreach ($creatives as $data) {
			Creative::updateOrCreate(['code' => $data['code']], $data);
		}
	}
}
