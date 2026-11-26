<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchRegisterPartnerScreensRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'vendor_id' => 'required|integer|min:1',
			'screens' => 'required|array|min:1|max:100',
		];
	}
}
