<?php

namespace Modules\User\Resources;

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
            'role_id' => $this->role_id,
            'permission_type' => $this->permission_type ?? User::PERMISSION_TYPE_ROLE,
            'role' => $this->whenLoaded('role', fn () => $this->role ? new RoleResource($this->role) : null),
            'direct_permissions' => $this->whenLoaded(
                'directPermissions',
                fn () => $this->directPermissions->pluck('name')->values()->all(),
                []
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
