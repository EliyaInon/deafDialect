import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OffsetState {
  upperArmOffset: [number, number, number];
  lowerArmOffset: [number, number, number];
  handOffset: [number, number, number];
}

const defaultState: OffsetState = {
  upperArmOffset: [1, 0.42, 1],
  lowerArmOffset: [1, 1.32, 1],
  handOffset: [1, 0.26, 1],
};
const initialState: OffsetState = defaultState;
const offsetSlice = createSlice({
  name: "offset",
  initialState,
  reducers: {
    setUpperArmOffset(state, action) {
      state.upperArmOffset = action.payload;
    },
    setLowerArmOffset(state, action) {
      state.lowerArmOffset = action.payload;
    },
    setHandOffset(state, action) {
      state.handOffset = action.payload;
    },
    resetOffsets() {
      return defaultState;
    },
  },
});

export const {
  setUpperArmOffset,
  setLowerArmOffset,
  setHandOffset,
  resetOffsets,
} = offsetSlice.actions;
export default offsetSlice.reducer;
