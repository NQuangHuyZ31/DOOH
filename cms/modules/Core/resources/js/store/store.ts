import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@modules/Auth/resources/js/store/authSlice';
import permissionReducer from '@modules/User/resources/js/store/permissionSlice';
import roleReducer from '@modules/User/resources/js/store/roleSlice';
import userReducer from '@modules/User/resources/js/store/userSlice';
import venueReducer from '@modules/Venue/resources/js/store/venueSlice';
import creativeReducer from '@modules/Creative/resources/js/store/creativeSlice';
import vendorReducer from '@modules/Vendor/resources/js/store/vendorSlice';
import deliveryReducer from '@modules/Delivery/resources/js/store/deliverySlice';
import metadataReducer from './metadataSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		user: userReducer,
		role: roleReducer,
		permission: permissionReducer,
		venue: venueReducer,
		creative: creativeReducer,
		vendor: vendorReducer,
		delivery: deliveryReducer,
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
