import React from "react";
import { Work } from "../../../types";

type Props = {
  works: Work[];
  currentWorkId?: string;
};

const RelatedWorksSection: React.FC<Props> = ({ works, currentWorkId }) => {
  if (!works || works.length === 0) return null;
  return (
    <div className="my-6">
      <h3 className="text-lg font-bold mb-2">関連作品</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {works
          .filter(w => w.id !== currentWorkId)
          .slice(0, 6)
          .map((work) => (
            <div key={work.id} className="bg-white rounded shadow p-3 flex flex-col">
              <img src={work.thumbnail_url || ''} alt={work.title} className="w-full h-32 object-contain rounded mb-2 bg-gray-100" />
              <div className="font-semibold text-indigo-700 truncate">{work.title}</div>
              <div className="text-xs text-gray-500 mb-1">{work.description?.slice(0, 40) || ''}</div>
              <div className="flex flex-wrap gap-1 mb-1">
                {work.tags?.map((t: string) => (
                  <span key={t} className="text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5">#{t}</span>
                ))}
              </div>
              <a href={work.url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-auto">詳細を見る</a>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RelatedWorksSection;
