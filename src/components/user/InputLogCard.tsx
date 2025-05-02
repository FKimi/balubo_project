import React from "react";

// ジャンル型を拡張
export type InputLogType = "本" | "映画" | "漫画" | "アニメ" | "ドラマ" | "音声" | "動画" | string;

// サムネイル画像・URL・タグ・説明・日付を含む拡張InputLog型
export interface InputLog {
  id: string;
  type: InputLogType;
  title: string;
  author?: string;
  comment?: string;
  createdAt: string;
  // 追加項目
  imageUrl?: string; // サムネイル画像
  tags?: string[];   // タグ
  description?: string; // 説明
  url?: string;      // 元URL
}

// ジャンルごとの色も拡張
const typeColor: Record<string, string> = {
  本: "bg-yellow-100 text-yellow-800",
  映画: "bg-blue-100 text-blue-800",
  漫画: "bg-pink-100 text-pink-800",
  アニメ: "bg-purple-100 text-purple-800",
  ドラマ: "bg-green-100 text-green-800",
  音声: "bg-orange-100 text-orange-800",
  動画: "bg-indigo-100 text-indigo-800",
};

export const InputLogCard: React.FC<{ log: InputLog }> = ({ log }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
    {/* サムネイル画像 */}
    {log.imageUrl && (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        <img src={log.imageUrl} alt={log.title} className="object-contain max-h-48 w-full" />
      </div>
    )}
    <div className="p-4 flex flex-col gap-2 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColor[log.type]}`}>{log.type}</span>
        <span className="font-semibold text-lg text-gray-900 truncate">{log.title}</span>
      </div>
      {log.author && <div className="text-xs text-gray-500">{log.type === "映画" ? "監督" : "著者"}: {log.author}</div>}
      {/* タグ表示 */}
      {log.tags && log.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {log.tags.map((tag, idx) => (
            <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>
          ))}
        </div>
      )}
      {/* 説明文 */}
      {log.description && (
        <div className="text-sm text-gray-700 mt-1 whitespace-pre-line line-clamp-3">{log.description}</div>
      )}
      {/* コメント */}
      {log.comment && <div className="text-sm text-gray-700 mt-1">{log.comment}</div>}
      {/* 元URLへのリンク */}
      {log.url && (
        <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7" /></svg>
          元リンクを見る
        </a>
      )}
      {/* 日付 */}
      <div className="text-right text-xs text-gray-400 mt-2">{new Date(log.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>
);

export default InputLogCard;
