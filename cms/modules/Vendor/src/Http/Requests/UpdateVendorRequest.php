<?php

namespace Modules\Vendor\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		$vendorId = $this->route('id') ?? $this->input('id');

		return [
			'code' => ['nullable', 'string', 'max:64', Rule::unique('vendors', 'code')->ignore($vendorId)],
			'name' => ['sometimes', 'required', 'string', 'max:255'],
			'company_name' => ['nullable', 'string', 'max:255'],
			'tax_code' => ['nullable', 'string', 'max:50'],
			'contact_name' => ['nullable', 'string', 'max:100'],
			'contact_email' => ['nullable', 'email', 'max:100'],
			'contact_phone' => ['nullable', 'string', 'max:20'],
			'address' => ['nullable', 'string', 'max:255'],
			'user_id' => ['nullable', 'integer', 'exists:users,id'],
			'create_user' => ['nullable', 'boolean'],
			'user_name' => ['required_if:create_user,true', 'nullable', 'string', 'max:255'],
			'user_email' => ['required_if:create_user,true', 'nullable', 'email', 'max:255', 'unique:users,email'],
			'user_password' => ['required_if:create_user,true', 'nullable', 'string', 'min:6'],
			'rate_limit_per_minute' => ['nullable', 'integer', 'min:10', 'max:3600'],
			'revenue_share_percentage' => ['nullable', 'numeric', 'between:0,100'],
			'status' => ['nullable', 'in:active,inactive,suspended'],
		];
	}
}
