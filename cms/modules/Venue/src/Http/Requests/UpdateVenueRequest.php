<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVenueRequest extends FormRequest
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
            'name' => ['sometimes', 'string'],
            'location' => ['sometimes', 'string'],
            'width' => ['sometimes', 'integer'],
            'height' => ['sometimes', 'integer'],
            'orientation' => ['nullable', 'string', 'in:landscape,portrait'],
            'status' => ['nullable', 'string', 'in:active,inactive,maintenance'],
        ];
    }
}
