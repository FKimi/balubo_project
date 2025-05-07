import React, { useEffect, useState } from 'react';
import { Work } from '../../../types';

interface Props {
  works: Work[];
  isCurrentUser: boolean;
  onWorkClick: (id: string) => void;
  onEditFeaturedWorks?: () => void;
}

const FeaturedWorks: React.FC<Props> = ({
  works,
  isCurrentUser,
  onWorkClick,
  onEditFeaturedWorks
}) => {
  // 現在表示中の作品インデックス
  const [currentIndex, setCurrentIndex] = useState(0);
  // 自動スライドショー用の状態
  const [isPaused, setIsPaused] = useState(false);
  
  // 作品が3つより少ない場合の表示
  const displayWorks = works.slice(0, 3);
  const emptySlots = 3 - displayWorks.length;

  // 次の作品を表示
  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === displayWorks.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 前の作品を表示
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? displayWorks.length - 1 : prevIndex - 1
    );
  };

  // 自動スライドショー
  useEffect(() => {
    if (displayWorks.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000); // 5秒ごとに次の作品を表示

    return () => clearInterval(interval);
  }, [displayWorks.length, isPaused, currentIndex]);

  // 現在表示中の作品
  const currentWork = displayWorks[currentIndex];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">代表作品</span>
          <span className="text-sm font-normal text-gray-500">
            ({currentIndex + 1}/{displayWorks.length} 作品)
          </span>
        </h2>
        
        {isCurrentUser && (
          <button
            onClick={onEditFeaturedWorks}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17v-4z" />
            </svg>
            編集
          </button>
        )}
      </div>

      {displayWorks.length === 0 ? (
        // 作品がない場合
        isCurrentUser ? (
          <div 
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl w-full h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition"
            onClick={onEditFeaturedWorks}
          >
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-500 mt-2">代表作を追加</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl w-full p-8 text-center">
            <p className="text-gray-400">代表作品がまだ設定されていません</p>
          </div>
        )
      ) : (
        // 作品がある場合はスライダーを表示
        <div 
          className="relative featured-works-slider bg-white rounded-xl shadow-md overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        >
          {/* 現在の作品を表示 */}
          {currentWork && (
            <div 
              className="featured-work-slide cursor-pointer"
              onClick={() => onWorkClick(currentWork.id)}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-64 md:h-80 bg-gray-100 relative">
                  {currentWork.thumbnail_url ? (
                    <img
                      src={currentWork.thumbnail_url}
                      alt={currentWork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No Image</p>
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{currentWork.title}</h3>
                  <p className="text-gray-600 mb-4 flex-grow">{currentWork.description}</p>
                  
                  {currentWork.tags && currentWork.tags.length > 0 && (
                    <div className="mt-auto">
                      <p className="text-sm text-gray-500 mb-2">タグ</p>
                      <div className="flex flex-wrap gap-2">
                        {currentWork.tags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="inline-flex items-center bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ナビゲーションドット */}
          {displayWorks.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {displayWorks.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  className={`h-2.5 w-2.5 rounded-full ${
                    index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`作品 ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* 左右ナビゲーションボタン */}
          {displayWorks.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2.5 rounded-full shadow-md hover:bg-opacity-100"
                aria-label="前の作品"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2.5 rounded-full shadow-md hover:bg-opacity-100"
                aria-label="次の作品"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* 追加ボタン（空きスロットがある場合） */}
          {isCurrentUser && emptySlots > 0 && displayWorks.length > 0 && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={onEditFeaturedWorks}
                className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm shadow-sm hover:bg-indigo-700"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                作品を追加 ({displayWorks.length}/3)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeaturedWorks; 