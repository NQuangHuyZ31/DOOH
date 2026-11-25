<?php

namespace Modules\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Core\Support\HmacKeyUtil;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalSecret
{
	public function handle(Request $request, Closure $next): Response
	{
		$expected = (string) config('modules.internal_secret', '');
		$provided = (string) $request->header('X-INTERNAL-SECRET', '');

		if ($expected === '' || $provided === '' || !HmacKeyUtil::verifyKeyMatch($provided, $expected)) {
			return response()->json(['status' => 'error', 'message' => 'Unauthorized internal request'], 401);
		}

		return $next($request);
	}
}
