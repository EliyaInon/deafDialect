import { useEffect, useRef, useState } from "react";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { useVideoRecognition } from "../hooks/useVideoRecognition";

export const jsonWidget = ({ videoSrc, width = 480, height = 360 }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying || !videoElement.current) {
      setVideoElement(null);
      return;
    }

    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });

    holistic.onResults((results) => {
      useVideoRecognition.getState().resultsCallback?.(results);
    });

    let rafId;
    const process = async () => {
      if (
        videoElement.current &&
        !videoElement.current.paused &&
        !videoElement.current.ended
      ) {
        await holistic.send({ image: videoElement.current });
        rafId = requestAnimationFrame(process);
      }
    };

    videoElement.current.onplay = () => process();
    videoElement.current.onpause = () => setIsPlaying(false);
    videoElement.current.onended = () => setIsPlaying(false);

    setVideoElement(videoElement.current);
  }, [isPlaying]);

  return <></>;
};
