<?php

namespace Modules\Core\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\AbstractPaginator;

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
        $rawPaginator = $paginator;
        $items = null;

        if ($paginator instanceof ResourceCollection && $paginator->resource instanceof AbstractPaginator) {
            $rawPaginator = $paginator->resource;
            $items = $paginator->collection;
        } elseif (is_object($paginator) && method_exists($paginator, 'items')) {
            $items = $paginator->items();
        } else {
            $items = $paginator;
        }

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $items,
            'pagination' => [
                'current_page' => is_object($rawPaginator) && method_exists($rawPaginator, 'currentPage') ? $rawPaginator->currentPage() : 1,
                'last_page' => is_object($rawPaginator) && method_exists($rawPaginator, 'lastPage') ? $rawPaginator->lastPage() : 1,
                'per_page' => is_object($rawPaginator) && method_exists($rawPaginator, 'perPage') ? $rawPaginator->perPage() : 15,
                'total' => is_object($rawPaginator) && method_exists($rawPaginator, 'total') ? $rawPaginator->total() : (is_countable($items) ? count($items) : 0),
            ],
        ]);
    }
}
