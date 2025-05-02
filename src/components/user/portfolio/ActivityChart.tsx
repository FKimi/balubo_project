import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// サンプルデータ型
export type ActivityData = {
  date: string; // "YYYY-MM-DD"
  count: number; // アクション数
};

export type ActivityChartProps = {
  data: ActivityData[];
  height?: number;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ActivityData; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
        <div>{payload[0].payload.date}</div>
        <div className="font-bold text-blue-600">{payload[0].payload.count} アクション</div>
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, height = 180 }) => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 年月グラフ用データ型
export type ActivityMonthData = {
  ym: string; // "YYYY-MM"
  count: number;
};

export type ActivityMonthChartProps = {
  data: ActivityMonthData[];
  height?: number;
};

export const ActivityMonthChart: React.FC<ActivityMonthChartProps> = ({ data, height = 180 }) => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="ym" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
                  <div>{payload[0].payload.ym}</div>
                  <div className="font-bold text-blue-600">{payload[0].payload.count} 件</div>
                </div>
              );
            }
            return null;
          }} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
