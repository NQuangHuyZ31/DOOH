<?php

namespace Modules\Simulator\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchSyncSimulatorScreensRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'items' => ['required', 'array', 'min:1', 'max:100'],
			'items.*.id' => ['required', 'integer', 'min:1'],
			'items.*.code' => ['required', 'string', 'max:64'],
			'items.*.secret_key' => ['required', 'string', 'max:128'],
		];
	}
}
