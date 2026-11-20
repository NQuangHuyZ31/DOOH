<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateScreenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $screenId = $this->route('id')
            ?? $this->route('screen')
            ?? (is_numeric($this->route('id_or_action')) ? $this->route('id_or_action') : null)
            ?? (is_numeric($this->route('controller')) ? $this->route('controller') : null);

        return [
            'venue_id' => ['sometimes', 'required', 'integer', 'exists:venues,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64', Rule::unique('screens', 'code')->ignore($screenId)],
            'sub_location' => ['nullable', 'string', 'max:255'],
            'screen_type' => ['nullable', 'string', 'max:64'],
            'resolution_width' => ['sometimes', 'required', 'integer', 'min:100', 'max:15360'],
            'resolution_height' => ['sometimes', 'required', 'integer', 'min:100', 'max:8640'],
            'physical_width_m' => ['nullable', 'numeric', 'min:0'],
            'physical_height_m' => ['nullable', 'numeric', 'min:0'],
            'pixel_pitch_mm' => ['nullable', 'numeric', 'min:0'],
            'brightness_nits' => ['nullable', 'integer', 'min:0'],
            'has_audio' => ['nullable', 'boolean'],
            'loop_duration_seconds' => ['nullable', 'integer', 'min:10', 'max:3600'],
            'default_slot_seconds' => ['nullable', 'integer', 'min:5', 'max:300'],
            'hardware_device_uid' => ['nullable', 'string', 'max:128'],
            'status' => ['nullable', 'in:active,inactive,maintenance'],
        ];
    }
}
