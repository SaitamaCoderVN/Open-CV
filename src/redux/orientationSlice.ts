import { createSlice } from '@reduxjs/toolkit';

interface OrientationState {
  baseOrientation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

const initialState: OrientationState = {
  baseOrientation: {
    alpha: 0,
    beta: 0,
    gamma: 0,
  },
};

const orientationSlice = createSlice({
  name: 'orientation',
  initialState,
  reducers: {
    resetBaseOrientation: (state) => {
      state.baseOrientation = {
        alpha: 0,
        beta: 0,
        gamma: 0,
      };
    },
    setBaseOrientation: (state, action) => {
      state.baseOrientation = action.payload;
    },
  },
});

export const { resetBaseOrientation, setBaseOrientation } = orientationSlice.actions;
export default orientationSlice.reducer;