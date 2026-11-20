import React, { useState } from 'react';
import { Upload, Button, message, Space, Progress } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { uploadApi, type UploadResponseData } from '../Action/uploadApi';

export interface FileUploadProps {
	folder?: string;
	accept?: string;
	maxSizeMb?: number;
	value?: string;
	buttonText?: string;
	disabled?: boolean;
	onChange?: (url: string, data?: UploadResponseData, file?: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ folder = 'general', accept, maxSizeMb = 100, value, buttonText = 'Select File', disabled = false, onChange }) => {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [fileName, setFileName] = useState('');

	const isAcceptableFile = (file: File, acceptPattern?: string): boolean => {
		if (!acceptPattern) return true;
		const patterns = acceptPattern.split(',').map((p) => p.trim().toLowerCase());
		const fileName = file.name.toLowerCase();
		const mimeType = (file.type || '').toLowerCase();

		return patterns.some((p) => {
			if (p.startsWith('.')) return fileName.endsWith(p);
			if (p.endsWith('/*')) return mimeType.startsWith(p.replace('/*', ''));
			return mimeType === p || fileName.endsWith('.' + (p.split('/')[1] || ''));
		});
	};

	const handleBeforeUpload = async (file: File) => {
		if (!isAcceptableFile(file, accept)) {
			message.error(`Invalid file format. Allowed: ${accept}`);
			return false;
		}

		if (file.size > maxSizeMb * 1024 * 1024) {
			message.error(`File size exceeds maximum limit of ${maxSizeMb}MB.`);
			return false;
		}

		setUploading(true);
		setProgress(0);
		setFileName(file.name);

		try {
			const res = await uploadApi.uploadFile(file, folder, (pct) => setProgress(pct));
			const data = res.data?.data;
			if (data?.url) {
				message.success(`Uploaded: ${file.name}`);
				onChange?.(data.url, data, file);
			}
		} catch (err: unknown) {
			message.error(`Failed to upload ${file.name}`);
		} finally {
			setUploading(false);
		}

		return false;
	};

	return (
		<Space direction="vertical" style={{ width: '100%' }} size={4}>
			<Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept={accept} disabled={disabled || uploading}>
				<Button
					icon={uploading ? <LoadingOutlined /> : value ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <UploadOutlined />}
					loading={uploading}
					disabled={disabled}
					style={{ width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }}
				>
					{uploading ? `Uploading (${progress}%)` : fileName || (value ? 'File Ready' : buttonText)}
				</Button>
			</Upload>
			{uploading && <Progress percent={progress} size="small" showInfo={false} />}
		</Space>
	);
};

export default FileUpload;
