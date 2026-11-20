<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $venueId = $this->route('id')
            ?? $this->route('venue')
            ?? (is_numeric($this->route('controller')) ? $this->route('controller') : null)
            ?? (is_numeric($this->route('id_or_action')) ? $this->route('id_or_action') : null);

        return [
            'code' => ['nullable', 'string', 'max:64', Rule::unique('venues', 'code')->ignore($venueId)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'venue_type' => ['nullable', 'string', 'max:64'],
            'media_owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'address' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'city_province' => ['nullable', 'string', 'max:100'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'opening_time' => ['nullable'],
            'closing_time' => ['nullable'],
            'is_24_7' => ['nullable', 'boolean'],
            'daily_traffic' => ['nullable', 'integer', 'min:0'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:active,inactive,maintenance'],
        ];
    }
}
