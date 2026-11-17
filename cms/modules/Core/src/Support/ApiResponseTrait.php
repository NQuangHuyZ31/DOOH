<?php

namespace Modules\Core\Support;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    public function respondSuccess(mixed $data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    public function respondCreated(mixed $data = null, string $message = 'Created'): JsonResponse
    {
        return $this->respondSuccess($data, $message, 201);
    }

    public function respondError(string $message = 'Error', int $statusCode = 400, mixed $errors = null): JsonResponse
    {
        $response = [
            'status' => 'error',
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    public function respondUnauthorized(string $message = 'Unauthenticated.'): JsonResponse
    {
        return $this->respondError($message, 401);
    }

    public function respondForbidden(string $message = 'Access denied: insufficient permissions'): JsonResponse
    {
        return $this->respondError($message, 403);
    }

    public function respondNotFound(string $message = 'Resource not found.'): JsonResponse
    {
        return $this->respondError($message, 404);
    }

    public function respondPaginated(mixed $paginator, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
