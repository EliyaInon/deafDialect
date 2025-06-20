import { CameraControls, Environment } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef } from "react";
import { VRMAvatar } from "./VRMAvatar";
import { useSelector } from "react-redux";

export const Experience = () => {
  const controls = useRef();
  const avatar = useSelector((state) => state.avatar.avatar);
  const results = useSelector((state) => state.videoRecognition.results);

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
