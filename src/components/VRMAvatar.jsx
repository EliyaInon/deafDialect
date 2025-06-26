import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Face, Hand, Pose } from "kalidokit";
import { useControls } from "leva";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Euler, Object3D, Quaternion, Vector3 } from "three";
import { lerp } from "three/src/math/MathUtils.js";
import { useVideoRecognition } from "../hooks/useVideoRecognition";
import { remapMixamoAnimationToVrm } from "../utils/remapMixamoAnimationToVrm";
import { useSelector } from "react-redux";

const tmpVec3 = new Vector3();
const tmpQuat = new Quaternion();
const tmpEuler = new Euler();

export const VRMAvatar = ({ avatar, ...props }) => {
  const { scene, userData } = useGLTF(
    `models/${avatar}`,
    undefined,
    undefined,
    (loader) => {
      loader.register((parser) => {
        return new VRMLoaderPlugin(parser);
      });
    }
  );
  const upperArmOffset = useSelector((state) => state.offset.upperArmOffset);
  const lowerArmOffset = useSelector((state) => state.offset.lowerArmOffset);
  const handOffset = useSelector((state) => state.offset.handOffset);
  const assetA = useFBX("models/animations/Swing Dancing.fbx");
  const assetB = useFBX("models/animations/Thriller Part 2.fbx");
  const assetC = useFBX("models/animations/Breathing Idle.fbx");

  const currentVrm = userData.vrm;

  const animationClipA = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetA);
    clip.name = "Swing Dancing";
    return clip;
  }, [assetA, currentVrm]);

  const animationClipB = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetB);
    clip.name = "Thriller Part 2";
    return clip;
  }, [assetB, currentVrm]);

  const animationClipC = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetC);
    clip.name = "Idle";
    return clip;
  }, [assetC, currentVrm]);

  const { actions } = useAnimations(
    [animationClipA, animationClipB, animationClipC],
    currentVrm.scene
  );

  useEffect(() => {
    const vrm = userData.vrm;
    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);
    VRMUtils.combineMorphs(vrm);

    // Disable frustum culling
    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });
  }, [scene]);

  const setResultsCallback = useVideoRecognition(
    (state) => state.setResultsCallback
  );
  const videoElement = useVideoRecognition((state) => state.videoElement);
  const riggedFace = useRef();
  const riggedPose = useRef();
  const riggedLeftHand = useRef();
  const riggedRightHand = useRef();
  const resultsCallback = useCallback(
    (results) => {
      if (!videoElement || !currentVrm) {
        return;
      }

      if (results.faceLandmarks) {
        riggedFace.current = Face.solve(results.faceLandmarks, {
          runtime: "mediapipe",
          video: videoElement,
          imageSize: { width: 640, height: 480 },
          smoothBlink: false,
          blinkSettings: [0.25, 0.75],
        });
      }

      if (results.za && results.poseLandmarks) {
        const solved = Pose.solve(results.za, results.poseLandmarks, {
          runtime: "mediapipe",
          video: videoElement,
        });

        const mirrorVector = ({ x, y, z }) => ({
          x,
          y: -y,
          z: -z,
        });
        const vector = (obj, x, y, z) => ({
          x: obj.x * x,
          y: obj.y * y,
          z: obj.z * z,
        });

        const upperArmsOffset = upperArmOffset || [1, 1, 1];
        const lowerArmsOffset = lowerArmOffset || [1, 1, 1];
        const handsOffset = handOffset || [1, 1, 1];
        if (solved) {
          riggedPose.current = {
            ...solved,
            LeftUpperArm: mirrorVector(
              vector(solved.RightUpperArm, ...upperArmsOffset)
            ),
            LeftLowerArm: mirrorVector(
              vector(solved.RightLowerArm, ...lowerArmsOffset)
            ),
            LeftHand: mirrorVector(vector(solved.RightHand, ...handsOffset)),
            RightUpperArm: mirrorVector(
              vector(solved.LeftUpperArm, ...upperArmsOffset)
            ),
            RightLowerArm: mirrorVector(
              vector(solved.LeftLowerArm, ...lowerArmsOffset)
            ),
            RightHand: mirrorVector(vector(solved.LeftHand, ...handsOffset)),
          };
        }
      }

      if (results.rightHandLandmarks) {
        riggedLeftHand.current = Hand.solve(results.rightHandLandmarks, "Left");
      }

      if (results.leftHandLandmarks) {
        riggedRightHand.current = Hand.solve(
          results.leftHandLandmarks,
          "Right"
        );
      }
    },
    [videoElement, currentVrm, upperArmOffset, lowerArmOffset, handOffset]
  );

  useEffect(() => {
    setResultsCallback(resultsCallback);
  }, [resultsCallback]);

  const {
    aa,
    ih,
    ee,
    oh,
    ou,
    blinkLeft,
    blinkRight,
    angry,
    sad,
    happy,
    animation,
  } = useControls("VRM", {
    aa: { value: 0, min: 0, max: 1 },
    ih: { value: 0, min: 0, max: 1 },
    ee: { value: 0, min: 0, max: 1 },
    oh: { value: 0, min: 0, max: 1 },
    ou: { value: 0, min: 0, max: 1 },
    blinkLeft: { value: 0, min: 0, max: 1 },
    blinkRight: { value: 0, min: 0, max: 1 },
    angry: { value: 0, min: 0, max: 1 },
    sad: { value: 0, min: 0, max: 1 },
    happy: { value: 0, min: 0, max: 1 },
    animation: {
      options: ["None", "Idle", "Swing Dancing", "Thriller Part 2"],
      value: "Idle",
    },
  });

  useEffect(() => {
    if (animation === "None" || videoElement) {
      return;
    }
    actions[animation]?.play();
    return () => {
      actions[animation]?.stop();
    };
  }, [actions, animation, videoElement]);

  const lerpExpression = (name, value, lerpFactor) => {
    userData.vrm.expressionManager.setValue(
      name,
      lerp(userData.vrm.expressionManager.getValue(name), value, lerpFactor)
    );
  };

  const rotateBone = (
    boneName,
    value,
    slerpFactor,
    flip = {
      x: 1,
      y: 1,
      z: 1,
    }
  ) => {
    const bone = userData.vrm.humanoid.getNormalizedBoneNode(boneName);
    if (!bone) {
      console.warn(
        `Bone ${boneName} not found in VRM humanoid. Check the bone name.`
      );
      console.log("userData.vrm.humanoid.bones", userData.vrm.humanoid);
      return;
    }

    tmpEuler.set(value.x * flip.x, value.y * flip.y, value.z * flip.z);
    tmpQuat.setFromEuler(tmpEuler);
    bone.quaternion.slerp(tmpQuat, slerpFactor);
  };

  useFrame((_, delta) => {
    if (!userData.vrm) {
      return;
    }
    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    if (!videoElement) {
      [
        {
          name: "aa",
          value: aa,
        },
        {
          name: "ih",
          value: ih,
        },
        {
          name: "ee",
          value: ee,
        },
        {
          name: "oh",
          value: oh,
        },
        {
          name: "ou",
          value: ou,
        },
        {
          name: "blinkLeft",
          value: blinkLeft,
        },
        {
          name: "blinkRight",
          value: blinkRight,
        },
      ].forEach((item) => {
        lerpExpression(item.name, item.value, delta * 5);
      });
    } else {
      if (riggedFace.current) {
        [
          {
            name: "aa",
            value: riggedFace.current.mouth.shape.A,
          },
          {
            name: "ih",
            value: riggedFace.current.mouth.shape.I,
          },
          {
            name: "ee",
            value: riggedFace.current.mouth.shape.E,
          },
          {
            name: "oh",
            value: riggedFace.current.mouth.shape.O,
          },
          {
            name: "ou",
            value: riggedFace.current.mouth.shape.U,
          },
          {
            name: "blinkLeft",
            value: 1 - riggedFace.current.eye.l,
          },
          {
            name: "blinkRight",
            value: 1 - riggedFace.current.eye.r,
          },
        ].forEach((item) => {
          lerpExpression(item.name, item.value, delta * 5);
        });
      }
      // Eyes
      if (lookAtTarget.current) {
        userData.vrm.lookAt.target = lookAtTarget.current;
        lookAtDestination.current.set(
          -15 * riggedFace.current.pupil.x,
          15 * riggedFace.current.pupil.y,
          0
        );
        lookAtTarget.current.position.lerp(
          lookAtDestination.current,
          delta * 5
        );
      }

      // Body
      rotateBone("neck", riggedFace.current.head, delta * 5, {
        x: 0.3,
        y: -0.3,
        z: -0.3,
      });
    }
    if (riggedPose.current) {
      // Body
      rotateBone("chest", riggedPose.current.Spine, delta * 5, {
        x: 0.1,
        y: -0.1,
        z: -0.1,
      });
      rotateBone("spine", riggedPose.current.Spine, delta * 5, {
        x: 0.1,
        y: -0.1,
        z: -0.1,
      });
      rotateBone("hips", riggedPose.current.Hips.rotation, delta * 5, {
        x: 0.1,
        y: -0.1,
        z: -0.1,
      });

      // LEFT ARM
      rotateBone("leftUpperArm", riggedPose.current.LeftUpperArm, delta * 5);
      rotateBone("leftLowerArm", riggedPose.current.LeftLowerArm, delta * 5);

      // RIGHT ARM
      rotateBone("rightUpperArm", riggedPose.current.RightUpperArm, delta * 5);
      rotateBone("rightLowerArm", riggedPose.current.RightLowerArm, delta * 5);

      if (riggedLeftHand.current && riggedLeftHand.current.LeftWrist) {
        rotateBone(
          "leftHand",
          {
            z: riggedPose.current.LeftHand?.z || 0,
            y: riggedLeftHand.current.LeftWrist.y,
            x: riggedLeftHand.current.LeftWrist.x,
          },
          delta * 5
        );

        rotateBone(
          "leftRingProximal",
          riggedLeftHand.current.LeftRingProximal,
          delta * 5
        );
        rotateBone(
          "leftRingIntermediate",
          riggedLeftHand.current.LeftRingIntermediate,
          delta * 5
        );
        rotateBone(
          "leftRingDistal",
          riggedLeftHand.current.LeftRingDistal,
          delta * 5
        );
        rotateBone(
          "leftIndexProximal",
          riggedLeftHand.current.LeftIndexProximal,
          delta * 5
        );
        rotateBone(
          "leftIndexIntermediate",
          riggedLeftHand.current.LeftIndexIntermediate,
          delta * 5
        );
        rotateBone(
          "leftIndexDistal",
          riggedLeftHand.current.LeftIndexDistal,
          delta * 5
        );
        rotateBone(
          "leftMiddleProximal",
          riggedLeftHand.current.LeftMiddleProximal,
          delta * 5
        );
        rotateBone(
          "leftMiddleIntermediate",
          riggedLeftHand.current.LeftMiddleIntermediate,
          delta * 5
        );
        rotateBone(
          "leftMiddleDistal",
          riggedLeftHand.current.LeftMiddleDistal,
          delta * 5
        );
        rotateBone(
          "leftThumbProximal",
          riggedLeftHand.current.LeftThumbProximal,
          delta * 5
        );
        rotateBone(
          "leftThumbMetacarpal",
          riggedLeftHand.current.LeftThumbIntermediate,
          delta * 5
        );
        rotateBone(
          "leftThumbDistal",
          riggedLeftHand.current.LeftThumbDistal,
          delta * 5
        );
        rotateBone(
          "leftLittleProximal",
          riggedLeftHand.current.LeftLittleProximal,
          delta * 5
        );
        rotateBone(
          "leftLittleIntermediate",
          riggedLeftHand.current.LeftLittleIntermediate,
          delta * 5
        );
        rotateBone(
          "leftLittleDistal",
          riggedLeftHand.current.LeftLittleDistal,
          delta * 5
        );
      }

      if (riggedRightHand.current && riggedRightHand.current.RightWrist) {
        rotateBone(
          "rightHand",
          {
            z: riggedPose.current.RightHand?.z || 0,
            y: riggedRightHand.current.RightWrist.y,
            x: riggedRightHand.current.RightWrist.x,
          },
          delta * 5
        );

        rotateBone(
          "rightRingProximal",
          riggedRightHand.current.RightRingProximal,
          delta * 5
        );
        rotateBone(
          "rightRingIntermediate",
          riggedRightHand.current.RightRingIntermediate,
          delta * 5
        );
        rotateBone(
          "rightRingDistal",
          riggedRightHand.current.RightRingDistal,
          delta * 5
        );
        rotateBone(
          "rightIndexProximal",
          riggedRightHand.current.RightIndexProximal,
          delta * 5
        );
        rotateBone(
          "rightIndexIntermediate",
          riggedRightHand.current.RightIndexIntermediate,
          delta * 5
        );
        rotateBone(
          "rightIndexDistal",
          riggedRightHand.current.RightIndexDistal,
          delta * 5
        );
        rotateBone(
          "rightMiddleProximal",
          riggedRightHand.current.RightMiddleProximal,
          delta * 5
        );
        rotateBone(
          "rightMiddleIntermediate",
          riggedRightHand.current.RightMiddleIntermediate,
          delta * 5
        );
        rotateBone(
          "rightMiddleDistal",
          riggedRightHand.current.RightMiddleDistal,
          delta * 5
        );
        rotateBone(
          "rightThumbProximal",
          riggedRightHand.current.RightThumbProximal,
          delta * 5
        );
        rotateBone(
          "rightThumbMetacarpal",
          riggedRightHand.current.RightThumbIntermediate,
          delta * 5
        );
        rotateBone(
          "rightThumbDistal",
          riggedRightHand.current.RightThumbDistal,
          delta * 5
        );
        rotateBone(
          "rightLittleProximal",
          riggedRightHand.current.RightLittleProximal,
          delta * 5
        );
        rotateBone(
          "rightLittleIntermediate",
          riggedRightHand.current.RightLittleIntermediate,
          delta * 5
        );
        rotateBone(
          "rightLittleDistal",
          riggedRightHand.current.RightLittleDistal,
          delta * 5
        );
      }
    }

    userData.vrm.update(delta);
  });

  const lookAtDestination = useRef(new Vector3(0, 0, 0));
  const camera = useThree((state) => state.camera);
  const lookAtTarget = useRef();
  useEffect(() => {
    lookAtTarget.current = new Object3D();
    camera.add(lookAtTarget.current);
  }, [camera]);

  return (
    <group {...props}>
      <primitive
        object={scene}
        rotation-y={avatar !== "3636451243928341470.vrm" ? Math.PI : 0}
      />
    </group>
  );
};
