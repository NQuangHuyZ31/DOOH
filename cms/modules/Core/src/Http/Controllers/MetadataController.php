<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Services\MetadataService;

class MetadataController extends BaseController
{
    public function __construct(
        private readonly MetadataService $metadataService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $keys = $request->query('keys');
        $data = $this->metadataService->getMetadata(
            is_string($keys) || is_array($keys) ? $keys : null
        );

        return $this->respondSuccess($data, 'Metadata retrieved successfully.');
    }
}
