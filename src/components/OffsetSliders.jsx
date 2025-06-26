import { useDispatch } from "react-redux";

export const OffsetSliders = ({ label, offset, setOffset }) => {
  const dispatch = useDispatch();

  const update = (i, value) => {
    const newOffset = [...offset];
    newOffset[i] = parseFloat(value);
    dispatch(setOffset(newOffset));
  };

  return (
    <div className="mt-4 space-y-1">
      <div className="font-bold text-sm">{label}</div>
      {["X", "Y", "Z"].map((axis, i) => (
        <div key={axis}>
          <label className="text-xs block">
            {axis}: {offset[i].toFixed(2)}
          </label>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.01"
            value={offset[i]}
            onChange={(e) => update(i, e.target.value)}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
};
