import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { Leva } from "leva";
import { VideoWidget } from "./components/VideoWidget";
import { JsonWidget } from "./components/JsonWidget";
import { useSelector } from "react-redux";
import React, { useState } from "react";

function App() {
  const videoSrc = useSelector((state) => state.videoRecognition.videoSrc);
  const jsonFile = useSelector((state) => state.json);
  const mode = useSelector((state) => state.mode.mode);

  return (
    <>
      <UI />
      <Leva hidden />

      {mode === "video" && videoSrc != undefined ? (
        <VideoWidget videoSrc={videoSrc} />
      ) : (
        <JsonWidget jsonFile={jsonFile} />
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
