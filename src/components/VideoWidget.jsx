import { useEffect, useRef, useState } from "react";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { useVideoRecognition } from "../hooks/useVideoRecognition";

export const VideoWidget = ({ videoSrc, width = 480, height = 360 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [isLandmarksVisible, setIsLandmarksVisible] = useState(true);
  const [detectedParts, setDetectedParts] = useState({
    face: null,
    body: null,
    left: null,
    right: null,
  });

  const latestPartsRef = useRef({
    face: null,
    body: null,
    left: null,
    right: null,
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevScoresRef = useRef({
    face: null,
    body: null,
    left: null,
    right: null,
  });

  const setVideoElement = useVideoRecognition((state) => state.setVideoElement);

  const calcVisibility = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return 0;
    const sum = landmarks.reduce((acc, l) => acc + (l.visibility ?? 1), 0);
    return Math.round((sum / landmarks.length) * 100);
  };

  const getStatus = (partKey, landmarks) => {
    if (!isAvatarReady) {
      const prev = prevScoresRef.current[partKey];
      return {
        status: "⏳ טוען",
        score: prev,
      };
    }

    if (!landmarks) {
      prevScoresRef.current[partKey] = null;
      return {
        status: "❌ שגיאה",
        score: null,
      };
    }

    const score = calcVisibility(landmarks);
    prevScoresRef.current[partKey] = score;

    return {
      status: "✅ זיהוי",
      score,
    };
  };

  const displayedStatus = {
    face: getStatus("face", detectedParts.face),
    body: getStatus("body", detectedParts.body),
    right: getStatus("right", detectedParts.right),
    left: getStatus("left", detectedParts.left),
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 2,
      smoothLandmarks: true,
      minDetectionConfidence: 0.1,
      minTrackingConfidence: 0.5,
      refineFaceLandmarks: true,
    });

    holistic.onResults((results) => {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hasFace = !!results.faceLandmarks;
      const hasLeft = !!results.leftHandLandmarks;
      const hasRight = !!results.rightHandLandmarks;
      const hasBody = !!results.poseLandmarks;

      latestPartsRef.current = {
        face: results.faceLandmarks ?? null,
        left: results.leftHandLandmarks ?? null,
        right: results.rightHandLandmarks ?? null,
        body: results.poseLandmarks ?? null,
      };

      if (hasBody)
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00cff7",
          lineWidth: 4,
        });
      if (hasBody)
        drawLandmarks(ctx, results.poseLandmarks, {
          color: "#ff0364",
          lineWidth: 2,
        });

      if (hasFace)
        drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1,
        });

      if (results.faceLandmarks?.length === 478)
        drawLandmarks(
          ctx,
          [results.faceLandmarks[468], results.faceLandmarks[473]],
          {
            color: "#ffe603",
            lineWidth: 2,
          }
        );

      if (hasLeft)
        drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
          color: "#eb1064",
          lineWidth: 5,
        });
      if (hasLeft)
        drawLandmarks(ctx, results.leftHandLandmarks, {
          color: "#00cff7",
          lineWidth: 2,
        });

      if (hasRight)
        drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
          color: "#22c3e3",
          lineWidth: 5,
        });
      if (hasRight)
        drawLandmarks(ctx, results.rightHandLandmarks, {
          color: "#ff0364",
          lineWidth: 2,
        });

      setIsAvatarReady(hasFace && (hasLeft || hasRight));

      useVideoRecognition.getState().resultsCallback?.(results);
    });

    const process = async () => {
      if (video && !video.paused && !video.ended) {
        await holistic.send({ image: video });
        requestAnimationFrame(process);
      }
    };

    video.onplay = () => process();
    setVideoElement(video);

    const interval = setInterval(() => {
      setDetectedParts({ ...latestPartsRef.current });
    }, 5000);

    return () => {
      holistic.reset();
      clearInterval(interval);
    };
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" style={{ width }}>
      <div className="mb-2 text-white text-xl flex items-center gap-2">
        <label className="bg-black/70 px-3 py-1 rounded shadow">
          <input
            type="checkbox"
            checked={isLandmarksVisible}
            onChange={(e) => setIsLandmarksVisible(e.target.checked)}
            className="mr-1"
          />
          Show landmarks
        </label>
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-lg bg-black relative"
        style={{ width, height }}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          controls
          onClick={handlePlayPause}
          className="w-full h-full object-contain"
          style={{ zIndex: 1, position: "absolute", top: 0, left: 0 }}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (video) {
              canvasRef.current.width = video.videoWidth;
              canvasRef.current.height = video.videoHeight;
            }
          }}
        />

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pb-6"
          style={{
            zIndex: 2,
            pointerEvents: "none",
            visibility: isLandmarksVisible ? "visible" : "hidden",
          }}
        />

        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer pb-6"
          onClick={handlePlayPause}
          style={{ zIndex: 3 }}
        >
          {!isPlaying && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="currentColor"
                opacity="0.3"
              />
              <polygon points="10,8 16,12 10,16" fill="white" />
            </svg>
          )}
        </div>
      </div>

      <div
        className="mt-2 text-l text-white text-right bg-black/60 rounded px-3 py-2 shadow"
        style={{ zIndex: 4 }}
      >
        <h4 className="text-sm font-bold underline mb-1">נתוני דמות</h4>
        <ul className="space-y-2 leading-tight">
          {["face", "body", "right", "left"].map((partKey) => {
            const labelMap = {
              face: "פנים",
              body: "גוף",
              right: "יד ימין",
              left: "יד שמאל",
            };

            const part = displayedStatus[partKey];
            const percentage = part.score ?? 0;
            const showBar = part.score !== null;

            const barColor = !showBar
              ? "bg-gray-500"
              : percentage >= 80
              ? "bg-green-500"
              : percentage >= 50
              ? "bg-yellow-400"
              : "bg-red-500";

            return (
              <li key={partKey}>
                <div className="flex justify-between mb-1 text-xl">
                  {showBar && <span>{percentage}%</span>}
                  <span>
                    {labelMap[partKey]}: {part.status}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className={`${barColor} h-full`}
                    style={{ width: `${showBar ? percentage : 100}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
