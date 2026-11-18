import { useEffect } from 'react';
import { setInitialized } from '@modules/Auth/resources/js/store/authSlice';
import { fetchMe } from '@modules/Auth/resources/js/store/authThunk';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearMetadata } from '../store/metadataSlice';
import { fetchMetadata } from '../store/metadataThunk';
import { getAuthToken } from '../utils/tokenStorage';

export function useAuthInit(): void {
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const metadataInitialized = useAppSelector((state) => state.metadata.initialized);

	useEffect(() => {
		const token = getAuthToken();
		if (token) {
			dispatch(fetchMe());
		} else {
			dispatch(setInitialized(true));
		}
	}, [dispatch]);

	useEffect(() => {
		if (isAuthenticated && !metadataInitialized) {
			dispatch(fetchMetadata());
		} else if (!isAuthenticated && metadataInitialized) {
			dispatch(clearMetadata());
		}
	}, [dispatch, isAuthenticated, metadataInitialized]);
}

export default useAuthInit;
