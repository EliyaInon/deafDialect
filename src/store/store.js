import { configureStore } from "@reduxjs/toolkit";
import avatarReducer from "./avatarSlice";
import videoRecognitionReducer from "./videoRecognitionSlice";
import modeReducer from "./modeSlice";
import jsonRreducer from "./jsonSlice";

export const store = configureStore({
  reducer: {
    avatar: avatarReducer,
    videoRecognition: videoRecognitionReducer,
    mode: modeReducer,
    json: jsonRreducer,
  },
});
