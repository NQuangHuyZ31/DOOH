<?php

namespace Modules\Simulator\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSimulatorScreenRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'name' => ['required', 'string', 'max:255'],
			'location_name' => ['required', 'string', 'max:255'],
			'city' => ['required', 'string', 'max:120'],
			'sub_location' => ['nullable', 'string', 'max:255'],
			'screen_type' => ['nullable', 'string', 'in:led,lcd,billboard,kiosk,elevator,transit'],
			'resolution_width' => ['required', 'integer', 'min:100', 'max:16384'],
			'resolution_height' => ['required', 'integer', 'min:100', 'max:16384'],
			'has_audio' => ['nullable', 'boolean'],
			'loop_duration_seconds' => ['nullable', 'integer', 'min:10', 'max:3600'],
			'default_slot_seconds' => ['nullable', 'integer', 'min:3', 'max:300'],
			'hardware_device_uid' => ['nullable', 'string', 'max:128'],
		];
	}
}
