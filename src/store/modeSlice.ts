import { createSlice } from "@reduxjs/toolkit";

export type ModeState = "json-default" | "json-upload" | "video";

const modeToNames: Record<ModeState, string> = {
  "json-default": "קובץ ברירת מחדל",
  "json-upload": "קובץ מהמכשיר",
  "video": "וידאו",
};

const initialState: { mode: ModeState } = {
  mode: "json-default",
};

const modeSlice = createSlice({
  name: "mode",
  initialState,
  reducers: {
    setMode(state, action) {
      state.mode = action.payload;
    },
  },
});

export const getModeName = (mode: ModeState): string => modeToNames[mode];

export const { setMode } = modeSlice.actions;
export default modeSlice.reducer;
