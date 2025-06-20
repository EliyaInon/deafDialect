import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setResultsCallback } from "../store/videoRecognitionSlice";
import { Holistic } from "@mediapipe/holistic";

export const VideoWidget = ({ videoSrc, width = 200, height = 150 }) => {
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const holisticRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    holisticRef.current = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holisticRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holisticRef.current.onResults((results) => {
      dispatch(setResultsCallback(results));
    });

    return () => {
      holisticRef.current?.close?.();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = videoSrc;
  }, [videoSrc]);

  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !holisticRef.current) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let rafId;

    const render = async () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      await holisticRef.current.send({ image: video });

      rafId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  return (
    <div className="fixed bottom-24 right-4 z-10 rounded-xl overflow-hidden shadow-lg">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute z-0"
      />
      <video
        ref={videoRef}
        className="w-full z-10 h-full opacity-50"
        autoPlay
        muted
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};
