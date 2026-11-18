<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100', 'unique:permissions,name', 'regex:/^[a-z0-9_-]+\.[a-z0-9_-]+$/'],
            'module' => ['required', 'string', 'max:50'],
            'display_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
