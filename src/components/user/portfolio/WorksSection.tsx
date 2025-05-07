import React, { useState } from "react";
import { Work, UserCategory } from '../../../types';
import { formatYearMonth } from '../../../app/lib/utils/dateFormat';

interface Props {
  userWorks: Work[];
  userCategories: UserCategory[];
  categoryTab: string;
  setCategoryTab: (id: string) => void;
  isCurrentUser: boolean;
  onWorkClick: (id: string) => void;
  onAddCategory?: () => void;
}

const WorksSection: React.FC<Props> = ({
  userWorks,
  userCategories,
  categoryTab,
  setCategoryTab,
  isCurrentUser,
  onWorkClick,
  onAddCategory
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
      {/* 作品ジャンル用タブナビゲーション＋作品追加ボタン */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${categoryTab === 'all' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
            onClick={() => setCategoryTab('all')}
            aria-selected={categoryTab === 'all'}
            tabIndex={0}
            type="button"
          >全て</button>
          {userCategories.map(cat => (
            <button
              key={cat.id}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${categoryTab === cat.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
              onClick={() => setCategoryTab(cat.id)}
              aria-selected={categoryTab === cat.id}
              tabIndex={0}
              type="button"
            >{cat.name}</button>
          ))}
          {isCurrentUser && onAddCategory && (
            <button
              className="px-3 py-1 rounded text-sm font-medium bg-white border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              onClick={onAddCategory}
              type="button"
            >
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                カテゴリを追加
              </span>
            </button>
          )}
        </div>

        {isCurrentUser && (
          <button
            className="px-5 py-2 bg-indigo-600 text-white rounded-full font-semibold shadow hover:bg-indigo-700 transition flex items-center"
            onClick={() => onWorkClick('create')}
            type="button"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            作品を追加
          </button>
        )}
      </div>
      {/* 作品リスト: カスタムカテゴリでフィルタリング */}
      {userWorks.filter(work => categoryTab === 'all' || work.categoryIds?.includes(categoryTab)).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {userWorks
            .filter(work => categoryTab === 'all' || work.categoryIds?.includes(categoryTab))
            .map((work) => (
              <div
                key={work.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => onWorkClick(work.id)}
              >
                <div className="relative pb-[56.25%] bg-gray-100">
                  {work.thumbnail_url ? (
                    <img
                      src={work.thumbnail_url}
                      alt={work.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8v-9H6V5h9v-1h4a2 2 0 0 0 2-2V1a2 2 0 0 0-2-2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No Image</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                    {work.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {work.description}
                  </p>
                  {work.tags && work.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {work.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {work.tags.length > 3 && (
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs font-medium">
                          +{work.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <span>
                      {formatYearMonth(work.published_date || work.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 4h8v8H8V8z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">作品がありません</h3>
            <p className="text-sm text-gray-500">
              「作品を追加」ボタンをクリックして、最初の作品を追加しましょう
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorksSection;
