import { useEffect, useRef, useState } from "react";

export const JsonWidget = ({ jsonFile }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded shadow">
      <h4 className="font-bold mb-2">קובץ JSON נטען:</h4>
      <p>{jsonFile?.jsonFileName}</p>
    </div>
  );
};
