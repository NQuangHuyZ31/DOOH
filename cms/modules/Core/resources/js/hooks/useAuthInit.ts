import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { getAuthToken } from '../utils/tokenStorage';
import { setInitialized } from '@modules/Auth/resources/js/store/authSlice';
import { fetchMe } from '@modules/Auth/resources/js/store/authThunk';

export function useAuthInit(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      dispatch(fetchMe());
    } else {
      dispatch(setInitialized(true));
    }
  }, [dispatch]);
}

export default useAuthInit;
