import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import cardReducer from './cardSlice';
import orientationReducer from './orientationSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    card: cardReducer,
    orientation: orientationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;