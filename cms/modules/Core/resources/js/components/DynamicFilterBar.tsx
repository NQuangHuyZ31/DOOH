import React, { useState, useCallback, useEffect } from 'react';
import { Button, DatePicker, Flex, Input, Select, Space } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { FilterFieldConfig } from '../types/filter';

const { RangePicker } = DatePicker;

export interface DynamicFilterBarProps {
	filters: FilterFieldConfig[];
	onChange: (values: Record<string, any>) => void;
	initialValues?: Record<string, any>;
}

export const DynamicFilterBar: React.FC<DynamicFilterBarProps> = ({
	filters,
	onChange,
	initialValues = {},
}) => {
	const [values, setValues] = useState<Record<string, any>>(() => {
		const defaults: Record<string, any> = { ...initialValues };
		for (const f of filters) {
			if (f.defaultValue !== undefined && defaults[f.name] === undefined) {
				defaults[f.name] = f.defaultValue;
			}
		}
		return defaults;
	});

	const handleFieldChange = useCallback(
		(name: string, val: any) => {
			setValues((prev) => {
				const next = { ...prev, [name]: val };
				onChange(next);
				return next;
			});
		},
		[onChange],
	);

	const handleReset = useCallback(() => {
		const empty: Record<string, any> = {};
		for (const f of filters) {
			empty[f.name] = f.defaultValue !== undefined ? f.defaultValue : undefined;
		}
		setValues(empty);
		onChange(empty);
	}, [filters, onChange]);

	const hasActiveFilters = Object.values(values).some((v) => v !== undefined && v !== '');

	return (
		<Flex wrap="wrap" gap="middle" align="center" justify="space-between">
			<Flex wrap="wrap" gap="small" align="center">
				{filters.map((field) => {
					const fieldStyle = { width: field.width ?? 200 };

					if (field.type === 'search') {
						return (
							<Input
								key={field.name}
								prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
								placeholder={field.placeholder || `Search ${field.label || ''}`}
								allowClear
								value={values[field.name] || ''}
								style={fieldStyle}
								onChange={(e) => handleFieldChange(field.name, e.target.value)}
							/>
						);
					}

					if (field.type === 'select') {
						return (
							<Select
								key={field.name}
								placeholder={field.placeholder || `Select ${field.label || ''}`}
								allowClear
								value={values[field.name]}
								options={field.options}
								style={fieldStyle}
								onChange={(val) => handleFieldChange(field.name, val)}
							/>
						);
					}

					if (field.type === 'date-range') {
						return (
							<RangePicker
								key={field.name}
								style={fieldStyle}
								value={values[field.name]}
								onChange={(dates) => handleFieldChange(field.name, dates)}
							/>
						);
					}

					if (field.type === 'custom' && field.render) {
						return (
							<div key={field.name} style={fieldStyle}>
								{field.render(values[field.name], (val) => handleFieldChange(field.name, val))}
							</div>
						);
					}

					return null;
				})}
			</Flex>

			{hasActiveFilters && (
				<Button icon={<ReloadOutlined />} onClick={handleReset}>
					Reset
				</Button>
			)}
		</Flex>
	);
};

export default DynamicFilterBar;
