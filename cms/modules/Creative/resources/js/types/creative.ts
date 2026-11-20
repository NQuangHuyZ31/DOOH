export type CreativeType = 'video' | 'image' | 'html5' | 'vast';
export type CreativeStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface UserSummary {
	id: number;
	name: string;
	email: string;
}

export interface CreativeItem {
	id: number;
	user_id: number | null;
	creator?: UserSummary | null;
	approved_by: number | null;
	approver?: UserSummary | null;
	approved_at: string | null;
	name: string;
	code: string;
	type: CreativeType;
	status: CreativeStatus;
	media_url: string;
	thumbnail_url: string | null;
	width: number;
	height: number;
	aspect_ratio: string;
	duration_seconds: number | null;
	file_size_bytes: number | null;
	mime_type: string | null;
	rejection_reason: string | null;
	metadata: Record<string, any> | null;
	created_at?: string;
	updated_at?: string;
}

export interface CreativeQueryParams {
	page?: number;
	per_page?: number;
	search?: string;
	type?: CreativeType;
	status?: CreativeStatus;
	aspect_ratio?: string;
}

export interface CreativeFormData {
	name: string;
	type: CreativeType;
	status?: CreativeStatus;
	media_url: string;
	thumbnail_url?: string;
	width: number;
	height: number;
	duration_seconds?: number;
	file_size_bytes?: number;
	mime_type?: string;
	metadata?: Record<string, any>;
}

export interface CreativeRowItem {
	id: string;
	name: string;
	type: CreativeType;
	status?: CreativeStatus;
	sourceType: 'file' | 'url';
	file?: File;
	media_url: string;
	thumbnail_url?: string;
	width: number;
	height: number;
	duration_seconds?: number | null;
	file_size_bytes?: number;
	mime_type?: string;
	uploading?: boolean;
}

export interface CreativeReviewPayload {
	status: CreativeStatus;
	rejection_reason?: string;
}
