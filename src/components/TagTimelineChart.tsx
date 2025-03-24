import React, { useState, ReactElement } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// タグの時系列データのインターフェース
export interface TagTimelineData {
  period: string;
  tags: Array<{
    name: string;
    count: number;
  }>;
}

interface TagTimelineChartProps {
  timelineData: TagTimelineData[];
}

interface ProcessedTimelineData {
  period: string;
  total: number;
  [tagName: string]: number | string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#a4de6c', '#d0ed57'];

const TagTimelineChart: React.FC<TagTimelineChartProps> = ({ timelineData }) => {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('area');
  const [normalizeData, setNormalizeData] = useState(true);

  // 表示するタグの最大数
  const MAX_TAGS = 6;

  // 時系列データの処理
  const processTimelineData = (): ProcessedTimelineData[] => {
    if (!timelineData || timelineData.length === 0) return [];

    // 最初の期間のタグから上位タグを取得
    const topTags = [...timelineData[0].tags]
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TAGS)
      .map(tag => tag.name);

    // 各期間のデータを処理
    return timelineData.map(period => {
      const periodData: ProcessedTimelineData = {
        period: period.period,
        total: period.tags.reduce((sum: number, tag: { name: string; count: number }) => sum + tag.count, 0),
      };

      // 上位タグのデータを追加
      topTags.forEach(tagName => {
        const tagData = period.tags.find(t => t.name === tagName);
        periodData[tagName] = tagData ? (normalizeData ? (tagData.count / periodData.total) * 100 : tagData.count) : 0;
      });

      return periodData;
    });
  };

  const chartData = processTimelineData();
  const topTagNames = chartData.length > 0 ? 
    Object.keys(chartData[0]).filter(key => key !== 'period' && key !== 'total') : 
    [];

  // チャートの種類に応じたレンダリング
  const renderChart = (): ReactElement => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={50} />
            <YAxis label={{ value: normalizeData ? '割合 (%)' : '出現回数', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [normalizeData ? `${Number(value).toFixed(1)}%` : value, '']} />
            <Legend />
            {topTagNames.map((tag, index) => (
              <Bar 
                key={tag} 
                dataKey={tag} 
                stackId={normalizeData ? "a" : undefined}
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={50} />
            <YAxis label={{ value: normalizeData ? '割合 (%)' : '出現回数', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [normalizeData ? `${Number(value).toFixed(1)}%` : value, '']} />
            <Legend />
            {topTagNames.map((tag, index) => (
              <Area
                key={tag}
                type="monotone"
                dataKey={tag}
                stackId={normalizeData ? "1" : undefined}
                fill={COLORS[index % COLORS.length]}
                stroke={COLORS[index % COLORS.length]}
              />
            ))}
          </AreaChart>
        );
      
      case 'line':
        return (
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={50} />
            <YAxis label={{ value: normalizeData ? '割合 (%)' : '出現回数', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [normalizeData ? `${Number(value).toFixed(1)}%` : value, '']} />
            <Legend />
            {topTagNames.map((tag, index) => (
              <Line
                key={tag}
                type="monotone"
                dataKey={tag}
                stroke={COLORS[index % COLORS.length]}
              />
            ))}
          </LineChart>
        );
      
      default:
        // デフォルトは棒グラフを返す
        return (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={50} />
            <YAxis />
            <Tooltip />
            <Legend />
            {topTagNames.map((tag, index) => (
              <Bar key={tag} dataKey={tag} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        );
    }
  };

  // 円グラフのデータ準備
  const preparePieData = () => {
    if (!timelineData || timelineData.length === 0) return [];
    
    // 最新の期間のデータを使用
    const latestPeriod = timelineData[timelineData.length - 1];
    
    return latestPeriod.tags
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TAGS)
      .map(tag => ({
        name: tag.name,
        value: tag.count
      }));
  };

  const pieData = preparePieData();

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">タグの時系列分析</h3>
        <div className="flex space-x-2">
          <button
            className={`px-2 py-1 text-xs rounded ${
              chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setChartType('bar')}
          >
            棒グラフ
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              chartType === 'area' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setChartType('area')}
          >
            エリアチャート
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setChartType('line')}
          >
            折れ線グラフ
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              normalizeData ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setNormalizeData(!normalizeData)}
          >
            {normalizeData ? '割合表示' : '実数表示'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-gray-500 mt-2">
            最新期間のタグ分布
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagTimelineChart;
