import React, { useEffect, useState } from "react";
import { Lightbulb, Sparkles, Star, Users } from 'lucide-react';
// AI分析データを取得するためのAPIクライアント関数をインポート
import { getUserInsightsApi } from "@/api/user-insights";
import { analyzeUserTagsApi } from "@/api/services/tag-analysis-api";
// アプリケーション全体の状態（ユーザープロファイルなど）を管理するコンテキストから情報を取得
import { useApp } from "@/lib/context/AppContext";

// タグリストから簡単な紹介文を生成するヘルパー関数
// 引数: tags (タグの文字列配列), axis (分析の軸を示す文字列)
function generateOneLinerFromTagsV2(tags: string[], axis: "expertise"|"originality"|"engagement"): string {
  // タグがない場合は空文字列を返す
  if (!tags || tags.length === 0) return '';
  // タグの最初の3つを連結して表示用の文字列を作成
  const joined = tags.slice(0, 3).join("・");

  // 指定された軸に応じて異なるメッセージを返す
  switch(axis) {
    case "expertise":
      return `${joined} などの分野で高い専門性を発揮していることが推察されます。`;
    case "originality":
      return `${joined} など、ユニークかつ独自の視点を持っていると思われます。`;
    case "engagement":
      return `${joined} などから、人の心を動かす力があることがわかります。`;
    default:
      return ''; // 未知の軸の場合は空文字列
  }
}

// AI分析結果を表示するコンポーネント
const AiAnalysisSection: React.FC = () => {
  // AppContextからユーザープロファイルを取得
  const { userProfile } = useApp();

  // AI分析結果の状態と型定義
  const [insights, setInsights] = useState<{
    specialties?: string[]; // 専門分野タグのリスト
    clusters?: Array<{ name: string; tags: string[] }>; // タグクラスタのリスト
    originality?: { summary: string }; // オリジナリティに関するサマリー
    expertise?: { summary: string }; // 専門性に関するサマリー
    engagement?: { summary: string }; // エンゲージメントに関するサマリー
    overall_insight?: { summary: string }; // 総合的な考察
  } | null>(null); // 初期状態はnull

  // データの読み込み状態を管理
  const [loading, setLoading] = useState<boolean>(true);
  // エラーメッセージの状態を管理
  const [error, setError] = useState<string | null>(null);

  // コンポーネントマウント時、またはuserProfile.idが変更されたときにAI分析データを取得
  useEffect(() => {
    const fetchInsights = async () => {
      // userProfileやそのIDがない場合は処理を中断
      if (!userProfile?.id) {
          setLoading(false); // データ取得不要なのでローディング終了
          return;
      }

      setLoading(true); // 読み込み開始
      setError(null); // エラー状態をリセット

      try {
        // APIを呼び出してAI分析データを取得
        const result = await getUserInsightsApi(userProfile.id);

        // API呼び出しが成功し、データが存在する場合
        if (result.success && result.data) {
          // 取得したデータをstateにセット
          setInsights(result.data); // 型アサーションは不要
        } else {
          // API呼び出しが失敗した場合やデータがない場合、エラーメッセージをセット
          setError(result.error || "AI分析データの取得に失敗しました");
          setInsights(null); // データをクリア
        }
      } catch {
        // 予期せぬエラーが発生した場合
        console.error("Failed to fetch AI insights:");
        setError("データの取得中にエラーが発生しました。");
        setInsights(null); // データをクリア
      } finally {
        // 読み込み終了
        setLoading(false);
      }
    };

    // データ取得関数を実行
    fetchInsights();

    // userProfile.idが変更されたときにuseEffectを再実行
  }, [userProfile?.id]);

  // データの読み込み中の表示
  if (loading) {
      return (
          <div className="text-gray-400 py-8 text-center">
              <div className="flex justify-center items-center">
                 {/* シンプルなローディングスピナーなどをここに追加可能 */}
                 <span>読み込み中...</span>
              </div>
          </div>
      );
  }

  // エラー発生時の表示
  if (error) {
      return (
          <div className="text-red-500 py-8 text-center">
              {error}
          </div>
      );
  }

  // 分析データがまだ存在しない場合（例：初めてのユーザーなど）の表示
  // ローディング終了後かつエラーがなく、insightsがnullの場合
  if (!insights) {
      return (
          <div className="text-gray-400 py-8 text-center">
              まだAI分析データがありません。作品を登録すると分析が開始されます。
          </div>
      );
  }

  // 分析データが存在する場合、表示内容を準備

  // 専門分野タグを取得（存在しない場合は空配列）
  const specialties = insights.specialties || [];
  // specialtiesとclustersに含まれるタグを結合し、重複を排除したタグリストを作成
  // generateOneLinerFromTagsV2関数で使用される
  const tagList = specialties
    .concat((insights.clusters?.flatMap((c) => c.tags) ?? [])) // clusters内のタグをフラットに結合
    .filter((v, i, arr) => v && arr.indexOf(v) === i); // 重複を排除し、空文字列も除く

  // AI分析ボタン押下時にanalyzeUserTagsApiを呼び、最新のAI分析を実行・結果をstateに反映する
  const handleAiAnalysis = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await analyzeUserTagsApi(userProfile.id);
      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        setError(result.error || "AI分析に失敗しました");
        setInsights(null);
      }
    } catch {
      setError("AI分析処理中にエラーが発生しました。");
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  // カード風の枠内（AIによるクリエイター分析タイトルの右上）にボタンを配置
  return (
    <div className="relative bg-white rounded-2xl shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-green-400" aria-label="AI分析アイコン" />
          <h2 className="text-xl md:text-2xl font-bold text-green-700">あなたの才能分析</h2>
        </div>
        <button
          className="bg-gradient-to-r from-indigo-400 to-blue-400 text-white font-semibold rounded-full px-5 py-2 shadow hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm md:text-base"
          style={{ minWidth: 90 }}
          onClick={handleAiAnalysis}
          aria-label="AI分析を再実行"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI分析
          </span>
        </button>
      </div>
      {/* 主要3指標を横並び（PC時3カラム） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* 創造性 セクション */}
        <div className="bg-indigo-50 rounded-2xl p-7 shadow hover:shadow-lg transition-all flex flex-col min-h-[180px]">
          <div className="flex items-center mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400 mr-2" aria-label="創造性を示すアイコン" />
            <h3 className="text-lg font-bold text-indigo-700">創造性</h3>
          </div>
          {/* タグからの要約を試み、なければAI生成サマリーを表示 */}
          <p className="text-gray-700 mb-2 max-w-prose leading-relaxed break-words">
            {generateOneLinerFromTagsV2(tagList, "originality") || insights.originality?.summary}
          </p>
          <div className="text-xs text-indigo-600 font-semibold mt-auto">あなたの創造性と独自性が際立っています！</div>
        </div>

        {/* 専門性 セクション */}
        <div className="bg-blue-50 rounded-2xl p-7 shadow hover:shadow-lg transition-all flex flex-col min-h-[180px]">
          <div className="flex items-center mb-2">
            <Star className="w-6 h-6 text-blue-400 mr-2" aria-label="専門性を示すアイコン" />
            <h3 className="text-lg font-bold text-blue-700">専門性</h3>
          </div>
           {/* 専門分野タグからの要約を試み、なければAI生成サマリーを表示 */}
          <p className="text-gray-700 mb-2 max-w-prose leading-relaxed break-words">
            {generateOneLinerFromTagsV2(specialties, "expertise") || insights.expertise?.summary}
          </p>
          <div className="text-xs text-blue-600 font-semibold mt-auto">あなたの知識・技術力は高く評価されています。</div>
        </div>

        {/* 影響力・共感 セクション */}
        <div className="bg-pink-50 rounded-2xl p-7 shadow hover:shadow-lg transition-all flex flex-col min-h-[180px]">
          <div className="flex items-center mb-2">
            <Users className="w-6 h-6 text-pink-400 mr-2" aria-label="影響力・共感を示すアイコン" />
            <h3 className="text-lg font-bold text-pink-700">影響力</h3>
          </div>
          {/* タグからの要約を試み、なければAI生成サマリーを表示 */}
          <p className="text-gray-700 mb-2 max-w-prose leading-relaxed break-words">
            {generateOneLinerFromTagsV2(tagList, "engagement") || insights.engagement?.summary}
          </p>
          <div className="text-xs text-pink-600 font-semibold mt-auto">あなたの作品は多くの人に感動や共感を与えています。</div>
        </div>
      </div>

      {/* 総合的な考察は下段ワイド・中央寄せ */}
      <div className="bg-green-50 rounded-2xl p-8 shadow hover:shadow-lg transition-all max-w-3xl mx-auto mb-8 flex flex-col">
        <div className="flex items-center mb-2">
          <Lightbulb className="w-6 h-6 text-green-400 mr-2" aria-label="総合的な考察を示すアイコン" />
          <h3 className="text-lg font-bold text-green-700">総合的な考察</h3>
        </div>
        {/* 総合考察のAI生成サマリーを表示 */}
        {/* AI生成サマリーがない場合は、適切なフォールバックメッセージを表示することも検討可能 */}
        <p className="text-gray-700 mb-2 max-w-prose leading-relaxed break-words line-clamp-3">
          {insights.overall_insight?.summary || "AIによる総合的な考察はまだありません。"} {/* nullish coalescing operator でフォールバック */}
        </p>
        <div className="text-xs text-green-600 font-semibold mt-auto">あなたの成長と未来に大きな期待が寄せられています。</div>
      </div>
    </div>
  );
};

export default AiAnalysisSection;