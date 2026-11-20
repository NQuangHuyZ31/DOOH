<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Core\Http\Requests\UploadFileRequest;
use Modules\Core\Services\FileUploadService;

class UploadController extends BaseController
{
	public function __construct(
		protected FileUploadService $fileUploadService
	) {}

	public function store(UploadFileRequest $request): JsonResponse
	{
		$file = $request->file('file');
		$folder = $request->input('folder', 'general');

		$result = $this->fileUploadService->upload($file, $folder);

		return $this->respondSuccess($result, 'File uploaded successfully.');
	}

	public function upload(UploadFileRequest $request): JsonResponse
	{
		return $this->store($request);
	}
}
