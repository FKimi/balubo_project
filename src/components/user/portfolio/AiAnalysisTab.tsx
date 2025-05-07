import React from 'react';
import { motion } from 'framer-motion';

export type CreatorFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type AiAnalysis = {
  id: string;
  user_id: string;
  features: {
    creativity: CreatorFeature;
    expertise: CreatorFeature;
    influence: CreatorFeature;
  };
  overall_strength: string;
  creator_type: string;
  creator_type_description: string;
  future_potential: string;
  created_at: string;
  updated_at: string;
  analysis_version: number;
};

type AiAnalysisTabProps = {
  isCurrentUser: boolean;
  isAiAnalysisEmpty: boolean;
  isAiAnalysisLoading: boolean;
  aiAnalysisError: string | null;
  handleRunAiAnalysis: () => Promise<void>;
  aiAnalysis?: AiAnalysis | null;
};

// アイコン定義
const featureIcons = {
  creativity: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  expertise: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  influence: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
};

const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({
  isCurrentUser,
  isAiAnalysisEmpty,
  isAiAnalysisLoading,
  aiAnalysisError,
  handleRunAiAnalysis,
  aiAnalysis
}) => {
  // デフォルトの特性データ
  const defaultFeatures = {
    creativity: {
      id: 'creativity',
      title: '創造性',
      description: '独自の視点と表現力で、他にはない価値あるコンテンツを生み出す能力があります。新しいアイデアを生み出し、独創的な方法で表現することができます。',
      icon: 'creativity'
    },
    expertise: {
      id: 'expertise',
      title: '専門性',
      description: '特定分野における深い知識と洞察力を持ち、説得力のある質の高いコンテンツを提供しています。読者に信頼される情報と価値を届けることができます。',
      icon: 'expertise'
    },
    influence: {
      id: 'influence',
      title: '影響力',
      description: '読者・視聴者の感情や思考に響き、行動変容を促す力を持っています。共感を呼ぶ表現と説得力のあるメッセージで、人々に影響を与えることができます。',
      icon: 'influence'
    }
  };

  // 実際のデータか、デフォルトのデータを使用
  const features = aiAnalysis?.features || defaultFeatures;
  const overallStrength = aiAnalysis?.overall_strength || "創造的な表現者";
  
  const creatorTypeDescription = aiAnalysis?.creator_type_description || 
    "専門性と独自の視点を組み合わせた「創造的な表現者」タイプのクリエイターです。専門知識を分かりやすく伝えながら、創造的な表現で読者を惹きつける特徴があります。";
  const futurePotential = aiAnalysis?.future_potential || 
    "専門性をさらに深めつつ、より広い読者層にリーチする新しい表現方法への挑戦が期待されます。独自の視点を活かした、教育的コンテンツと創造的な表現を融合した作品が、今後の強みとなるでしょう。";

  // 分析データの最終更新日時
  const lastUpdated = aiAnalysis?.updated_at ? new Date(aiAnalysis.updated_at).toLocaleDateString('ja-JP') : null;
  
  // 分析バージョン
  const analysisVersion = aiAnalysis?.analysis_version || 1;

  return (
    <>
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="relative bg-gradient-to-r from-indigo-600 to-blue-500 p-6">
            <div className="absolute top-0 right-0 w-full h-full opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0,0 L100,0 C80,20 60,40 80,60 C100,80 90,100 0,100 Z" fill="white" />
              </svg>
            </div>
            
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-indigo-600 mr-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI分析レポート</h3>
                  {!isAiAnalysisEmpty && lastUpdated && (
                    <p className="text-blue-100 text-sm mt-1">
                      最終更新日: {lastUpdated} <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded-md text-xs">v{analysisVersion}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* AI分析更新ボタン */}
              {isCurrentUser && (
                <button 
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 shadow-sm transition text-sm font-semibold gap-1.5"
                  onClick={handleRunAiAnalysis}
                  disabled={isAiAnalysisLoading}
                >
                  {isAiAnalysisLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>更新中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 16L19 19M18 12H22M16 8L19 5M12 6V2M8 8L5 5M6 12H2M8 16L5 19M12 18V22M12 16C10.3431 16 9 14.6569 9 13C9 11.3431 10.3431 10 12 10C13.6569 10 15 11.3431 15 13C15 14.6569 13.6569 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>AI分析を更新</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* AI分析コンテンツ */}
          {isAiAnalysisEmpty ? (
            <div className="p-8 bg-white">
              <div className="text-center py-12 px-4">
                <div className="mb-6">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mx-auto"
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">クリエイティブ分析を始めましょう</h4>
                <p className="text-gray-600 max-w-lg mx-auto mb-6">
                  あなたの作品からAIが特徴や強みを分析します。クリエイターとしての可能性を発見し、さらなる成長へのヒントを得ましょう。
                </p>
                {isCurrentUser && (
                  <button 
                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl hover:shadow-lg shadow-md transition flex items-center justify-center gap-2 mx-auto font-semibold text-base"
                    onClick={handleRunAiAnalysis}
                    disabled={isAiAnalysisLoading}
                  >
                    {isAiAnalysisLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>AI分析を実行中... （数十秒かかる場合があります）</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI分析を実行する</span>
                      </>
                    )}
                  </button>
                )}
                {aiAnalysisError && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-6 max-w-lg mx-auto">
                    <p className="text-red-500 text-sm">{aiAnalysisError}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white">
              {isAiAnalysisLoading ? (
                <div className="text-center py-12">
                  <motion.div 
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                      scale: { repeat: Infinity, duration: 1.5 }
                    }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </motion.div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">AI分析を実行中...</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    あなたの作品データを分析中です。分析には数十秒かかる場合があります。完了するまでお待ちください。
                  </p>
                </div>
              ) : (
                <>
                  {/* 総合的な特徴セクション */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl">
                      <div className="flex items-center mb-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </span>
                        <h4 className="font-bold text-xl text-indigo-800">あなたの特徴: <span className="text-indigo-900">{overallStrength}</span></h4>
                      </div>
                      <p className="text-indigo-700 ml-10">{creatorTypeDescription}</p>
                    </div>
                  </div>
                  
                  {/* 3つの特性セクション */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">3つの重要な特性</h3>
                    <div className="grid grid-cols-1 gap-5">
                      {Object.values(features).map((feature, index) => {
                        const colors = [
                          { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-600', title: 'text-indigo-900' },
                          { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', icon: 'text-blue-600', title: 'text-blue-900' },
                          { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800', icon: 'text-purple-600', title: 'text-purple-900' }
                        ];
                        
                        return (
                          <motion.div 
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`${colors[index].bg} p-5 rounded-xl border ${colors[index].border} shadow-sm`}
                          >
                            <div className="flex items-start">
                              <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${colors[index].icon} mr-4 mt-1 shadow-sm flex-shrink-0`}>
                                {featureIcons[feature.id as keyof typeof featureIcons]}
                              </div>
                              <div>
                                <h5 className={`font-bold text-lg ${colors[index].title} mb-2`}>{feature.title}</h5>
                                <p className={`${colors[index].text}`}>
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 今後の可能性セクション */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                    <h4 className="flex items-center text-lg font-semibold text-green-800 mb-3">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      今後の発展と可能性
                    </h4>
                    <p className="text-green-700 leading-relaxed">{futurePotential}</p>
                  </div>
                </>
              )}
              
              {aiAnalysisError && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-6">
                  <p className="text-red-500 text-sm">{aiAnalysisError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AiAnalysisTab;