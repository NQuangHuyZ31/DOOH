<?php

namespace Modules\Vendor\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'code' => ['nullable', 'string', 'max:64', 'unique:vendors,code'],
			'name' => ['required', 'string', 'max:255'],
			'company_name' => ['nullable', 'string', 'max:255'],
			'tax_code' => ['nullable', 'string', 'max:50'],
			'contact_name' => ['nullable', 'string', 'max:100'],
			'contact_email' => ['nullable', 'email', 'max:100'],
			'contact_phone' => ['nullable', 'string', 'max:20'],
			'address' => ['nullable', 'string', 'max:255'],
			'user_id' => ['nullable', 'integer', 'exists:users,id'],
			'rate_limit_per_minute' => ['nullable', 'integer', 'min:10', 'max:3600'],
			'revenue_share_percentage' => ['nullable', 'numeric', 'between:0,100'],
			'status' => ['nullable', 'in:active,inactive,suspended'],
		];
	}
}
