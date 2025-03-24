import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Edit, 
  PlusCircle, 
  FileText, 
  Award, 
  Star, 
  Palette, 
  Zap, 
  Loader2,
  AlertCircle,
  Share2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { analyzeUserTags as analyzeUserTagsApi } from '../api/tag-analysis-api'; // タグ分析APIをインポート

// ユーザープロファイルの型定義
interface UserProfile {
  id: string;
  full_name: string;  // nameからfull_nameに変更
  about: string;      // bioからaboutに変更
  headline?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  website_url: string | null;
  profile_image_url: string | null;
  background_image_url: string | null;
  twitter_username: string | null;
  instagram_username: string | null;
  facebook_username: string | null;
  email: string | null;
}

// 作品の型定義
interface Work {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags: string[];
}

// 職歴の型定義
interface Career {
  id: string;
  user_id: string;
  company: string;
  position: string;
  department: string;
  start_date: string;
  end_date: string | null;
  is_current_position: boolean;
  created_at: string;
}

// AI分析結果の型定義
interface AIAnalysisResult {
  expertise: {
    summary: string; // 専門性
  };
  content_style: {
    summary: string; // コンテンツスタイル
  };
  uniqueness: {
    summary: string; // 作品のユニークさ
  };
  specialties: string[];
  interests: {
    topics: string[];
  };
  tagFrequency?: Record<string, number>; // タグの出現頻度を追加
  clusters?: Array<{
    label?: string;
    tags: string[];
  }>; // タグクラスターを追加
}

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const Mypage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [careers, setCareers] = useState<Career[]>([]);
  const [showCareerDialog, setShowCareerDialog] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalWorks: 0,
    monthlyWorks: Array(12).fill(0),
  });
  const [showShareUrl, setShowShareUrl] = useState(false);

  // URLシェアダイアログを表示する関数
  const toggleShareDialog = () => {
    setShowShareUrl(!showShareUrl);
  };

  // ユーザープロファイルを取得する関数
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // セッションを取得
      const { data: { session } } = await supabase.auth.getSession();
      
      // 開発環境用に一時的に認証チェックをバイパス
      // 注意: 本番環境では必ずこのコメントを外し、認証チェックを有効にすること
      /*
      if (!session) {
        // セッションがない場合はログインページにリダイレクト
        window.location.href = '/login';
        return;
      }
      */
      
      // 開発用のモックセッション（本番環境では削除すること）
      const mockUserId = '12345-dev-user-id';
      const userId = session?.user?.id || mockUserId;
      
      // Supabaseからユーザープロファイルを取得
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user profile:', userError);
        
        // エラー時にローカルストレージからのフォールバック
        const storedUser = localStorage.getItem('userProfile');
        if (storedUser) {
          console.log('Using cached profile from localStorage');
          setUserProfile(JSON.parse(storedUser));
        }
        
        return;
      }
      
      if (userData) {
        console.log('Profile data fetched successfully:', userData);
        // ユーザープロファイルをステートとローカルストレージに保存
        setUserProfile(userData);
        localStorage.setItem('userProfile', JSON.stringify(userData));
      }
      
      // 作品データを取得
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*, work_tags(tag_id, tags(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (worksError) {
        console.error('Error fetching works:', worksError);
        return;
      }
      
      console.log('Raw works data:', JSON.stringify(worksData, null, 2));
      
      // タグ情報を整形
      const worksWithTags = worksData.map((work: { work_tags?: { tags?: { name: string } }[] } & Omit<Work, 'tags'>) => {
        const tags = work.work_tags
          ? work.work_tags
              .filter((wt) => wt.tags)
              .map((wt) => wt.tags!.name)
          : [];
        
        // デバッグ情報：作品の全フィールドを出力
        console.log(`Work ID: ${work.id}, Full data:`, JSON.stringify(work, null, 2));
        
        // 画像URLの処理
        let imageUrl = work.thumbnail_url;
        
        // デバッグ情報
        console.log(`Work ID: ${work.id}, Original thumbnail_url: ${imageUrl}`);
        
        // 画像URLが存在する場合の処理
        if (imageUrl) {
          // URLが既に完全なURLの場合はそのまま使用
          if (imageUrl.startsWith('http')) {
            console.log(`Using original URL: ${imageUrl}`);
          } 
          // Supabaseストレージのパスの場合
          else {
            try {
              // パスから先頭のスラッシュを削除（存在する場合）
              const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
              
              // Supabase Storage APIを使用して公開URLを取得
              // まず 'thumbnails' バケットを試す
              const { data: thumbnailData } = supabase.storage
                .from('thumbnails')
                .getPublicUrl(cleanPath);
              
              if (thumbnailData && thumbnailData.publicUrl) {
                imageUrl = thumbnailData.publicUrl;
                console.log(`Generated public URL from thumbnails bucket: ${imageUrl}`);
              } else {
                // 'thumbnails' バケットで見つからない場合は 'works' バケットを試す
                const { data: worksData } = supabase.storage
                  .from('works')
                  .getPublicUrl(cleanPath);
                
                if (worksData && worksData.publicUrl) {
                  imageUrl = worksData.publicUrl;
                  console.log(`Generated public URL from works bucket: ${imageUrl}`);
                } else {
                  // どちらのバケットでも見つからない場合はプレースホルダー画像を使用
                  console.warn(`Could not generate public URL for path: ${cleanPath}`);
                  imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                }
              }
              
              // 生成されたURLの検証
              fetch(imageUrl, { method: 'HEAD' })
                .then(response => {
                  if (response.ok) {
                    console.log(`Image URL validation successful: ${imageUrl}`);
                  } else {
                    console.warn(`Image URL validation failed: ${response.status} ${response.statusText}`);
                    // 検証に失敗した場合はプレースホルダー画像を使用
                    document.querySelectorAll(`img[src="${imageUrl}"]`).forEach(img => {
                      (img as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                    });
                  }
                })
                .catch(error => {
                  console.error(`Image URL validation error: ${error}`);
                });
            } catch (error) {
              console.error(`Error generating URL for ${imageUrl}:`, error);
              // エラー時はデータURIのSVGプレースホルダー画像を使用
              imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
            }
          }
        } else {
          // 画像URLがない場合はデータURIのSVGプレースホルダーを設定
          imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
          console.log('No image URL, using placeholder');
        }
        
        return {
          ...work,
          tags,
          thumbnail_url: imageUrl,
          work_tags: undefined
        };
      });
      
      console.log('Processed works with images:', JSON.stringify(worksWithTags.map(w => ({
        id: w.id,
        title: w.title,
        thumbnail_url: w.thumbnail_url
      })), null, 2));
      
      setWorks(worksWithTags as Work[]);
      
      // 月間投稿統計を計算
      const monthlyStats = Array(12).fill(0);
      worksWithTags.forEach((work: Work) => {
        const date = new Date(work.created_at);
        const month = date.getMonth();
        monthlyStats[month]++;
      });
      
      setStats({
        totalWorks: worksWithTags.length,
        monthlyWorks: monthlyStats
      });
      
      // 職歴データを取得
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      
      if (careersError) {
        console.error('Error fetching careers:', careersError);
        return;
      }
      
      setCareers(careersData || []);
      
      // AI分析結果を取得
      const { data: insightData, error: insightError } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (insightError && insightError.code !== 'PGRST116') {
        console.error('Error fetching AI insights:', insightError);
      }
      
      if (insightData) {
        setAiAnalysisResult({
          expertise: {
            summary: insightData.expertise?.summary || ''
          },
          content_style: {
            summary: insightData.content_style?.summary || ''
          },
          uniqueness: {
            summary: insightData.uniqueness?.summary || ''
          },
          specialties: insightData.specialties || [],
          interests: {
            topics: insightData.interests?.topics || []
          },
          tagFrequency: insightData.tagFrequency, // タグの出現頻度を追加
          clusters: insightData.clusters || [] // タグクラスターを追加
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setIsLoading(false);
    }
  }, []);

  // ユーザーのAI分析結果を取得
  const fetchUserInsights = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const { data: insightData, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();
      
      if (error) {
        console.error('Error fetching user insights:', error);
        return;
      }
      
      if (insightData) {
        setAiAnalysisResult({
          expertise: {
            summary: insightData.expertise?.summary || ''
          },
          content_style: {
            summary: insightData.content_style?.summary || ''
          },
          uniqueness: {
            summary: insightData.uniqueness?.summary || ''
          },
          specialties: insightData.specialties || [],
          interests: {
            topics: insightData.interests?.topics || []
          },
          tagFrequency: insightData.tagFrequency,
          clusters: insightData.clusters || []
        });
      }
      
    } catch (error) {
      console.error('Error in fetchUserInsights:', error);
    }
  }, [userProfile]);

  // ユーザーのタグを分析
  const analyzeUserTagsLocal = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      setIsAnalyzing(true);
      
      // タグの出現頻度を計算
      const tagFrequency: Record<string, number> = {};
      works.forEach(work => {
        if (work.tags) {
          work.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }
      });
      
      // タグ分析APIを呼び出し
      const result = await analyzeUserTagsApi(userProfile.id);
      
      if (!result.success) {
        console.error('Failed to analyze user tags:', result.error);
        toast({
          title: 'タグ分析に失敗しました',
          description: result.error || '不明なエラーが発生しました',
          variant: 'destructive'
        });
        setIsAnalyzing(false);
        return;
      }
      
      // 分析結果をステートに保存
      setAiAnalysisResult({
        expertise: {
          summary: result.data?.expertise?.summary || ''
        },
        content_style: {
          summary: result.data?.content_style?.summary || ''
        },
        uniqueness: {
          summary: result.data?.uniqueness?.summary || ''
        },
        specialties: result.data?.specialties || [],
        interests: {
          topics: result.data?.interests?.topics || []
        },
        tagFrequency: tagFrequency,
        clusters: result.data?.clusters || []
      });
      
      // 分析結果をデータベースに保存
      try {
        const { error } = await supabase
          .from('user_insights')
          .upsert({
            user_id: userProfile.id,
            expertise: result.data?.expertise,
            talent: result.data?.content_style, // content_styleをtalentカラムに保存
            uniqueness: result.data?.uniqueness,
            specialties: result.data?.specialties,
            interests: result.data?.interests,
            design_styles: [], // 空の配列を設定
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error saving user insights:', error);
        }
      } catch (saveError) {
        console.error('Error in saving user insights:', saveError);
      }
      
      toast({
        title: 'タグ分析が完了しました',
        description: '分析結果が更新されました',
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Error in analyzeUserTagsLocal:', error);
      toast({
        title: 'タグ分析中にエラーが発生しました',
        description: '時間をおいて再度お試しください',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [userProfile, works, setIsAnalyzing, setAiAnalysisResult]);

  // ユーザーの作品一覧を取得する関数
  const fetchUserWorks = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*, work_tags(tag_id, tags(name))')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (worksError) {
        console.error('Error fetching works:', worksError);
        return;
      }
      
      // タグ情報を整形
      const worksWithTags = worksData.map((work: { work_tags?: { tags?: { name: string } }[] } & Omit<Work, 'tags'>) => {
        const tags = work.work_tags
          ? work.work_tags
              .filter((wt) => wt.tags)
              .map((wt) => wt.tags!.name)
          : [];
        
        // 画像URLの処理
        let imageUrl = work.thumbnail_url;
        
        if (imageUrl) {
          // URLが既に完全なURLの場合はそのまま使用
          if (imageUrl.startsWith('http')) {
            // そのまま使用
          } 
          // Supabaseストレージのパスの場合
          else {
            try {
              // パスから先頭のスラッシュを削除（存在する場合）
              const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
              
              // Supabase Storage APIを使用して公開URLを取得
              const { data: thumbnailData } = supabase.storage
                .from('thumbnails')
                .getPublicUrl(cleanPath);
              
              if (thumbnailData && thumbnailData.publicUrl) {
                imageUrl = thumbnailData.publicUrl;
              } else {
                // 'thumbnails' バケットで見つからない場合は 'works' バケットを試す
                const { data: worksData } = supabase.storage
                  .from('works')
                  .getPublicUrl(cleanPath);
                
                if (worksData && worksData.publicUrl) {
                  imageUrl = worksData.publicUrl;
                } else {
                  // どちらのバケットでも見つからない場合はプレースホルダー画像を使用
                  imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                }
              }
            } catch (error) {
              console.error(`Error generating URL for ${imageUrl}:`, error);
              // エラー時はデータURIのSVGプレースホルダー画像を使用
              imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
            }
          }
        } else {
          // 画像URLがない場合はデータURIのSVGプレースホルダーを設定
          imageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
          console.log('No image URL, using placeholder');
        }
        
        return {
          ...work,
          tags,
          thumbnail_url: imageUrl,
          work_tags: undefined
        };
      });
      
      setWorks(worksWithTags as Work[]);
      
      // 月間投稿統計を計算
      const monthlyStats = Array(12).fill(0);
      worksWithTags.forEach((work: Work) => {
        const date = new Date(work.created_at);
        const month = date.getMonth();
        monthlyStats[month]++;
      });
      
      setStats({
        totalWorks: worksWithTags.length,
        monthlyWorks: monthlyStats
      });
      
    } catch (error) {
      console.error('Error in fetchUserWorks:', error);
    }
  }, [userProfile]);

  // ユーザーの職歴を取得する関数
  const fetchUserCareers = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('start_date', { ascending: false });
      
      if (careersError) {
        console.error('Error fetching careers:', careersError);
        return;
      }
      
      setCareers(careersData || []);
      
    } catch (error) {
      console.error('Error in fetchUserCareers:', error);
    }
  }, [userProfile]);

  // 初回レンダリング時にユーザープロファイルを取得
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // ユーザープロファイルが取得できたら作品一覧と職歴を取得
  useEffect(() => {
    if (userProfile) {
      fetchUserWorks();
      fetchUserCareers();
      fetchUserInsights(); // AI分析結果を取得
    }
  }, [userProfile, fetchUserInsights, fetchUserWorks, fetchUserCareers]);

  // プロフィール更新イベントのリスナーを設定
  useEffect(() => {
    // プロフィール更新イベントのハンドラー
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received:', event.detail);
      if (event.detail && event.detail.profile) {
        setUserProfile(event.detail.profile);
      }
    };

    // イベントリスナーを追加
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, []);

  // AIによるタグ分析を実行
  const runAIAnalysis = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      setIsAnalyzing(true);
      
      // 既存のタグ分析ロジックを実行
      await analyzeUserTagsLocal();
      
    } catch (error) {
      console.error('Error running AI analysis:', error);
      setIsAnalyzing(false);
    }
  }, [userProfile, analyzeUserTagsLocal]);

  // キャリア編集ダイアログを開く関数
  const openCareerEditDialog = useCallback((career?: Career) => {
    if (career) {
      setEditingCareer(career);
      setCompanyName(career.company);
      setPosition(career.position);
      setDepartment(career.department || '');
      setStartDate(career.start_date);
      setIsCurrentJob(career.is_current_position);
      if (!career.is_current_position && career.end_date) {
        setEndDate(career.end_date);
      } else {
        setEndDate('');
      }
    } else {
      setEditingCareer(null);
      setCompanyName('');
      setPosition('');
      setDepartment('');
      setStartDate('');
      setEndDate('');
      setIsCurrentJob(false);
    }
    setShowCareerDialog(true);
  }, []);

  // キャリア情報を保存する関数
  const saveCareer = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 開発用のモックセッション（本番環境では削除すること）
      const mockUserId = '12345-dev-user-id';
      const userId = session?.user?.id || mockUserId;
      
      if (!session && process.env.NODE_ENV === 'production') {
        console.error('ユーザーセッションがありません');
        return;
      }
      
      // UUIDを生成する関数
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newCareer: Career = {
        id: editingCareer?.id || generateUUID(),
        user_id: userId,
        company: companyName,
        position,
        department,
        start_date: startDate,
        end_date: isCurrentJob ? null : endDate,
        is_current_position: isCurrentJob,
        created_at: new Date().toISOString()
      };

      if (editingCareer) {
        // 既存のキャリアを更新
        const { error } = await supabase
          .from('careers')
          .update(newCareer)
          .eq('id', editingCareer.id);
          
        if (error) {
          console.error('キャリア更新エラー:', error);
          return;
        }
        
        // ローカルステートを更新
        const updatedCareers = careers.map(c => 
          c.id === editingCareer.id ? newCareer : c
        );
        setCareers(updatedCareers);
      } else {
        // 新しいキャリアを追加
        const { error } = await supabase
          .from('careers')
          .insert([newCareer]);
          
        if (error) {
          console.error('キャリア追加エラー:', error);
          return;
        }
        
        // ローカルステートを更新
        setCareers([...careers, newCareer]);
      }

      setShowCareerDialog(false);
    } catch (error) {
      console.error('キャリア保存エラー:', error);
    }
  };

  // フォーム入力ハンドラ
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(e.target.value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepartment(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleIsCurrentJobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCurrentJob(e.target.checked);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ローディング表示 */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="mt-2 text-lg font-medium text-gray-700">読み込み中...</p>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16 items-center px-4">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-xl font-bold text-indigo-600">Balubo</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/works/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                作品を追加
              </a>
              <a
                href="/profile/edit"
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Edit className="mr-2 h-4 w-4" />
                設定
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* プロフィールバナーセクション */}
      <div className="w-full bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          {/* カバー画像エリア */}
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            {userProfile?.background_image_url && (
              <img 
                className="h-full w-full object-cover"
                src={userProfile.background_image_url} 
                alt="背景画像"
              />
            )}
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* プロフィール画像 */}
            <div className="absolute -top-16 left-6 border-4 border-white rounded-full overflow-hidden shadow-lg"
                 style={{ width: '8rem', height: '8rem' }}>
              <img
                src={userProfile?.profile_image_url || "https://randomuser.me/api/portraits/men/32.jpg"}
                alt="プロフィール画像"
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* ユーザー情報 */}
            <div className="ml-36 pt-2 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-component-name="Mypage">{userProfile?.full_name || "ユーザー名"}</h1>
                <p className="text-gray-500 max-w-2xl" data-component-name="Mypage">{userProfile?.about || "自己紹介文がありません"}</p>
                
                {/* SNSリンク */}
                <div className="mt-3 flex space-x-3">
                  {userProfile?.twitter_username && (
                    <a
                      href={`https://twitter.com/${userProfile.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8v-9H6V5h9v-1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.instagram_username && (
                    <a
                      href={`https://instagram.com/${userProfile.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.facebook_username && (
                    <a
                      href={`https://facebook.com/${userProfile.facebook_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </a>
                  )}
                  {userProfile?.website_url && (
                    <a
                      href={userProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-green-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.35 15.5c-3.51 0-6.35-2.84-6.35-6.35S8.14 4.8 11.65 4.8s6.35 2.84 6.35 6.35-2.84 6.35-6.35 6.35zm0-13c-3.31 0-6 1.79-6 4s1.79 4 4 4 6-1.79 6-4-1.79-4-4-4z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              
              {/* プロフィール編集ボタンとシェアボタン */}
              <div className="flex space-x-2">
                {/* シェアボタン */}
                <button
                  onClick={toggleShareDialog}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="プロフィールをシェア"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  シェア
                </button>
                
                {/* プロフィール編集ボタン */}
                <a 
                  href="/profile/edit" 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  プロフィール編集
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 月間投稿グラフ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold">アクティビティ</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MONTHS.map((month, index) => {
                  return {
                    name: month,
                    投稿数: stats.monthlyWorks[index] || 0,
                  };
                })}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="投稿数"
                  stroke="#3B82F6"
                  fill="#93C5FD"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 職歴セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">職歴</h2>
            <button 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => openCareerEditDialog()}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              追加
            </button>
          </div>
          <div className="space-y-6">
            {careers.map((career) => (
              <div key={career.id} className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-3 before:bg-indigo-500 before:rounded-full before:z-10">
                <div className="absolute left-[5.5px] top-5 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{career.company}</h3>
                    <p className="text-gray-700">{career.position} {career.department && `/ ${career.department}`}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {career.start_date} - {career.is_current_position ? '現在' : career.end_date}
                    </p>
                  </div>
                  <button 
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => openCareerEditDialog(career)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    編集
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI分析セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">あなたの才能分析</h2>
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              onClick={runAIAnalysis}
              disabled={isAnalyzing || works.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  分析実行
                </>
              )}
            </button>
          </div>

          {aiAnalysisResult ? (
            <div className="space-y-6">
              {/* 作品タグの分析概要 */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-indigo-600 mt-1 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-800">タグ分析サマリー</h3>
                    <p className="text-gray-700 mb-2">
                      あなたの作品から抽出した{Object.keys(aiAnalysisResult.tagFrequency || {}).length}個のタグを分析しました。
                      頻出するキーワードから、あなたの専門性と強みを可視化しています。
                    </p>
                    
                    {/* タグクラウド */}
                    {aiAnalysisResult.tagFrequency && Object.keys(aiAnalysisResult.tagFrequency).length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(aiAnalysisResult.tagFrequency)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 15) // 上位15個のタグを表示
                            .map(([tagName, count], index) => {
                              // 出現頻度に応じてフォントサイズと色を調整
                              const fontSize = Math.min(14 + count * 2, 24); // 最小14px、最大24px
                              const colorIndex = Math.min(Math.floor(count), 5); // 0-5の範囲
                              const colors = [
                                'bg-gray-100 text-gray-700',
                                'bg-blue-100 text-blue-700',
                                'bg-indigo-100 text-indigo-700',
                                'bg-purple-100 text-purple-700',
                                'bg-violet-100 text-violet-700',
                                'bg-fuchsia-100 text-fuchsia-700'
                              ];
                              
                              return (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${colors[colorIndex]}`}
                                  style={{ fontSize: `${fontSize}px` }}
                                >
                                  {tagName}
                                  {count > 1 && <span className="ml-1 text-xs opacity-70">×{count}</span>}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <Award className="h-6 w-6 text-gray-600 mt-1 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-800">専門性</h3>
                    <p className="text-gray-700">{aiAnalysisResult.expertise.summary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <Star className="h-6 w-6 text-gray-600 mt-1 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-800">コンテンツスタイル</h3>
                    <p className="text-gray-700">{aiAnalysisResult.content_style.summary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <Palette className="h-6 w-6 text-gray-600 mt-1 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-800">作品のユニークさ</h3>
                    <p className="text-gray-700">{aiAnalysisResult.uniqueness.summary}</p>
                  </div>
                </div>
              </div>

              {/* スキル・専門領域（タグ） */}
              {aiAnalysisResult.specialties && aiAnalysisResult.specialties.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-2">スキル・専門領域（タグ）</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysisResult.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}


              {/* 興味関心タグ */}
              {aiAnalysisResult.interests && aiAnalysisResult.interests.topics && aiAnalysisResult.interests.topics.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-2">関心トピック分析</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysisResult.interests.topics.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">分析データがありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  作品を追加して「分析実行」ボタンをクリックすると、客観的な作品分析が行われます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 作品一覧セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">作品一覧</h2>
            <a
              href="/works/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              作品を追加
            </a>
          </div>

          {works.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <a href={`/works/${work.id}`} key={work.id} className="group">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="relative pb-[56.25%] bg-gray-100"> 
                      {work.thumbnail_url ? (
                        <img
                          src={work.thumbnail_url}
                          alt={work.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // 画像読み込みエラー時のフォールバック
                            console.error(`Image load error for ${work.title}:`, e.target);
                            console.error(`Failed URL: ${work.thumbnail_url}`);
                            e.currentTarget.onerror = null;
                            // インラインSVGプレースホルダー画像を設定
                            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22640%22%20height%3D%22360%22%20viewBox%3D%220%200%20640%20360%22%3E%3Cg%20fill%3D%22%23ddd%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22180%22%20style%3D%22fill%3A%23aaa%3Bfont-weight%3Abold%3Bfont-size%3A32px%3Bfont-family%3AArial%2Csans-serif%3Btext-anchor%3Amiddle%3Bdominant-baseline%3Amiddle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                          }}
                          onLoad={() => {
                            // 画像読み込み成功時のログ
                            console.log(`Image loaded successfully for ${work.title}: ${work.thumbnail_url}`);
                          }}
                        />
                      ) : (
                        // 画像がない場合のプレースホルダー
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
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">No Image</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                        {work.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {work.description}
                      </p>
                      {work.tags && work.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {work.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {work.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{work.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <span>
                          {new Date(work.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <FileText className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">作品がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  「作品を追加」ボタンをクリックして、最初の作品を追加しましょう。
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* URLシェアダイアログ */}
      {showShareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">プロフィールをシェア</h3>
              <button 
                onClick={toggleShareDialog}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-2">以下のURLをコピーしてシェアできます：</p>
            <div className="flex">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  const input = document.querySelector('input[type="text"][value="' + window.location.href + '"]') as HTMLInputElement;
                  if (input) {
                    input.select();
                    document.execCommand('copy');
                    alert('URLをコピーしました');
                  }
                }}
              >
                選択
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={toggleShareDialog}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャリア編集ダイアログ */}
      {showCareerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCareer ? 'キャリア情報を編集' : '新しいキャリアを追加'}
              </h3>
              <button
                onClick={() => setShowCareerDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); saveCareer(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名 *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={handleCompanyNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    役職 *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={handlePositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={handleDepartmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日 *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isCurrentJob"
                    checked={isCurrentJob}
                    onChange={handleIsCurrentJobChange}
                    className="mr-2"
                  />
                  <label htmlFor="isCurrentJob" className="text-sm font-medium text-gray-700">
                    現在の職場
                  </label>
                </div>
                {!isCurrentJob && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      終了日
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCareerDialog(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    保存
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mypage;