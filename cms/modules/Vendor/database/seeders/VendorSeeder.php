<?php

namespace Modules\Vendor\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Core\Support\HmacKeyUtil;
use Modules\User\Models\User;
use Modules\Vendor\Models\Vendor;

class VendorSeeder extends Seeder
{
	public function run(): void
	{
		$mediaOwnerUser = User::where('email', 'mediaowner@dooh.media')->first();
		$defaultApiKey = 'dooh_live_demo_mediaowner_key_1234567890';
		$hashedKey = HmacKeyUtil::hashApiKey($defaultApiKey);

		Vendor::firstOrCreate(
			['code' => 'VND-GOLDSUN'],
			[
				'name' => 'Goldsun Focus Media',
				'company_name' => 'Goldsun Focus Media Joint Stock Company',
				'tax_code' => '0102030405',
				'contact_name' => 'Tran Thi Mai',
				'contact_email' => 'contact@goldsunfocus.com',
				'contact_phone' => '0912345678',
				'address' => 'Floor 15, Keangnam Landmark 72, Nam Tu Liem, Hanoi',
				'user_id' => $mediaOwnerUser?->id,
				'api_key_hash' => $hashedKey,
				'api_key_prefix' => substr($defaultApiKey, 0, 16),
				'rate_limit_per_minute' => 120,
				'revenue_share_percentage' => 70.00,
				'status' => 'active',
			]
		);

		Vendor::firstOrCreate(
			['code' => 'VND-CHICILON'],
			[
				'name' => 'Chicilon Media',
				'company_name' => 'Chicilon Media Information Technology JSC',
				'tax_code' => '0304050607',
				'contact_name' => 'Le Van Binh',
				'contact_email' => 'partner@chicilonmedia.com',
				'contact_phone' => '0987654321',
				'address' => 'District 1, Ho Chi Minh City',
				'user_id' => null,
				'rate_limit_per_minute' => 120,
				'revenue_share_percentage' => 75.00,
				'status' => 'active',
			]
		);
	}
}
