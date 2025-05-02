import React from "react";

export type ActivityFilterProps = {
  range: "7d" | "30d" | "90d";
  setRange: (v: "7d" | "30d" | "90d") => void;
  type: string;
  setType: (v: string) => void;
  types: string[];
};

export const ActivityFilter: React.FC<ActivityFilterProps> = ({ range, setRange, type, setType, types }) => {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-4">
      <div className="flex gap-1">
        {["7d", "30d", "90d"].map((r) => (
          <button
            key={r}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shadow ${range === r ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            onClick={() => setRange(r as any)}
          >
            {r === "7d" ? "7日間" : r === "30d" ? "30日間" : "90日間"}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {types.map((t) => (
          <button
            key={t}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shadow ${type === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActivityFilter;
