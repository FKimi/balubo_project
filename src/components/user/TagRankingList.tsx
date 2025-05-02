import React from "react";

interface TagRankingListProps {
  tags: { name: string; value: number }[];
  maxCount?: number;
  colors?: string[];
}

const defaultColors = [
  "#f472b6", // pink
  "#fbbf24", // yellow
  "#60a5fa", // blue
  "#34d399", // green
  "#a78bfa", // purple
  "#f87171", // red
  "#38bdf8", // sky
];

export const TagRankingList: React.FC<TagRankingListProps> = ({
  tags,
  maxCount,
  colors = defaultColors,
}) => {
  if (!tags || tags.length === 0) return <div className="text-gray-400 py-8">タグデータがありません</div>;
  const max = maxCount || Math.max(...tags.map((t) => t.value), 1);

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      {tags.map((tag, idx) => (
        <div key={tag.name} className="flex items-center gap-3">
          {/* タグ名＋件数 */}
          <span className="w-32 truncate font-semibold text-gray-800 text-base" title={tag.name}>{tag.name}</span>
          <span className="w-8 text-right text-gray-500 font-bold">{tag.value}</span>
          {/* 進捗バー */}
          <div className="flex-1">
            <div
              className="h-3 rounded-full"
              style={{
                width: `${(tag.value / max) * 100}%`,
                background: colors[idx % colors.length],
                opacity: 0.85,
                transition: 'width 0.4s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TagRankingList;
