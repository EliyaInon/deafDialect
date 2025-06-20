import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface JsonState {
  data: any | null;
  jsonFileName: string | null;
}

const initialState: JsonState = {
  data: null,
  jsonFileName: null,
};

const jsonSlice = createSlice({
  name: "jsonData",
  initialState,
  reducers: {
    setJsonData(state, action: PayloadAction<any>) {
      state.data = action.payload;
    },
    setJsonFileName(state, action: PayloadAction<string>) {
      state.jsonFileName = action.payload;
    },
    clearJsonData(state) {
      state.data = null;
      state.jsonFileName = null;
    },
  },
});

export const { setJsonData, setJsonFileName, clearJsonData } = jsonSlice.actions;
export default jsonSlice.reducer;
