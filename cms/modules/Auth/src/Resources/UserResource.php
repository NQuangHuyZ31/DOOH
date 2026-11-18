<?php

namespace Modules\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\User\Models\User;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'permission_type' => $this->permission_type ?? User::PERMISSION_TYPE_ROLE,
            'role' => $this->getRoleName(),
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
