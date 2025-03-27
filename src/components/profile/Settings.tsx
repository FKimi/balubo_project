import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, handleSupabaseError } from '../../lib/supabase';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useToast } from '../../lib/hooks/useToast';

type UserProfile = {
  id: string;
  name: string;
  bio: string;
  website_url: string;
  profile_image_url: string;
  background_image_url: string;
  twitter_username: string;
  instagram_username: string;
  facebook_username: string;
};

export function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserProfile>({
    id: '',
    name: '',
    bio: '',
    website_url: '',
    profile_image_url: '',
    background_image_url: '',
    twitter_username: '',
    instagram_username: '',
    facebook_username: '',
  });
  // 画像アップロード関連の状態
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);

  // 背景画像ハンドリング用のカスタムフック
  const useBackgroundImage = () => {
    // LocalStorageから背景画像を取得
    const getFromLocalStorage = (): string | null => {
      try {
        return localStorage.getItem('background_image_url');
      } catch (error) {
        console.error('背景画像のローカルストレージ取得エラー:', error);
        return null;
      }
    };

    // LocalStorageに背景画像を保存
    const saveToLocalStorage = (imageUrl: string) => {
      try {
        localStorage.setItem('background_image_url', imageUrl);
      } catch (error) {
        console.error('背景画像のローカルストレージ保存エラー:', error);
      }
    };

    // LocalStorageから背景画像を削除
    const removeFromLocalStorage = () => {
      try {
        localStorage.removeItem('background_image_url');
      } catch (error) {
        console.error('背景画像のローカルストレージ削除エラー:', error);
      }
    };

    return {
      getFromLocalStorage,
      saveToLocalStorage,
      removeFromLocalStorage
    };
  };

  // 背景画像ハンドリング関数を取得
  const { getFromLocalStorage: getBackgroundImageFromLocalStorage, 
          saveToLocalStorage: saveBackgroundImageToLocalStorage,
          removeFromLocalStorage: removeBackgroundImageFromLocalStorage } = useBackgroundImage();

  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // ユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('ユーザー情報を取得できませんでした');
        }

        // プロフィール情報を取得（エラーハンドリングを強化）
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('プロフィール取得エラー:', error);
            
            // プロフィールが存在しない場合は新規作成
            if (error.code === 'PGRST116') {
              try {
                await supabase.from('profiles').insert([{ id: user.id, name: '' }]);
                
                // 新規作成したプロフィールを設定
                setForm({
                  id: user.id,
                  name: '',
                  bio: '',
                  website_url: '',
                  profile_image_url: '',
                  background_image_url: '',
                  twitter_username: '',
                  instagram_username: '',
                  facebook_username: '',
                });
              } catch (createError) {
                console.error('プロフィール作成エラー:', createError);
                // エラーをスローするのではなく、空のプロフィールを設定
                setForm({
                  id: user.id,
                  name: '',
                  bio: '',
                  website_url: '',
                  profile_image_url: '',
                  background_image_url: '',
                  twitter_username: '',
                  instagram_username: '',
                  facebook_username: '',
                });
              }
            } else {
              throw new Error(`プロフィール取得エラー: ${error.message}`);
            }
          } else if (!data) {
            // データが存在しない場合（errorはないがdataもない場合）
            console.error('プロフィールデータが存在しません');
            
            try {
              await supabase.from('profiles').insert([{ id: user.id, name: '' }]);
              
              // 新規作成したプロフィールを設定
              setForm({
                id: user.id,
                name: '',
                bio: '',
                website_url: '',
                profile_image_url: '',
                background_image_url: '',
                twitter_username: '',
                instagram_username: '',
                facebook_username: '',
              });
            } catch (createError) {
              console.error('プロフィール作成エラー:', createError);
              // エラーをスローするのではなく、空のプロフィールを設定
              setForm({
                id: user.id,
                name: '',
                bio: '',
                website_url: '',
                profile_image_url: '',
                background_image_url: '',
                twitter_username: '',
                instagram_username: '',
                facebook_username: '',
              });
            }
          } else {
            // LocalStorageから背景画像を取得
            const backgroundImage = getBackgroundImageFromLocalStorage();
            
            // 既存のプロフィールデータを設定
            const existingProfile = {
              id: user.id,
              name: data?.name || '',
              bio: data?.bio || '',
              website_url: data?.website_url || '',
              profile_image_url: data?.profile_image_url || '',
              background_image_url: backgroundImage || data?.background_image_url || '',
              twitter_username: data?.twitter_username || '',
              instagram_username: data?.instagram_username || '',
              facebook_username: data?.facebook_username || '',
            };
            
            setForm(existingProfile);
            
            // 背景画像のプレビューを設定
            if (backgroundImage || data?.background_image_url) {
              setBackgroundImagePreview(backgroundImage || data?.background_image_url || '');
            }
            
            // プロフィール画像のプレビューを設定
            if (data?.profile_image_url) {
              setImagePreview(data.profile_image_url);
            }
          }
        } catch (fetchError) {
          // オフライン時などのフォールバック処理
          console.error('プロフィール取得中にエラーが発生:', fetchError);
          
          // LocalStorageから背景画像を取得
          const backgroundImage = getBackgroundImageFromLocalStorage();
          
          // 最小限のプロフィールデータを設定
          setForm({
            id: user.id,
            name: '',
            bio: '',
            website_url: '',
            profile_image_url: '',
            background_image_url: backgroundImage || '',
            twitter_username: '',
            instagram_username: '',
            facebook_username: '',
          });
          
          if (backgroundImage) {
            setBackgroundImagePreview(backgroundImage);
          }
          
          // エラーメッセージを表示
          toast.error({
            title: 'エラー',
            description: 'プロフィール情報の取得に失敗しました。オフラインモードで動作しています。'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // エラーの詳細情報をログに出力
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        toast.error({
          title: 'エラー',
          description: 'プロフィール情報の取得に失敗しました。再度お試しください。'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getBackgroundImageFromLocalStorage, navigate, toast]);

  // プロフィール更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ユーザー情報を取得できませんでした');
      }
      
      // background_image_urlを除外したデータを準備
      const { background_image_url: bgImageUrl, ...dataWithoutBackground } = form;
      
      // LocalStorageに背景画像を保存（変数名を変更）
      if (bgImageUrl) {
        saveBackgroundImageToLocalStorage(bgImageUrl);
      }
      
      // プロフィール情報を更新（エラーハンドリングを強化）
      try {
        const { error } = await supabase
          .from('profiles')
          .update(dataWithoutBackground)
          .eq('id', user.id);
        
        if (error) {
          console.error('プロフィール更新エラー:', error);
          throw new Error(`プロフィール更新エラー: ${error.message}`);
        }
        
        // 成功メッセージ
        toast.success({
          title: '更新完了',
          description: 'プロフィールを更新しました'
        });
        
        // マイページに戻る
        navigate('/mypage');
      } catch (updateError) {
        console.error('プロフィール更新中にエラーが発生:', updateError);
        throw new Error(`プロフィール更新エラー: ${handleSupabaseError(updateError)}`);
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
      
      toast.error({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'プロフィールの更新に失敗しました'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      
      // ファイルサイズチェック (2MB制限)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('画像サイズは2MB以下にしてください');
        return;
      }
      
      // アップロード開始
      setUploading(true);
      
      // プレビュー表示とBase64エンコード
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = e.target.result as string;
          setImagePreview(base64Image);
          
          try {
            // Base64エンコードされた画像データを直接プロフィールに保存
            setForm(prev => ({ ...prev, profile_image_url: base64Image }));
            
            // 成功メッセージ
            console.log('画像を正常に読み込みました。保存ボタンをクリックすると反映されます。');
          } catch (error) {
            console.error('Error processing image:', error);
            setError('画像の処理中にエラーが発生しました');
          } finally {
            setUploading(false);
          }
        }
      };
      
      reader.onerror = () => {
        setError('画像の読み込みに失敗しました');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('画像のアップロードに失敗しました。再度お試しください。');
      setUploading(false);
    }
  };
  
  // 背景画像アップロード処理
  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      
      // ファイルサイズチェック (2MB制限)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('画像サイズは2MB以下にしてください');
        return;
      }
      
      // アップロード開始
      setUploading(true);
      
      // プレビュー表示とBase64エンコード
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = e.target.result as string;
          setBackgroundImagePreview(base64Image);
          
          try {
            // Base64エンコードされた画像データを直接プロフィールに保存
            setForm(prev => ({ ...prev, background_image_url: base64Image }));
            
            // LocalStorageにも保存（データベースの問題を回避）
            saveBackgroundImageToLocalStorage(base64Image);
            
            // 成功メッセージ
            console.log('背景画像を正常に読み込みました。保存ボタンをクリックすると反映されます。');
          } catch (error) {
            console.error('Error processing background image:', error);
            setError('背景画像の処理中にエラーが発生しました');
          } finally {
            setUploading(false);
          }
        }
      };
      
      reader.onerror = () => {
        setError('背景画像の読み込みに失敗しました');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading background image:', error);
      setError('背景画像のアップロードに失敗しました。再度お試しください。');
      setUploading(false);
    }
  };
  
  // 画像プレビューをクリア
  const clearImagePreview = async () => {
    // プレビューと画像URLをクリア
    setImagePreview(null);
    setForm(prev => ({ ...prev, profile_image_url: '' }));
  };

  // 背景画像プレビューをクリア
  const clearBackgroundImagePreview = async () => {
    // プレビューと背景画像URLをクリア
    setBackgroundImagePreview(null);
    setForm(prev => ({ ...prev, background_image_url: '' }));
    // LocalStorageからも背景画像を削除
    removeBackgroundImageFromLocalStorage();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/mypage')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            マイページに戻る
          </button>
          <button
            type="submit"
            form="settings-form"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">プロフィール設定</h2>
            <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 mb-1">
                  プロフィール画像
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {/* 現在の画像またはプレビュー表示 */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={imagePreview || form.profile_image_url || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt="プロフィール画像" 
                      className="w-full h-full object-cover"
                    />
                    {(imagePreview || form.profile_image_url) && (
                      <button
                        type="button"
                        onClick={clearImagePreview}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* アップロードボタン */}
                  <div className="flex-1">
                    <label
                      htmlFor="profile_image"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="mr-2 h-5 w-5 text-gray-400" />
                      {uploading ? '画像をアップロード中...' : '画像をアップロード'}
                    </label>
                    <input
                      id="profile_image"
                      name="profile_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG, GIF形式の画像をアップロードできます（最大2MB）
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="background_image" className="block text-sm font-medium text-gray-700 mb-1">
                  背景画像
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {/* 現在の背景画像またはプレビュー表示 */}
                  <div className="relative w-full h-32 overflow-hidden border-2 border-gray-200">
                    <img 
                      src={backgroundImagePreview || form.background_image_url || getBackgroundImageFromLocalStorage() || "https://picsum.photos/200/300"} 
                      alt="背景画像" 
                      className="w-full h-full object-cover"
                    />
                    {(backgroundImagePreview || form.background_image_url || getBackgroundImageFromLocalStorage()) && (
                      <button
                        type="button"
                        onClick={clearBackgroundImagePreview}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* アップロードボタン */}
                  <div className="flex-1">
                    <label
                      htmlFor="background_image"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="mr-2 h-5 w-5 text-gray-400" />
                      {uploading ? '背景画像をアップロード中...' : '背景画像をアップロード'}
                    </label>
                    <input
                      id="background_image"
                      name="background_image"
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      className="sr-only"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG, GIF形式の画像をアップロードできます（最大2MB）
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                  ウェブサイトURL
                </label>
                <input
                  type="url"
                  name="website_url"
                  id="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">SNSアカウント</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="twitter_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="twitter_username"
                        id="twitter_username"
                        value={form.twitter_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="instagram_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="instagram_username"
                        id="instagram_username"
                        value={form.instagram_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="facebook_username" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook ユーザー名
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        name="facebook_username"
                        id="facebook_username"
                        value={form.facebook_username}
                        onChange={handleChange}
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 従来のURL入力フィールドは非表示にする */}
              <div className="hidden">
                <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  プロフィール画像URL
                </label>
                <input
                  type="url"
                  name="profile_image_url"
                  id="profile_image_url"
                  value={form.profile_image_url}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}