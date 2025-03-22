import React, { useState, useEffect } from 'react';
import { 
  TagAnalysisResult, 
  generateTags, 
  analyzeTagTimeline 
} from '../lib/tag-analysis';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface TagAnalysisProps {
  userId: string;
  title: string;
  description?: string;
  url?: string;
  content?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const TagAnalysis: React.FC<TagAnalysisProps> = ({ 
  userId, 
  title, 
  description, 
  url, 
  content 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysisResult | null>(null);
  const [timeline, setTimeline] = useState<Array<{period: string; tags: Array<{name: string; count: number}>}>>([]);
  const [activeCluster, setActiveCluster] = useState<number>(0);

  useEffect(() => {
    const fetchTagAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. タグ生成
        const analysisResult = await generateTags({
          title,
          description,
          url,
          content
        });

        setTagAnalysis(analysisResult);

        // 2. タイムライン分析（ユーザーの過去の作品からタグの傾向を分析）
        if (userId) {
          const timelineData = await analyzeTagTimeline(userId);
          setTimeline(timelineData);
        }

      } catch (err) {
        console.error('Error in tag analysis:', err);
        setError('タグ分析中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTagAnalysis();
  }, [title, description, url, content, userId]);

  // タグクラスターの表示
  const renderTagClusters = () => {
    if (!tagAnalysis || !tagAnalysis.clusters || tagAnalysis.clusters.length === 0) {
      return <p>クラスターデータがありません</p>;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグクラスター</h3>
        <div className="flex gap-2 mb-4">
          {tagAnalysis.clusters.map((cluster, index) => (
            <button
              key={index}
              className={`px-3 py-1 rounded text-sm ${
                activeCluster === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setActiveCluster(index)}
            >
              {cluster.name}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{tagAnalysis.clusters[activeCluster].name}</h4>
          <div className="flex flex-wrap gap-2">
            {tagAnalysis.clusters[activeCluster].tags.map((tagName, index) => {
              // タグの関連性スコアを見つける
              const tagInfo = tagAnalysis.tags.find(t => t.name === tagName);
              return (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm flex items-center"
                >
                  <span>{tagName}</span>
                  {tagInfo && (
                    <span className="ml-1 bg-indigo-200 text-indigo-700 text-xs px-1 rounded-full">
                      {Math.round(tagInfo.relevance * 100)}%
                    </span>
                  )}
                </span>
              );
            })}
          </div>
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
      value: Math.round(tag.relevance * 100)
    }));

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">タグ関連性</h3>
        <div className="bg-gray-50 p-4 rounded-lg" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(value) => [`${value}%`, '関連性']} />
              <Legend />
              <Bar dataKey="value" name="関連性" fill="#8884d8" />
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
      
      {/* タグ一覧 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">生成されたタグ</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {tagAnalysis?.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm flex items-center"
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
      
      {/* タグクラスター */}
      {renderTagClusters()}
      
      {/* タグ関連性チャート */}
      {renderTagRelevanceChart()}
      
      {/* タグ分布チャート */}
      {renderTagDistributionChart()}
      
      {/* タイムライン分析 */}
      {timeline.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">タグ傾向の時系列分析</h3>
          <div className="bg-gray-50 p-4 rounded-lg" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeline}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                {timeline[0]?.tags.slice(0, 5).map((tag, index) => (
                  <Bar 
                    key={index} 
                    dataKey={`tags[${index}].count`} 
                    name={tag.name} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagAnalysis;
