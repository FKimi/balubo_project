import React from "react";

type TagFrequency = {
  tag: string;
  count: number;
};

type Props = {
  tagFrequencies: TagFrequency[];
};

const getFontSize = (count: number, max: number, min: number) => {
  // フォントサイズは14px〜28pxで段階的に変化
  if (max === min) return "text-base";
  const step = (count - min) / (max - min);
  if (step > 0.8) return "text-2xl font-bold";
  if (step > 0.6) return "text-xl font-semibold";
  if (step > 0.4) return "text-lg font-medium";
  if (step > 0.2) return "text-base font-normal";
  return "text-sm text-gray-500";
};

const TagFrequencyDisplay: React.FC<Props> = ({ tagFrequencies }) => {
  if (!tagFrequencies || tagFrequencies.length === 0) return null;
  const max = Math.max(...tagFrequencies.map(t => t.count));
  const min = Math.min(...tagFrequencies.map(t => t.count));
  return (
    <div className="flex flex-wrap gap-3 my-4">
      {tagFrequencies.sort((a, b) => b.count - a.count).slice(0, 10).map(tag => (
        <span
          key={tag.tag}
          className={`transition-all rounded px-2 py-1 bg-indigo-50 text-indigo-700 ${getFontSize(tag.count, max, min)}`}
        >
          #{tag.tag} <span className="text-xs text-gray-400">({tag.count})</span>
        </span>
      ))}
    </div>
  );
};

export default TagFrequencyDisplay;
