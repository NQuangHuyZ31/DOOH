import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@modules/Auth/resources/js/store/authSlice';
import userReducer from '@modules/User/resources/js/store/userSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		user: userReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
