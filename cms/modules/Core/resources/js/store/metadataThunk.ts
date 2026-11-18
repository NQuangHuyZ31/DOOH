import { createAsyncThunk } from '@reduxjs/toolkit';
import { metadataApi } from '../Action/metadataApi';
import type { CmsMetadata, MetadataQueryParams } from '../types/metadata';
import { extractErrorMessage } from '../utils/error';
import type { MetadataState } from './metadataSlice';

export const fetchMetadata = createAsyncThunk<
	CmsMetadata,
	MetadataQueryParams | void,
	{ rejectValue: string; state: { metadata: MetadataState } }
>(
	'metadata/fetchMetadata',
	async (params, { rejectWithValue }) => {
		try {
			const response = await metadataApi.getMetadata(params || undefined);
			return response.data.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to load CMS metadata.'));
		}
	},
	{
		condition: (params, { getState }) => {
			const { metadata } = getState();
			const query = params || undefined;
			if (metadata.loading) {
				return false;
			}
			if (metadata.initialized && !query?.force && !query?.keys) {
				return false;
			}
			return true;
		},
	},
);
