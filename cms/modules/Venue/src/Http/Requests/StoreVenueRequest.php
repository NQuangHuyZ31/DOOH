<?php

namespace Modules\Venue\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVenueRequest extends FormRequest
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
            'code' => ['required', 'string', 'unique:venues,code'],
            'name' => ['required', 'string'],
            'location' => ['required', 'string'],
            'width' => ['required', 'integer'],
            'height' => ['required', 'integer'],
            'orientation' => ['nullable', 'string', 'in:landscape,portrait'],
            'status' => ['nullable', 'string', 'in:active,inactive,maintenance'],
        ];
    }
}
