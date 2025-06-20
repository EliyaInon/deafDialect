import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoRecognitionState {
  resultsCallback: ((results: any) => void) | null;
  videoSrc: string | null;
  videoFileName: string | null;
}

const initialState: VideoRecognitionState = {
  resultsCallback: null,
  videoSrc: null,
  videoFileName: null,
};

const videoRecognitionSlice = createSlice({
  name: "videoRecognition",
  initialState,
  reducers: {
    setResultsCallback(state, action: PayloadAction<(results: any) => void>) {
      state.resultsCallback = action.payload;
    },
    setVideoSrc(
      state,
      action: PayloadAction<{ url: string; fileName: string }>
    ) {
      state.videoSrc = action.payload.url;
      state.videoFileName = action.payload.fileName;
    },

    clearVideo(state) {
      state.videoSrc = null;
      state.videoFileName = null;
    },
  },
});

export const { setResultsCallback, setVideoSrc, clearVideo } =
  videoRecognitionSlice.actions;

export default videoRecognitionSlice.reducer;
