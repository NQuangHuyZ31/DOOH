<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Core\Support\ApiResponseTrait;

abstract class BaseController extends Controller
{
    use ApiResponseTrait;

    /**
     * Common success response
     */
    protected function success(mixed $data = null, string $message = 'Success', int $code = 200)
    {
        return $this->respondSuccess($data, $message, $code);
    }

    /**
     * Common error response
     */
    protected function error(string $message = 'Error', int $code = 400, mixed $errors = null)
    {
        return $this->respondError($message, $code, $errors);
    }
}
