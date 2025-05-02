import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/hooks/useToast';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Save, 
  Twitter, 
  LogOut,
  User,
  Loader2
} from 'lucide-react';

// ユーザープロファイル情報の型定義
interface UserProfile {
  id: string;
  full_name: string;
  about: string;
  headline?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  connections?: number;
  created_at?: string;
  updated_at?: string;
  // 以下は既存のテーブルには存在しないが、UIでは表示する項目
  profile_image_url?: string;
  background_image_url?: string;
  website_url?: string;
}

// プロフィール更新データの型定義
interface ProfileUpdateData {
  full_name: string;
  about: string;
  headline?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  profile_image_url?: string;
  background_image_url?: string;
  website_url?: string;
  updated_at: string;
  [key: string]: string | string[] | number | boolean | null | undefined;
}

const defaultProfile: UserProfile = {
  id: '',
  full_name: '',
  about: '',
  headline: '',
  location: '',
  industry: '',
  skills: [],
  connections: 0,
  profile_image_url: '',
  background_image_url: '',
  website_url: '',
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  
  // 画像アップロード関連の状態
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  
  // プロフィール情報の取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error({ title: 'ユーザー情報の取得に失敗しました。再度ログインしてください。' });
          navigate('/login');
          return;
        }
        
        // プロフィール情報を取得
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('プロフィール取得エラー:', error);
          toast.error({ title: 'プロフィール情報の取得に失敗しました。' });
          return;
        }
        
        setProfile(data ? { ...defaultProfile, ...data } : defaultProfile);
        
        // プロフィール画像のプレビューを設定
        if (data && data.profile_image_url) {
          setImagePreview(data.profile_image_url);
        }
        
        // 背景画像のプレビューを設定
        if (data && data.background_image_url) {
          setBackgroundImagePreview(data.background_image_url);
        }
        
      } catch (error) {
        console.error('プロフィール取得中にエラーが発生しました:', error);
        toast.error({ title: 'プロフィール情報の取得に失敗しました。' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate, toast]);
  
  // フォーム入力の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  // プロフィール画像選択
  const handleImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // プロフィール画像変更
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: '画像サイズが大きすぎます。5MB以下の画像を選択してください。' });
      return;
    }
    
    try {
      setUploading(true);
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setImagePreview(target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // セッション確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('認証が必要です');
      }
      
      // ファイル名を一意にするために現在時刻とユーザーIDを使用
      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Supabaseストレージにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('画像アップロードエラー:', uploadError);
        
        // エラーの種類に応じたメッセージ
        if (uploadError.message && uploadError.message.includes('row-level security policy')) {
          throw new Error('セキュリティポリシーによりアップロードが拒否されました。正しいフォルダにアップロードしているか確認してください。');
        } else if (uploadError.message && uploadError.message.includes('Bucket not found')) {
          throw new Error('ストレージバケットが見つかりません。管理者に連絡してください。');
        } else if (
          // StorageErrorの型に合わせてエラーチェックを修正
          typeof uploadError === 'object' && 
          'message' in uploadError && 
          (
            uploadError.message.includes('Unauthorized') || 
            uploadError.message.includes('403')
          )
        ) {
          throw new Error('アクセス権限がありません。ログイン状態を確認してください。');
        } else {
          throw uploadError;
        }
      }
      
      // 公開URLを取得
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // プロフィール情報を更新
      setProfile(prev => ({
        ...prev,
        profile_image_url: urlData.publicUrl
      }));
      
      toast.success({ title: 'プロフィール画像をアップロードしました' });
      
    } catch (error: unknown) {
      console.error('画像アップロードエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      toast.error({ 
        title: '画像のアップロードに失敗しました', 
        description: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };
  
  // 背景画像変更
  const handleBackgroundImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: '画像サイズが大きすぎます。5MB以下の画像を選択してください。' });
      return;
    }
    
    try {
      setUploading(true);
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setBackgroundImagePreview(target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // セッション確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('認証が必要です');
      }
      
      const userId = session.user.id;
      
      // ファイル名を一意にするために現在時刻とユーザーIDを使用
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Supabaseストレージにアップロード
      const { error: uploadError } = await supabase.storage
        .from('backgrounds')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('背景画像アップロードエラー:', uploadError);
        
        // エラーの種類に応じたメッセージ
        if (uploadError.message && uploadError.message.includes('row-level security policy')) {
          throw new Error('セキュリティポリシーによりアップロードが拒否されました。正しいフォルダにアップロードしているか確認してください。');
        } else if (uploadError.message && uploadError.message.includes('Bucket not found')) {
          // バケットが存在しない場合は作成を試みる
          const { error: createBucketError } = await supabase.storage.createBucket('backgrounds', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5 * 1024 * 1024 // 5MB
          });
          
          if (createBucketError) {
            console.error('バケット作成エラー:', createBucketError);
            throw new Error('ストレージバケットの作成に失敗しました。管理者に連絡してください。');
          }
          
          // バケット作成後に再度アップロードを試みる
          const { error: retryError } = await supabase.storage
            .from('backgrounds')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (retryError) {
            console.error('再試行時の背景画像アップロードエラー:', retryError);
            throw retryError;
          }
        } else if (
          typeof uploadError === 'object' && 
          'message' in uploadError && 
          (
            uploadError.message.includes('Unauthorized') || 
            uploadError.message.includes('403')
          )
        ) {
          throw new Error('アクセス権限がありません。ログイン状態を確認してください。');
        } else {
          throw uploadError;
        }
      }
      
      // 公開URLを取得
      const { data: urlData } = await supabase.storage
        .from('backgrounds')
        .getPublicUrl(filePath);
      
      // プロフィール情報を更新
      setProfile(prev => ({
        ...prev,
        background_image_url: urlData.publicUrl
      }));
      
      toast.success({ title: '背景画像をアップロードしました' });
      
    } catch (error: unknown) {
      console.error('背景画像アップロードエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      toast.error({ 
        title: '背景画像のアップロードに失敗しました', 
        description: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };
  
  // プロフィール画像削除
  const handleRemoveImage = () => {
    setImagePreview(null);
    setProfile(prev => ({ ...prev, profile_image_url: '' }));
  };
  
  // 背景画像削除
  const handleRemoveBackgroundImage = () => {
    setBackgroundImagePreview(null);
    setProfile(prev => ({ ...prev, background_image_url: '' }));
  };
  
  // Twitter連携
  const handleTwitterConnect = async () => {
    toast({ title: 'Twitter連携機能は現在開発中です', description: '近日中に実装予定です' });
  };
  
  // プロフィール保存
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // バリデーション
      if (!profile.full_name.trim()) {
        toast.error({ title: '表示名を入力してください' });
        return;
      }
      
      // セッション確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('認証が必要です');
      }
      
      // プロフィールテーブルが存在するか確認
      try {
        // テーブル存在確認のためのクエリ
        const { error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (checkError && checkError.code === 'PGRST204') {
          // テーブルが存在しない場合、マイグレーションを実行するよう通知
          console.error('profilesテーブルが存在しません');
          toast.error({ 
            title: 'データベースエラー', 
            description: 'プロフィールテーブルが存在しません。管理者に連絡してください。' 
          });
          return;
        }
      } catch (checkError) {
        console.error('テーブル確認エラー:', checkError);
        // エラーが発生しても処理を続行
      }
      
      // プロフィール情報を更新（既存のカラムのみ）
      const updateData: ProfileUpdateData = {
        full_name: profile.full_name,
        about: profile.about || '',
        headline: profile.headline || '',
        location: profile.location || '',
        industry: profile.industry || '',
        skills: profile.skills || [],
        updated_at: new Date().toISOString()
      };
      
      // profile_image_url、background_image_url、website_urlが存在する場合のみ追加
      if (profile.profile_image_url) {
        updateData.profile_image_url = profile.profile_image_url;
      }
      
      if (profile.background_image_url) {
        updateData.background_image_url = profile.background_image_url;
      }
      
      if (profile.website_url) {
        updateData.website_url = profile.website_url;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);
      
      if (error) {
        console.error('プロフィール保存エラー:', error);
        
        // カラムが存在しない場合のエラー処理
        if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
          const missingColumn = error.message.match(/column "([^"]+)" does not exist/)?.[1] || 
                               error.message.match(/Could not find the '([^']+)' column/)?.[1];
          
          if (missingColumn) {
            console.warn(`カラムが存在しません: ${missingColumn}、このフィールドを除外して再試行します`);
            // エラーメッセージからカラム名を取得して削除
            delete updateData[missingColumn];
            
            // 再度保存を試みる
            const { error: retryError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', profile.id);
            
            if (retryError) {
              throw retryError;
            } else {
              toast.success({ 
                title: 'プロフィールを保存しました', 
                description: `注意: ${missingColumn}フィールドは保存されませんでした` 
              });
              
              // ローカルストレージのプロフィール情報を更新
              try {
                const storedProfile = localStorage.getItem('userProfile');
                if (storedProfile) {
                  const parsedProfile = JSON.parse(storedProfile);
                  const updatedProfile = { ...parsedProfile, ...updateData };
                  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                }
              } catch (storageError) {
                console.error('ローカルストレージ更新エラー:', storageError);
              }
              
              navigate('/portfolio');
              return;
            }
          }
        }
        
        throw error;
      }
      
      // ローカルストレージのプロフィール情報を更新
      try {
        // 更新されたプロフィール情報をローカルストレージに保存
        localStorage.setItem('userProfile', JSON.stringify({
          ...profile,
          ...updateData,
          // 互換性のためにfull_nameをnameとしても設定
          name: profile.full_name
        }));
        
        // プロフィール更新イベントを発行（他のコンポーネントが検知できるように）
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: {
            profile: {
              ...profile,
              ...updateData,
              // 表示名をname属性としても追加（Mypageコンポーネントの互換性のため）
              name: profile.full_name
            }
          }
        }));
        
        // 追加: プロフィール保存完了イベントを発行
        window.dispatchEvent(new CustomEvent('profile-save-complete', {
          detail: {
            timestamp: new Date().getTime(),
            profile: {
              ...profile,
              ...updateData,
              name: profile.full_name
            }
          }
        }));
        
        console.log('Profile saved to localStorage and events dispatched', {
          full_name: profile.full_name,
          name: profile.full_name
        });
      } catch (storageError) {
        console.error('ローカルストレージ更新エラー:', storageError);
      }
      
      toast.success({ title: 'プロフィールを保存しました' });
      
      // ポートフォリオページに戻る
      navigate('/portfolio');
      
    } catch (error: unknown) {
      console.error('プロフィール保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      toast.error({ 
        title: 'プロフィールの保存に失敗しました', 
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };
  
  // ログアウト処理
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success({ title: 'ログアウトしました' });
      navigate('/');
      
    } catch (error) {
      console.error('ログアウトエラー:', error);
      toast.error({ title: 'ログアウトに失敗しました' });
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">プロフィール情報を読み込んでいます...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <Button variant="text" onClick={() => navigate('/portfolio')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ポートフォリオページに戻る
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">プロフィール編集</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          {/* プロフィール画像アップロード */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">プロフィール画像</h2>
            
            <div className="flex items-center">
              <div className="relative">
                {imagePreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                    <img 
                      src={imagePreview} 
                      alt="プロフィール画像" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md"
                      aria-label="画像を削除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="ml-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  onClick={handleImageSelect}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      画像をアップロード
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500">
                  推奨: 正方形、500x500px以上、5MB以下
                </p>
              </div>
            </div>
          </div>
          
          {/* 背景画像アップロード */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">背景画像</h2>
            
            <div className="flex items-center">
              <div className="relative">
                {backgroundImagePreview ? (
                  <div className="w-64 h-36 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={backgroundImagePreview} 
                      alt="背景画像" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveBackgroundImage}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md"
                      aria-label="画像を削除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-64 h-36 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Upload className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="ml-6">
                <input
                  type="file"
                  ref={backgroundFileInputRef}
                  accept="image/*"
                  onChange={handleBackgroundImageChange}
                  className="hidden"
                />
                <Button
                  onClick={() => backgroundFileInputRef.current?.click()}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      画像をアップロード
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500">
                  推奨: 正方形、500x500px以上、5MB以下
                </p>
              </div>
            </div>
          </div>
          
          {/* 基本情報フォーム */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <FormInput
                  id="full_name"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="表示名"
                  required
                  label="表示名 *"
                />
              </div>
              
              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={profile.about ?? ''}
                  onChange={handleChange}
                  placeholder="あなたについて簡単に紹介してください"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <FormInput
                  id="headline"
                  name="headline"
                  value={profile.headline ?? ''}
                  onChange={handleChange}
                  placeholder="肩書き"
                  label="肩書き"
                />
              </div>
              
              <div>
                <FormInput
                  id="location"
                  name="location"
                  value={profile.location ?? ''}
                  onChange={handleChange}
                  placeholder="所在地"
                  label="所在地"
                />
              </div>
              
              <div>
                <FormInput
                  id="skills"
                  name="skills"
                  value={profile.skills?.join(', ') || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const skills = e.target.value.split(',').map((skill: string) => skill.trim()).filter(Boolean);
                    setProfile(prev => ({ ...prev, skills }));
                  }}
                  placeholder="スキル（カンマ区切りで入力）"
                  label="スキル"
                />
              </div>
              
              <div>
                <FormInput
                  id="website_url"
                  name="website_url"
                  value={profile.website_url ?? ''}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  type="url"
                  label="ウェブサイトURL"
                />
              </div>
            </div>
          </div>
          
          {/* SNS連携セクション */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">SNS連携</h2>
            
            <div className="space-y-4">
              <div>
                <Button
                  onClick={handleTwitterConnect}
                  variant="secondary"
                  className="flex items-center"
                >
                  <Twitter className="w-5 h-5 mr-2 text-blue-400" />
                  Twitterと連携する
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Twitter連携すると、フォロワーにあなたの新しい作品を通知できます
                </p>
              </div>
            </div>
          </div>

          
          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="mb-4 sm:mb-0 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  変更を保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
