<?php

namespace Modules\Venue\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $landmark = Venue::firstOrCreate(
            ['code' => 'SGN-LM81'],
            [
                'name' => 'Landmark 81',
                'venue_type' => 'shopping_mall',
                'address' => '720A Dien Bien Phu, Ward 22',
                'ward' => 'Ward 22',
                'district' => 'Binh Thanh',
                'city_province' => 'Ho Chi Minh City',
                'country_code' => 'VN',
                'latitude' => 10.7950,
                'longitude' => 106.7219,
                'opening_time' => '06:00:00',
                'closing_time' => '23:00:00',
                'is_24_7' => false,
                'daily_traffic' => 85000,
                'contact_name' => 'Nguyen Van A',
                'contact_phone' => '0901234567',
                'status' => 'active',
            ]
        );

        $noibai = Venue::firstOrCreate(
            ['code' => 'HAN-NOIBAI-T2'],
            [
                'name' => 'Noi Bai International Airport - T2',
                'venue_type' => 'airport',
                'address' => 'Noi Bai International Airport Terminal 2',
                'ward' => 'Phu Minh',
                'district' => 'Soc Son',
                'city_province' => 'Hanoi',
                'country_code' => 'VN',
                'latitude' => 21.2212,
                'longitude' => 105.8072,
                'opening_time' => '00:00:00',
                'closing_time' => '23:59:59',
                'is_24_7' => true,
                'daily_traffic' => 60000,
                'contact_name' => 'Tran Thi B',
                'contact_phone' => '0912345678',
                'status' => 'active',
            ]
        );

        Screen::firstOrCreate(
            ['code' => 'SCR-SGN-LM81-01'],
            [
                'venue_id' => $landmark->id,
                'name' => 'Outdoor Curved LED Facade',
                'sub_location' => 'Main East Entrance Tower Facade',
                'screen_type' => 'outdoor_led',
                'resolution_width' => 3840,
                'resolution_height' => 2160,
                'orientation' => 'landscape',
                'aspect_ratio' => '16:9',
                'physical_width_m' => 16.00,
                'physical_height_m' => 9.00,
                'pixel_pitch_mm' => 3.9,
                'brightness_nits' => 6500,
                'has_audio' => false,
                'loop_duration_seconds' => 120,
                'default_slot_seconds' => 15,
                'hardware_device_uid' => 'BOX-SGN-LM81-01',
                'secret_key' => Str::random(40),
                'connectivity_status' => 'online',
                'last_heartbeat_at' => now(),
                'player_app_version' => '1.0.0',
                'status' => 'active',
            ]
        );

        Screen::firstOrCreate(
            ['code' => 'SCR-SGN-LM81-02'],
            [
                'venue_id' => $landmark->id,
                'name' => 'Elevator Bank LCD Tower A',
                'sub_location' => 'Elevator Lobby 1st Floor',
                'screen_type' => 'elevator_screen',
                'resolution_width' => 1080,
                'resolution_height' => 1920,
                'orientation' => 'portrait',
                'aspect_ratio' => '9:16',
                'physical_width_m' => 0.60,
                'physical_height_m' => 1.05,
                'has_audio' => false,
                'loop_duration_seconds' => 120,
                'default_slot_seconds' => 15,
                'hardware_device_uid' => 'BOX-SGN-LM81-02',
                'secret_key' => Str::random(40),
                'connectivity_status' => 'online',
                'last_heartbeat_at' => now(),
                'player_app_version' => '1.0.0',
                'status' => 'active',
            ]
        );

        Screen::firstOrCreate(
            ['code' => 'SCR-HAN-NOIBAI-T2-01'],
            [
                'venue_id' => $noibai->id,
                'name' => 'Departure Hall International Giant LED',
                'sub_location' => 'Departure Hall Wing B Gate 20-30',
                'screen_type' => 'indoor_led',
                'resolution_width' => 1920,
                'resolution_height' => 1080,
                'orientation' => 'landscape',
                'aspect_ratio' => '16:9',
                'physical_width_m' => 8.00,
                'physical_height_m' => 4.50,
                'pixel_pitch_mm' => 2.5,
                'brightness_nits' => 2000,
                'has_audio' => false,
                'loop_duration_seconds' => 120,
                'default_slot_seconds' => 15,
                'hardware_device_uid' => 'BOX-HAN-NB-01',
                'secret_key' => Str::random(40),
                'connectivity_status' => 'online',
                'last_heartbeat_at' => now(),
                'player_app_version' => '1.0.0',
                'status' => 'active',
            ]
        );
    }
}
