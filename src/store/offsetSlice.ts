import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OffsetState {
  upperArmOffset: [number, number, number];
  lowerArmOffset: [number, number, number];
  handOffset: [number, number, number];
}

const initialState: OffsetState = {
  upperArmOffset: [1, 1, 1],
  lowerArmOffset: [1, 1, 1],
  handOffset: [1, 1, 1],
};

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
    resetOffsets(state) {
      state.upperArmOffset = [1, 1, 1];
      state.lowerArmOffset = [1, 1, 1];
      state.handOffset = [1, 1, 1];
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
