export type MediaType = 'video' | 'image' | 'html5' | 'vast';

export interface ExtractedMediaInfo {
	width: number;
	height: number;
	duration: number | null;
	type: MediaType;
}

export const extractMediaMetadata = (file: File, expectedType?: MediaType): Promise<ExtractedMediaInfo> => {
	return new Promise((resolve, reject) => {
		const mime = (file.type || '').toLowerCase();
		const isVideo = expectedType === 'video' || (!expectedType && mime.startsWith('video/'));
		const isImage = expectedType === 'image' || (!expectedType && mime.startsWith('image/'));
		const isZip = expectedType === 'html5' || file.name.toLowerCase().endsWith('.zip');

		if (isZip) {
			resolve({ width: 1920, height: 1080, duration: 15, type: 'html5' });
			return;
		}

		const url = URL.createObjectURL(file);

		if (isVideo) {
			const video = document.createElement('video');
			video.preload = 'metadata';
			video.src = url;

			video.onloadedmetadata = () => {
				URL.revokeObjectURL(url);
				resolve({
					width: video.videoWidth || 1920,
					height: video.videoHeight || 1080,
					duration: Math.round(video.duration) || 15,
					type: 'video',
				});
			};

			video.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Failed to load video file or invalid video codec.'));
			};
		} else if (isImage) {
			const img = new Image();
			img.src = url;

			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve({
					width: img.naturalWidth || 1920,
					height: img.naturalHeight || 1080,
					duration: null,
					type: 'image',
				});
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Selected file is not a valid image format.'));
			};
		} else {
			URL.revokeObjectURL(url);
			reject(new Error('Unsupported media type for metadata extraction.'));
		}
	});
};

export const calcOrientation = (w: number, h: number): string => {
	if (!w || !h) return 'landscape';
	if (Math.abs(w - h) / Math.max(w, h) < 0.08) return 'square';
	if (h > w) return 'portrait';
	if (w / h >= 2.8) return 'ribbon';
	return 'landscape';
};

export const getDimsForOrientation = (orient?: string) => {
	if (orient === 'portrait') return { width: 1080, height: 1920 };
	if (orient === 'square') return { width: 1080, height: 1080 };
	if (orient === 'ribbon') return { width: 3840, height: 600 };
	return { width: 1920, height: 1080 };
};

