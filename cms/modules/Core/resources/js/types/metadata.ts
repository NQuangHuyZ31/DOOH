export interface MetadataOption {
	value: string;
	label: string;
	color?: string;
}

export interface StatusTagMetaItem {
	color: string;
	label: string;
}

export interface CmsAppMetadata {
	default_module: string;
	timezone: string;
	modules: string[];
}

export interface CmsPaginationMetadata {
	default_per_page: number;
	per_page_options: number[];
}

export interface CmsStatusesMetadata {
	common: MetadataOption[];
	venue?: MetadataOption[];
	creative?: MetadataOption[];
	tags: Record<string, StatusTagMetaItem>;
}

export type CmsEnumsMetadata = Record<string, MetadataOption[]>;

export interface CmsMetadata {
	app?: CmsAppMetadata;
	pagination?: CmsPaginationMetadata;
	statuses?: CmsStatusesMetadata;
	enums?: CmsEnumsMetadata;
}

export type MetadataKey = keyof CmsMetadata;

export interface MetadataQueryParams {
	keys?: MetadataKey[] | string;
	force?: boolean;
}
