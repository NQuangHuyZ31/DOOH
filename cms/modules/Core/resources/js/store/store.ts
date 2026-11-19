import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@modules/Auth/resources/js/store/authSlice';
import permissionReducer from '@modules/User/resources/js/store/permissionSlice';
import roleReducer from '@modules/User/resources/js/store/roleSlice';
import userReducer from '@modules/User/resources/js/store/userSlice';
import venueReducer from '@modules/Venue/resources/js/store/venueSlice';
import metadataReducer from './metadataSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		user: userReducer,
		role: roleReducer,
		permission: permissionReducer,
		venue: venueReducer,
		metadata: metadataReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
