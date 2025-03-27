import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import TagForceGraph from './TagForceGraph';
import TagTimelineChart, { TagTimelineData } from './TagTimelineChart';
import { AlertCircle, BarChart2, BrainCircuit, TrendingUp } from 'lucide-react';

// タグ分析データの型定義
interface TagAnalytics {
  id: string;
  user_id: string;
  tag_trends: {
    tags: Array<{
      name: string;
      relevance: number;
      category?: string;
    }>;
    clusters: Array<{
      name: string;
      tags: string[];
      relevance: number;
    }>;
  };
  tag_clusters: {
    expertise: string[];
    style: string[];
    interests: string[];
  };
  tag_timeline: TagTimelineData[];
  created_at: string;
  updated_at: string;
}

interface CreatorAnalysisProps {
  userId: string;
}

export function CreatorAnalysis({ userId }: CreatorAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagAnalytics, setTagAnalytics] = useState<TagAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // タグ分析データを生成する関数をuseCallbackでメモ化
  const generateTagAnalytics = useCallback(async () => {
    try {
      // ユーザーの作品からタグを取得
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('id')
        .eq('user_id', userId);

      if (worksError) throw worksError;

      if (!worksData || worksData.length === 0) {
        setError('分析するための作品がありません。作品を追加してください。');
        setLoading(false);
        return;
      }

      // 作品IDの配列
      const workIds = worksData.map(work => work.id);

      // 作品に関連するタグを取得
      const { data: tagsData, error: tagsError } = await supabase
        .from('work_tags')
        .select('tags(name)')
        .in('work_id', workIds);

      if (tagsError) throw tagsError;

      // タグの出現回数をカウント
      const tagCounts: Record<string, number> = {};
      
      // tagsDataを安全に処理
      if (tagsData) {
        tagsData.forEach((item: unknown) => {
          // 型安全に処理するためにプロパティの存在を確認
          const tagItem = item as Record<string, unknown>;
          if (tagItem.tags) {
            if (Array.isArray(tagItem.tags)) {
              // tagsが配列の場合
              (tagItem.tags as Array<{ name: string }>).forEach(tag => {
                if (tag && tag.name) {
                  const tagName = tag.name;
                  tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                }
              });
            } else if (typeof tagItem.tags === 'object' && tagItem.tags !== null) {
              // tagsが単一オブジェクトの場合
              const tag = tagItem.tags as { name: string };
              if (tag.name) {
                const tagName = tag.name;
                tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
              }
            }
          }
        });
      }

      // タグを出現回数でソート
      const sortedTags = Object.entries(tagCounts)
        .map(([name, count]) => ({
          name,
          relevance: Math.min(100, Math.round((count / worksData.length) * 100))
        }))
        .sort((a, b) => b.relevance - a.relevance);

      // シンプルなクラスタリング（実際のプロジェクトではAI分析を使用）
      const clusters = [
        {
          name: '専門分野',
          tags: sortedTags.slice(0, 5).map(tag => tag.name),
          relevance: 100
        },
        {
          name: 'スタイル',
          tags: sortedTags.slice(5, 10).map(tag => tag.name),
          relevance: 80
        },
        {
          name: '興味・関心',
          tags: sortedTags.slice(10, 15).map(tag => tag.name),
          relevance: 60
        }
      ];

      // シンプルな時系列データ（実際のプロジェクトでは時間経過に基づく分析を使用）
      const timeline: TagTimelineData[] = [
        {
          period: '1ヶ月前',
          tags: sortedTags.slice(0, 8).map(tag => ({
            name: tag.name,
            count: Math.floor(tag.relevance * 0.7)
          }))
        },
        {
          period: '2週間前',
          tags: sortedTags.slice(0, 8).map(tag => ({
            name: tag.name,
            count: Math.floor(tag.relevance * 0.8)
          }))
        },
        {
          period: '1週間前',
          tags: sortedTags.slice(0, 8).map(tag => ({
            name: tag.name,
            count: Math.floor(tag.relevance * 0.9)
          }))
        },
        {
          period: '現在',
          tags: sortedTags.slice(0, 8).map(tag => ({
            name: tag.name,
            count: tag.relevance
          }))
        }
      ];

      // 分析データを作成（データベースに保存せず、ローカルで使用）
      const analyticsData: TagAnalytics = {
        id: 'local-' + Date.now(),
        user_id: userId,
        tag_trends: {
          tags: sortedTags.slice(0, 20),
          clusters
        },
        tag_clusters: {
          expertise: clusters[0].tags,
          style: clusters[1].tags,
          interests: clusters[2].tags
        },
        tag_timeline: timeline,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // データベースへの保存を試みず、直接ステートに設定
      setTagAnalytics(analyticsData);
    } catch (err) {
      console.error('タグ分析データの生成に失敗しました:', err);
      setError('タグ分析データの生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const fetchTagAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // タグ分析データを取得
        const { data, error: fetchError } = await supabase
          .from('tag_analytics')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // データが見つからない場合は分析データを生成
            await generateTagAnalytics();
            return;
          }
          throw fetchError;
        }

        setTagAnalytics(data);
      } catch (err) {
        console.error('タグ分析データの取得に失敗しました:', err);
        // エラーが発生した場合も分析データを生成
        await generateTagAnalytics();
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTagAnalytics();
    }
  }, [userId, generateTagAnalytics]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI分析結果</h2>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI分析結果</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tagAnalytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI分析結果</h2>
        </div>
        <p className="text-gray-600">
          分析データがありません。作品を追加すると自動的に分析が行われます。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BrainCircuit className="w-6 h-6 mr-2 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI分析結果</h2>
          </div>
          <span className="text-sm text-gray-500">
            最終更新: {new Date(tagAnalytics.updated_at).toLocaleDateString('ja-JP')}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`${
                activeTab === 'trends'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              タグトレンド
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`${
                activeTab === 'timeline'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              時系列分析
            </button>
          </nav>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="pb-2">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <BarChart2 className="w-4 h-4 mr-2 text-blue-600" />
                    専門分野
                  </h3>
                  <p className="text-sm text-gray-500">あなたの専門性を表すタグ</p>
                </div>
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {tagAnalytics.tag_clusters.expertise.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="pb-2">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <BarChart2 className="w-4 h-4 mr-2 text-purple-600" />
                    スタイル
                  </h3>
                  <p className="text-sm text-gray-500">あなたの表現スタイル</p>
                </div>
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {tagAnalytics.tag_clusters.style.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="pb-2">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <BarChart2 className="w-4 h-4 mr-2 text-green-600" />
                    興味・関心
                  </h3>
                  <p className="text-sm text-gray-500">あなたの興味を表すタグ</p>
                </div>
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {tagAnalytics.tag_clusters.interests.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                  タグ関連性マップ
                </h3>
                <p className="text-sm text-gray-500">
                  タグ間の関連性を視覚化したネットワーク図
                </p>
              </div>
              <div className="h-80 w-full">
                <TagForceGraph
                  tags={tagAnalytics.tag_trends.tags}
                  clusters={tagAnalytics.tag_trends.clusters}
                />
              </div>
            </div>
          </div>
        )}

        {/* タグトレンドタブ */}
        {activeTab === 'trends' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">タグトレンド分析</h3>
              <p className="text-sm text-gray-500">
                あなたの作品から抽出された主要なタグとその関連性
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tagAnalytics.tag_trends.tags.slice(0, 10).map((tag, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-1/3 text-sm text-gray-700">{tag.name}</span>
                    <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${tag.relevance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-80 w-full">
                <TagForceGraph
                  tags={tagAnalytics.tag_trends.tags}
                  clusters={tagAnalytics.tag_trends.clusters}
                />
              </div>
            </div>
          </div>
        )}

        {/* 時系列分析タブ */}
        {activeTab === 'timeline' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">タグの時系列変化</h3>
              <p className="text-sm text-gray-500">
                時間経過に伴うタグの変化傾向
              </p>
            </div>
            <div className="h-80 w-full">
              <TagTimelineChart timelineData={tagAnalytics.tag_timeline} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
