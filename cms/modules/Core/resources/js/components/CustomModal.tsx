import React from 'react';
import { Modal, ModalProps } from 'antd';

export interface CustomModalProps extends ModalProps {
	loading?: boolean;
}

export const CustomModal: React.FC<CustomModalProps> = ({ open, title, onOk, onCancel, confirmLoading, children, width = 600, ...rest }) => {
	return (
		<Modal open={open} title={title} onOk={onOk} onCancel={onCancel} confirmLoading={confirmLoading} width={width} destroyOnClose maskClosable={false} {...rest}>
			{children}
		</Modal>
	);
};

export default CustomModal;
