<?php

namespace Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required_without:username_or_email|email',
            'username_or_email' => 'nullable|string',
            'password' => 'required|string',
        ];
    }

    public function getEmail(): string
    {
        return (string) ($this->input('email') ?: $this->input('username_or_email'));
    }
}
