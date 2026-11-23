import React, { useState } from 'react';
import { Upload, Button, message, Space, Progress, Typography } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { uploadApi, type UploadResponseData } from '../Action/uploadApi';

const { Text } = Typography;

export interface FileUploadProps {
	folder?: string;
	accept?: string;
	maxSizeMb?: number;
	value?: string;
	buttonText?: string;
	disabled?: boolean;
	status?: 'error' | 'warning';
	errorMessage?: string;
	onChange?: (url: string, data?: UploadResponseData, file?: File) => void;
	onError?: (errMsg: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ folder = 'general', accept, maxSizeMb = 100, value, buttonText = 'Select File', disabled = false, status, errorMessage, onChange, onError }) => {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [fileName, setFileName] = useState('');
	const [localError, setLocalError] = useState('');

	const displayError = errorMessage || localError;
	const isError = status === 'error' || Boolean(displayError);

	const isAcceptableFile = (file: File, acceptPattern?: string): boolean => {
		if (!acceptPattern) return true;
		const patterns = acceptPattern.split(',').map((p) => p.trim().toLowerCase());
		const fn = file.name.toLowerCase();
		const mime = (file.type || '').toLowerCase();
		return patterns.some((p) => {
			if (p.startsWith('.')) return fn.endsWith(p);
			if (p.endsWith('/*')) return mime.startsWith(p.replace('/*', ''));
			return mime === p || fn.endsWith('.' + (p.split('/')[1] || ''));
		});
	};

	const handleBeforeUpload = async (file: File) => {
		setLocalError('');
		if (!isAcceptableFile(file, accept)) {
			const err = `Invalid file format. Allowed: ${accept}`;
			setLocalError(err);
			message.error(err);
			onError?.(err);
			return false;
		}

		if (file.size > maxSizeMb * 1024 * 1024) {
			const err = `File size exceeds maximum limit of ${maxSizeMb}MB.`;
			setLocalError(err);
			message.error(err);
			onError?.(err);
			return false;
		}

		setUploading(true);
		setProgress(0);
		setFileName(file.name);

		try {
			const res = await uploadApi.uploadFile(file, folder, (pct) => setProgress(pct));
			const data = res.data?.data;
			if (data?.url) {
				setLocalError('');
				message.success(`Uploaded: ${file.name}`);
				onChange?.(data.url, data, file);
			}
		} catch (err: unknown) {
			const msg = `Failed to upload ${file.name}`;
			setLocalError(msg);
			message.error(msg);
			onError?.(msg);
		} finally {
			setUploading(false);
		}

		return false;
	};

	return (
		<Space direction="vertical" style={{ width: '100%' }} size={2}>
			<Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept={accept} disabled={disabled || uploading}>
				<Button
					icon={uploading ? <LoadingOutlined /> : isError ? <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> : value ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <UploadOutlined />}
					loading={uploading}
					disabled={disabled}
					style={{ width: '100%', textOverflow: 'ellipsis', overflow: 'hidden', borderColor: isError ? '#ff4d4f' : undefined, color: isError ? '#ff4d4f' : undefined }}
				>
					{uploading ? `Uploading (${progress}%)` : fileName || (value ? 'File Ready' : buttonText)}
				</Button>
			</Upload>
			{uploading && <Progress percent={progress} size="small" showInfo={false} />}
			{displayError && <Text type="danger" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>{displayError}</Text>}
		</Space>
	);
};

export default FileUpload;
