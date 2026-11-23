<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'permission_type' => ['required', 'string', 'in:role,direct'],
            'role_id' => ['nullable', 'required_if:permission_type,role', 'integer', 'exists:roles,id'],
            'vendor_id' => ['nullable', 'integer', 'exists:vendors,id'],
            'direct_permissions' => ['nullable', 'required_if:permission_type,direct', 'array'],
            'direct_permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
