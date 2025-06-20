import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Face, Hand, Pose } from "kalidokit";
import { useControls } from "leva";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Euler, Object3D, Quaternion, Vector3 } from "three";
import { lerp } from "three/src/math/MathUtils.js";
import { remapMixamoAnimationToVrm } from "../utils/remapMixamoAnimationToVrm";

const tmpVec3 = new Vector3();
const tmpQuat = new Quaternion();
const tmpEuler = new Euler();

export const VRMAvatar = ({ avatar, results, ...props }) => {
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
    if (!scene || !userData.vrm) return;

    const vrm = userData.vrm;
    console.log("VRM loaded:", vrm);
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);
    VRMUtils.combineMorphs(vrm);

    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });
  }, [scene, userData.vrm]);

  // Refs to store solved rig data
  const riggedFace = useRef();
  const riggedPose = useRef();
  const riggedLeftHand = useRef();
  const riggedRightHand = useRef();

  // Whenever results change, solve landmarks with Kalidokit
  const updateRigged = useCallback(() => {
    if (!results || !currentVrm) return;

    if (results.faceLandmarks) {
      riggedFace.current = Face.solve(results.faceLandmarks, {
        runtime: "mediapipe",
        imageSize: { width: 640, height: 480 },
        smoothBlink: false,
        blinkSettings: [0.25, 0.75],
      });
    }

    if (results.poseLandmarks) {
      riggedPose.current = Pose.solve(results.za, results.poseLandmarks, {
        runtime: "mediapipe",
      });
    }

    if (results.leftHandLandmarks) {
      riggedRightHand.current = Hand.solve(results.leftHandLandmarks, "Right");
    }

    if (results.rightHandLandmarks) {
      riggedLeftHand.current = Hand.solve(results.rightHandLandmarks, "Left");
    }
  }, [results, currentVrm]);

  useEffect(() => {
    updateRigged();
  }, [updateRigged]);

  // Leva controls for manual expressions & animations
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
    if (animation === "None" || results) {
      return;
    }
    actions[animation]?.play();
    return () => {
      actions[animation]?.stop();
    };
  }, [actions, animation, results]);

  // Helper to lerp expression values smoothly
  const lerpExpression = (name, value, lerpFactor) => {
    if (!userData.vrm) return;
    userData.vrm.expressionManager.setValue(
      name,
      lerp(userData.vrm.expressionManager.getValue(name), value, lerpFactor)
    );
  };

  // Helper to rotate bone smoothly
  const rotateBone = (boneName, value, slerpFactor, flip = { x: 1, y: 1, z: 1 }) => {
    if (!userData.vrm) return;
    const bone = userData.vrm.humanoid.getNormalizedBoneNode(boneName);
    if (!bone) {
      console.warn(`Bone ${boneName} not found in VRM humanoid.`);
      return;
    }
    tmpEuler.set(value.x * flip.x, value.y * flip.y, value.z * flip.z);
    tmpQuat.setFromEuler(tmpEuler);
    bone.quaternion.slerp(tmpQuat, slerpFactor);
  };

  // LookAt target setup
  const lookAtDestination = useRef(new Vector3(0, 0, 0));
  const camera = useThree((state) => state.camera);
  const lookAtTarget = useRef();
  useEffect(() => {
    lookAtTarget.current = new Object3D();
    camera.add(lookAtTarget.current);
  }, [camera]);

  // Main animation frame loop
  useFrame((_, delta) => {
    if (!userData.vrm) return;

    // Set facial expressions
    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    if (!results) {
      // If no live results, use manual controls
      [
        { name: "aa", value: aa },
        { name: "ih", value: ih },
        { name: "ee", value: ee },
        { name: "oh", value: oh },
        { name: "ou", value: ou },
        { name: "blinkLeft", value: blinkLeft },
        { name: "blinkRight", value: blinkRight },
      ].forEach(({ name, value }) => {
        lerpExpression(name, value, delta * 12);
      });
    } else {
      // Use live results from Kalidokit
      if (riggedFace.current) {
        [
          { name: "aa", value: riggedFace.current.mouth.shape.A },
          { name: "ih", value: riggedFace.current.mouth.shape.I },
          { name: "ee", value: riggedFace.current.mouth.shape.E },
          { name: "oh", value: riggedFace.current.mouth.shape.O },
          { name: "ou", value: riggedFace.current.mouth.shape.U },
          { name: "blinkLeft", value: 1 - riggedFace.current.eye.l },
          { name: "blinkRight", value: 1 - riggedFace.current.eye.r },
        ].forEach(({ name, value }) => {
          lerpExpression(name, value, delta * 12);
        });
      }

      // Update eyes lookAt target
      if (lookAtTarget.current && riggedFace.current) {
        userData.vrm.lookAt.target = lookAtTarget.current;
        lookAtDestination.current.set(
          -2 * riggedFace.current.pupil.x,
          2 * riggedFace.current.pupil.y,
          0
        );
        lookAtTarget.current.position.lerp(lookAtDestination.current, delta * 5);
      }

      // Rotate neck based on face head rotation
      if (riggedFace.current) {
        rotateBone("neck", riggedFace.current.head, delta * 5, { x: 0.7, y: 0.7, z: 0.7 });
      }

      // Animate body pose
      if (riggedPose.current) {
        rotateBone("chest", riggedPose.current.Spine, delta * 5, { x: 0.3, y: 0.3, z: 0.3 });
        rotateBone("spine", riggedPose.current.Spine, delta * 5, { x: 0.3, y: 0.3, z: 0.3 });
        rotateBone("hips", riggedPose.current.Hips.rotation, delta * 5, { x: 0.7, y: 0.7, z: 0.7 });

        // Left arm
        rotateBone("leftUpperArm", riggedPose.current.LeftUpperArm, delta * 5);
        rotateBone("leftLowerArm", riggedPose.current.LeftLowerArm, delta * 5);

        // Right arm
        rotateBone("rightUpperArm", riggedPose.current.RightUpperArm, delta * 5);
        rotateBone("rightLowerArm", riggedPose.current.RightLowerArm, delta * 5);

        // Left hand fingers
        if (riggedLeftHand.current) {
          [
            "LeftHand",
            "LeftRingProximal",
            "LeftRingIntermediate",
            "LeftRingDistal",
            "LeftIndexProximal",
            "LeftIndexIntermediate",
            "LeftIndexDistal",
            "LeftMiddleProximal",
            "LeftMiddleIntermediate",
            "LeftMiddleDistal",
            "LeftThumbProximal",
            "LeftThumbIntermediate",
            "LeftThumbDistal",
            "LeftLittleProximal",
            "LeftLittleIntermediate",
            "LeftLittleDistal",
          ].forEach((bone) => {
            rotateBone(bone, riggedLeftHand.current[bone], delta * 12);
          });
        }

        // Right hand fingers
        if (riggedRightHand.current) {
          [
            "RightHand",
            "RightRingProximal",
            "RightRingIntermediate",
            "RightRingDistal",
            "RightIndexProximal",
            "RightIndexIntermediate",
            "RightIndexDistal",
            "RightMiddleProximal",
            "RightMiddleIntermediate",
            "RightMiddleDistal",
            "RightThumbProximal",
            "RightThumbIntermediate",
            "RightThumbDistal",
            "RightLittleProximal",
            "RightLittleIntermediate",
            "RightLittleDistal",
          ].forEach((bone) => {
            rotateBone(bone, riggedRightHand.current[bone], delta * 12);
          });
        }
      }
    }

    userData.vrm.update(delta);
  });

  return (
    <group {...props}>
      <primitive object={scene} rotation-y={Math.PI} />
    </group>
  );
};
