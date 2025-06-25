import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { Leva } from "leva";
import { VideoWidget } from "./components/VideoWidget";
import { useSelector } from "react-redux";
import React from "react";

function App() {
  const videoSrc = useSelector((state) => state.videoRecognition.videoSrc);
  const mode = useSelector((state) => state.mode.mode);

  return (
    <>
      <UI />
      <Leva hidden />
      {mode === "video" && videoSrc != undefined ? (
        <VideoWidget videoSrc={videoSrc} />
      ) : (
        <React.Fragment />
      )}
      <Loader />
      <Canvas
        eventPrefix="layer"
        shadows
        camera={{ position: [0, 0, 4], fov: 40 }}
      >
        <color attach="background" args={["#1EFF00"]} />
        <fog attach="fog" args={["red", 10, 20]} />
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
