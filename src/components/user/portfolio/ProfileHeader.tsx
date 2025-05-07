import React from "react";
import { UserProfile } from '../../../types';

type Props = {
  userProfile: UserProfile | null;
  isCurrentUser: boolean;
  onEditProfile: () => void;
  onShare: () => void;
  // フォロー・フォロワー数は仮のデータとして定義しておく
  followCount?: number;
  followerCount?: number;
  // フォロー関連の情報を追加
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowLoading?: boolean;
};

const ProfileHeader: React.FC<Props> = ({ 
  userProfile, 
  isCurrentUser, 
  onEditProfile, 
  onShare,
  followCount = 0,
  followerCount = 0,
  isFollowing = false,
  onFollow,
  onUnfollow,
  isFollowLoading = false
}) => {
  return (
    <div className="bg-white shadow-sm">
      {/* 背景画像エリア - より大きく、迫力のあるデザインに */}
      <div className="h-60 md:h-80 relative overflow-hidden">
        {userProfile?.background_image_url ? (
          <img
            className="h-full w-full object-cover"
            src={userProfile.background_image_url}
            alt="背景画像"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
          </div>
        )}
        
        {/* アクションボタンを背景画像上に配置 */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex space-x-2">
          {/* URLシェアボタン - ラベル付きで分かりやすく */}
          <button 
            className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-full hover:shadow transition backdrop-blur-sm flex items-center gap-1.5 text-sm"
            onClick={onShare}
            aria-label="URLをシェア"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            URLをシェア
          </button>
        </div>
      </div>

      {/* プロフィール情報コンテナ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* プロフィール画像 - 背景との重なり部分に配置 */}
        <div className="absolute left-8 -top-16 md:-top-20 lg:-top-24">
          <div className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            {userProfile?.profile_image_url ? (
              <img
                src={userProfile.profile_image_url}
                alt={userProfile?.name || userProfile?.full_name || "ユーザー"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-1/2 w-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* ユーザー情報 - 画像の下に配置 */}
        <div className="pt-20 md:pt-24 lg:pt-28 pb-5">
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {userProfile?.name || userProfile?.full_name || "ユーザー名"}
              </h1>
              
              {/* プロフィール編集ボタン - 自分のプロフィールの場合のみ表示 */}
              {isCurrentUser && (
                <button 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition flex items-center gap-1.5 text-sm"
                  onClick={onEditProfile}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  プロフィールを編集
                </button>
              )}
            </div>
            
            {/* 肩書き */}
            {userProfile?.headline && (
              <p className="text-gray-600 text-lg mb-2">{userProfile.headline}</p>
            )}
            
            {/* 所在地 */}
            {userProfile?.location && (
              <div className="flex items-center text-gray-500 mb-3">
                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{userProfile.location}</span>
              </div>
            )}

            {/* フォローボタン - 自分のプロフィール以外の場合表示 */}
            {!isCurrentUser && (
              <div className="mt-3 mb-2">
                <button
                  className={`px-5 py-2 rounded-full font-medium transition-all flex items-center justify-center gap-1.5 ${
                    isFollowing
                      ? 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  onClick={isFollowing ? onUnfollow : onFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d={isFollowing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                      </svg>
                      <span>{isFollowing ? 'フォロー中' : 'フォローする'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* フォロー数・フォロワー数とSNSリンク */}
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-center mb-6">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-xl font-semibold">{followCount}</div>
              <div className="text-gray-500 text-sm">フォロー</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{followerCount}</div>
              <div className="text-gray-500 text-sm">フォロワー</div>
            </div>
          </div>
          
          {/* SNSリンク */}
          <div className="flex items-center gap-3">
            {userProfile?.twitter && (
              <a 
                href={userProfile.twitter} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Twitter" 
                className="text-blue-400 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-full transition-all transform hover:scale-110 shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.15 4.15 0 001.82-2.27 8.3 8.3 0 01-2.63 1A4.13 4.13 0 0016.11 4c-2.28 0-4.13 1.85-4.13 4.13 0 .32.04.63.1.93C8 8.9 5.12 7.35 3.1 5.07c-.35.6-.55 1.29-.55 2.03 0 1.4.71 2.63 1.8 3.36-.66-.02-1.28-.2-1.82-.5v.05c0 1.95 1.39 3.57 3.24 3.94-.34.09-.7.14-1.07.14-.26 0-.51-.02-.75-.07.52 1.62 2.03 2.8 3.83 2.83A8.3 8.3 0 012 19.54a11.7 11.7 0 006.29 1.84c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z"/></svg>
              </a>
            )}
            {userProfile?.instagram && (
              <a 
                href={userProfile.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                className="text-pink-500 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 p-2.5 rounded-full transition-all transform hover:scale-110 shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.32 3.608 1.294.974.974 1.232 2.242 1.294 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.32 2.633-1.294 3.608-.974.974-2.242 1.232-3.608 1.294-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.32-3.608-1.294-.974-.974-1.232-2.242-1.294-3.608C2.212 15.634 2.2 15.25 2.2 12s.012-3.584.07-4.85c.062-1.366.32-2.633 1.294-3.608C4.538 2.59 5.806 2.332 7.172 2.27 8.438 2.212 8.822 2.2 12 2.2zm0-2.2C8.735 0 8.332.013 7.052.072 5.773.132 4.614.374 3.637 1.35 2.66 2.326 2.418 3.485 2.358 4.764c-.059 1.28-.072 1.683-.072 5.236s.013 3.956.072 5.236c.06 1.279.302 2.438 1.279 3.415.977.977 2.136 1.219 3.415 1.279 1.28.059 1.683.072 5.236.072s3.956-.013 5.236-.072c1.279-.06 2.438-.302 3.415-1.279.977-.977 1.219-2.136 1.279-3.415.059-1.28.072-1.683.072-5.236s-.013-3.956-.072-5.236c-.06-1.279-.302-2.438-1.279-3.415C19.362.374 18.203.132 16.924.072 15.645.013 15.242 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-8 3.999 3.999 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            )}
            {userProfile?.facebook && (
              <a 
                href={userProfile.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook" 
                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-full transition-all transform hover:scale-110 shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.676 0H1.324C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.324 24h11.495v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.676 0"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* 装飾的な波形の区切り */}
      <div className="h-6 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 w-full relative overflow-hidden">
        <svg className="absolute bottom-0 w-full h-12 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
  );
};

export default ProfileHeader;
