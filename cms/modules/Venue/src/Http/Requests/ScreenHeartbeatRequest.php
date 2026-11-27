<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScreenHeartbeatRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'code' => 'required|string|max:64',
			'player_app_version' => 'nullable|string|max:64',
			'ip_address' => 'nullable|string|max:64',
			'storage_free_mb' => 'nullable|integer|min:0',
		];
	}
}
