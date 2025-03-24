import React, { useState, useEffect } from 'react';
import { 
  TagAnalysisResult, 
  generateTags, 
  analyzeTagTimeline 
} from '../lib/tag-analysis';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TagTimelineChart, { TagTimelineData } from './TagTimelineChart';
import TagForceGraph from './TagForceGraph';

interface TagAnalysisProps {
  userId: string;
  title: string;
  description?: string;
  url?: string;
  content?: string;
  onTagSelect?: (tags: Array<{name: string; relevance: number}>) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const TagAnalysis: React.FC<TagAnalysisProps> = ({ 
  userId, 
  title, 
  description, 
  url, 
  content,
  onTagSelect 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysisResult | null>(null);
  const [timeline, setTimeline] = useState<TagTimelineData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'timeline'>('overview');
  const [selectedTags, setSelectedTags] = useState<Array<{name: string; relevance: number}>>([]);

  useEffect(() => {
    const fetchTagAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // タグ分析を実行
        const analysisResult = await generateTags({ title, description, url, content });
        setTagAnalysis(analysisResult);
        
        // タイムライン分析を実行
        const timelineData = await analyzeTagTimeline(userId);
        setTimeline(timelineData);
      } catch (err) {
        console.error('タグ分析エラー:', err);
        setError('タグ分析中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTagAnalysis();
  }, [userId, title, description, url, content]);

  // タグの選択状態を切り替える
  const toggleTagSelection = (tag: {name: string; relevance: number}) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.name === tag.name);
      
      if (isSelected) {
        // すでに選択されている場合は削除
        return prev.filter(t => t.name !== tag.name);
      } else {
        // 選択されていない場合は追加
        return [...prev, tag];
      }
    });
  };

  // 選択されたタグを親コンポーネントに通知
  const applySelectedTags = () => {
    if (onTagSelect && selectedTags.length > 0) {
      onTagSelect(selectedTags);
    }
  };

  // タグが選択されているかチェック
  const isTagSelected = (tagName: string) => {
    return selectedTags.some(tag => tag.name === tagName);
  };

  // タグクラスターの表示
  const renderTagClusters = () => {
    if (!tagAnalysis || !tagAnalysis.clusters || tagAnalysis.clusters.length === 0) {
      return <p>クラスターデータがありません</p>;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグクラスター</h3>
        <div className="space-y-4">
          {tagAnalysis.clusters.map((cluster, index) => {
            // クラスター内のタグの関連性スコアを取得
            const clusterTags = cluster.tags.map(tagName => {
              const tagInfo = tagAnalysis.tags.find(t => t.name === tagName);
              return {
                name: tagName,
                relevance: tagInfo ? tagInfo.relevance : 0
              };
            }).sort((a, b) => b.relevance - a.relevance);

            return (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">{cluster.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {clusterTags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm flex items-center"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${0.2 + tag.relevance * 0.8})`,
                      }}
                    >
                      <span>{tag.name}</span>
                      <span className="ml-1 bg-indigo-200 text-indigo-700 text-xs px-1 rounded-full">
                        {Math.round(tag.relevance * 100)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // タグ関連性チャートの表示
  const renderTagRelevanceChart = () => {
    if (!tagAnalysis || !tagAnalysis.tags || tagAnalysis.tags.length === 0) {
      return <p>タグデータがありません</p>;
    }

    // 上位10個のタグを取得
    const topTags = [...tagAnalysis.tags]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    const data = topTags.map(tag => ({
      name: tag.name,
      relevance: Math.round(tag.relevance * 100)
    }));

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグ関連性</h3>
        <div className="bg-gray-50 p-4 rounded-lg" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" />
              <Tooltip formatter={(value) => [`${value}%`, '関連性']} />
              <Bar dataKey="relevance" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // タグ分布チャートの表示
  const renderTagDistributionChart = () => {
    if (!tagAnalysis || !tagAnalysis.tags || tagAnalysis.tags.length === 0) {
      return <p>タグデータがありません</p>;
    }

    // 上位6個のタグを取得
    const topTags = [...tagAnalysis.tags]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 6);

    const data = topTags.map(tag => ({
      name: tag.name,
      value: Math.round(tag.relevance * 100)
    }));

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグ分布</h3>
        <div className="bg-gray-50 p-4 rounded-lg" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, '関連性']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // タグの関連度グラフ表示
  const renderTagRelevance = () => {
    if (!tagAnalysis || !tagAnalysis.tags || tagAnalysis.tags.length === 0) {
      return <p>タグデータがありません</p>;
    }

    const sortedTags = [...tagAnalysis.tags]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグの関連度</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedTags}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 1]} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fontSize: 12 }} 
              />
              <Tooltip 
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, '関連度']}
                labelFormatter={(label) => `タグ: ${label}`}
              />
              <Bar 
                dataKey="relevance" 
                fill="#8884d8"
                onClick={(data) => toggleTagSelection(data)}
              >
                {sortedTags.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isTagSelected(entry.name) ? '#FF8042' : COLORS[index % COLORS.length]} 
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            選択されたタグ: {selectedTags.map(tag => tag.name).join(', ') || 'なし'}
          </p>
          <button
            onClick={applySelectedTags}
            disabled={selectedTags.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            選択したタグを適用
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">エラー</span>
          </div>
          <p className="mt-1 ml-7">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">タグ分析</h2>
      
      {/* タブナビゲーション */}
      <div className="mb-6 border-b">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`py-2 px-3 text-sm font-medium ${
              activeTab === 'clusters'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            クラスター分析
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2 px-3 text-sm font-medium ${
              activeTab === 'timeline'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            時系列分析
          </button>
        </nav>
      </div>
      
      {/* 概要タブ */}
      {activeTab === 'overview' && (
        <>
          {/* タグ一覧 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">生成されたタグ</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {tagAnalysis?.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm flex items-center"
                    style={{
                      backgroundColor: `rgba(99, 102, 241, ${0.2 + tag.relevance * 0.8})`,
                    }}
                  >
                    <span>{tag.name}</span>
                    <span className="ml-1 bg-indigo-200 text-indigo-700 text-xs px-1 rounded-full">
                      {Math.round(tag.relevance * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* タグ関連性チャート */}
          {renderTagRelevanceChart()}
          
          {/* タグ分布チャート */}
          {renderTagDistributionChart()}
        </>
      )}
      
      {/* クラスター分析タブ */}
      {activeTab === 'clusters' && (
        <>
          {/* タグクラスター */}
          {renderTagClusters()}
          
          {/* インタラクティブなタグマップ */}
          {tagAnalysis && tagAnalysis.tags.length > 0 && tagAnalysis.clusters.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">インタラクティブタグマップ</h3>
              <p className="text-sm text-gray-600 mb-4">
                タグ間の関連性を視覚的に表現しています。同じクラスターに属するタグは同じ色で表示され、
                タグの大きさはその関連性の強さを表しています。マウスでドラッグして動かしたり、
                ホイールでズームイン/アウトできます。
              </p>
              <TagForceGraph 
                tags={tagAnalysis.tags} 
                clusters={tagAnalysis.clusters} 
              />
            </div>
          )}
        </>
      )}
      
      {/* 時系列分析タブ */}
      {activeTab === 'timeline' && (
        <>
          {/* タイムライン分析 */}
          {timeline.length > 0 ? (
            <TagTimelineChart timelineData={timeline} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">情報</span>
              </div>
              <p className="mt-1 ml-7">
                タイムラインデータがありません。複数の作品を登録すると、時間の経過に伴うタグの傾向変化を分析できます。
              </p>
            </div>
          )}
        </>
      )}
      
      {/* タグの関連度グラフ */}
      {renderTagRelevance()}
    </div>
  );
};

export default TagAnalysis;
