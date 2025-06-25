import { CameraControls, Environment } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";
import { VRMAvatar } from "./VRMAvatar";
import { useSelector } from "react-redux";

export const Experience = () => {
  const controls = useRef();
  const avatar = useSelector((state) => state.avatar.avatar);
  const videoResults = useSelector((state) => state.videoRecognition.results);
  const fileResults = useSelector((state) => state.json.data);
  const mode = useSelector((state) => state.mode.mode);

  const [results, setResults] = useState();

  useEffect(() => {
    if (mode === "video") updateVideoResults();
    else updateFileResults();
  }, [mode]);

  useEffect(() => {
    updateVideoResults();
  }, [videoResults]);

  useEffect(() => {
    updateFileResults();
  }, [fileResults]);

  const updateVideoResults = () => setResults(videoResults);
  const updateFileResults = () => setResults(fileResults);
  return (
    <>
      <CameraControls
        ref={controls}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
        minDistance={3.5}
        maxDistance={3.5}
        mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
        touches={{ one: 0, two: 0, three: 0 }}
      />
      <directionalLight intensity={2} position={[10, 10, 5]} />
      <directionalLight intensity={1} position={[-10, 10, 5]} />
      <group position-y={-0.9}>
        <VRMAvatar avatar={avatar} results={results} />
      </group>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} />
      </EffectComposer>
    </>
  );
};
