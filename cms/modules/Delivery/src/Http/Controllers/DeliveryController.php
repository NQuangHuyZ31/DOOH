<?php

namespace Modules\Delivery\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class DeliveryController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Delivery',
            'version' => '1.0.0',
            'endpoints' => [
                'campaigns' => '/delivery/campaign',
                'line_items' => '/delivery/line-item',
                'pacing' => '/delivery/pacing',
            ]
        ], 'Delivery module ready');
    }
}
