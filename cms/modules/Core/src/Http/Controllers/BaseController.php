<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Core\Support\ApiResponseTrait;

abstract class BaseController extends Controller
{
    use ApiResponseTrait;

    protected function success(mixed $data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        return $this->respondSuccess($data, $message, $code);
    }

    protected function error(string $message = 'Error', int $code = 400, mixed $errors = null): JsonResponse
    {
        return $this->respondError($message, $code, $errors);
    }
}
