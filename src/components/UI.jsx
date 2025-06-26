import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setVideoSrc } from "../store/videoRecognitionSlice";
import { setJsonData, setJsonFileName } from "../store/jsonSlice";
import { getModeName, setMode } from "../store/modeSlice";
import { setAvatar } from "../store/avatarSlice";
import {
  setUpperArmOffset,
  setLowerArmOffset,
  setHandOffset,
  resetOffsets,
} from "../store/offsetSlice";
import { OffsetSliders } from "../components/OffsetSliders";

export const UI = () => {
  const dispatch = useDispatch();

  const offset = useSelector((state) => state.offset);

  const mode = useSelector((state) => state.mode.mode);
  const jsonFileName = useSelector((state) => state.json.jsonFileName);
  const videoFileName = useSelector(
    (state) => state.videoRecognition.videoFileName
  );

  const videoInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useEffect(() => {
    loadDefaultJson();
  }, []);

  const handleAvatarChange = (e) => {
    dispatch(setAvatar(e.target.value));
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleJsonClick = () => {
    jsonInputRef.current?.click();
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch(setVideoSrc({ url, fileName: file.name }));
      dispatch(setMode("video"));
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          dispatch(setJsonData(json));
          dispatch(setJsonFileName(file.name));
          dispatch(setMode("json-upload"));
        } catch (err) {
          console.error("Invalid JSON file", err);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadDefaultJson = () => {
    dispatch(setMode("json-default"));
    dispatch(setJsonFileName("קובץ ברירת מחדל"));

    if (jsonInputRef.current) {
      jsonInputRef.current.value = null;
    }
  };

  return (
    <>
      <section className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute top-4 left-4 md:bottom-8 md:right-14">
          <a href="#" target="_blank">
            <img
              src="/images/deaf-dialect.png"
              alt="deaf dialect logo"
              className="w-20 h-20 object-contain"
            />
          </a>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-xl [writing-mode:vertical-rl] rotate-180">
          © Hannael Galili
        </div>
      </section>

      <div
        dir="rtl"
        className="absolute top-4 right-4 px-10 pt-3 pb-5 z-50 space-y-4 text-white pointer-events-auto bg-black/50 px-7 py-1 rounded-lg backdrop-blur-sm"
      >
        <div>
          <label className="block">בחר דמות:</label>
          <select
            onChange={handleAvatarChange}
            className="text-black bg-white rounded px-3 py-1 w-full"
          >
            <option value="Tami.vrm">תמי</option>
            <option value="Dan.vrm">דן</option>
          </select>
        </div>

        <div>
          <label className="block">העלה קובץ וידאו:</label>
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            onChange={handleVideoUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={handleVideoClick}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded w-full"
          >
            לחץ כאן
          </button>
        </div>

        <div>
          <label className="block">העלה קובץ JSON:</label>
          <input
            type="file"
            accept=".json"
            ref={jsonInputRef}
            onChange={handleJsonUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={handleJsonClick}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded w-full"
          >
            לחץ כאן
          </button>
        </div>

        <div>
          <button
            onClick={loadDefaultJson}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded w-full"
          >
            קובץ ברירת מחדל
          </button>
        </div>

        <div className="px-3 text-sm text-gray-300">
          <strong>קובץ טעינה:</strong> {getModeName(mode)}
        </div>

        <p className="text-xs text-gray-300 mt-1 truncate max-w-xs">
          {mode === "video"
            ? videoFileName && <>📼 {videoFileName}</>
            : jsonFileName && <>📄 {jsonFileName}</>}
        </p>

        <OffsetSliders
          label="Upper Arm Offset"
          offset={offset.upperArmOffset}
          setOffset={setUpperArmOffset}
        />
        <OffsetSliders
          label="Lower Arm Offset"
          offset={offset.lowerArmOffset}
          setOffset={setLowerArmOffset}
        />
        <OffsetSliders
          label="Hand Offset"
          offset={offset.handOffset}
          setOffset={setHandOffset}
        />
        <button
          className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded w-full"
          onClick={() => dispatch(resetOffsets())}
        >
          איפוס אופסטים
        </button>
      </div>
    </>
  );
};
