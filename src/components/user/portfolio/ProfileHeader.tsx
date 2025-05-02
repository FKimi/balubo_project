import React from "react";
import { UserProfile } from '../../../types';

type Props = {
  userProfile: UserProfile | null;
  isCurrentUser: boolean;
  onEditProfile: () => void;
  onShare: () => void;
};

const ProfileHeader: React.FC<Props> = ({ userProfile, isCurrentUser, onEditProfile, onShare }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* 背景画像エリア */}
      <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        {userProfile?.background_image_url && (
          <img
            className="h-full w-full object-cover"
            src={userProfile.background_image_url}
            alt="背景画像"
          />
        )}
      </div>
      {/* プロフィール情報 */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 mt-0 relative max-w-screen-lg mx-auto">
        <div className="flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col items-center space-x-0 space-y-3 md:flex-row md:items-center md:space-x-5 md:space-y-0">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-4 border-white shadow-md">
              {userProfile?.profile_image_url ? (
                <img
                  src={userProfile.profile_image_url}
                  alt={userProfile?.name || userProfile?.full_name || "ユーザー"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-bold text-xl md:text-2xl">{userProfile?.name || userProfile?.full_name || "ユーザー名"}</h1>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl">{userProfile?.about || "自己紹介文がありません"}</p>
              {/* 所在地 */}
              {(userProfile?.location) && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {userProfile.location && <span>{userProfile.location}</span>}
                </div>
              )}
              {/* SNSリンク */}
              <div className="mt-3 flex space-x-3">
                {userProfile?.twitter && (
                  <a href={userProfile.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-blue-400 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.15 4.15 0 001.82-2.27 8.3 8.3 0 01-2.63 1A4.13 4.13 0 0016.11 4c-2.28 0-4.13 1.85-4.13 4.13 0 .32.04.63.1.93C8 8.9 5.12 7.35 3.1 5.07c-.35.6-.55 1.29-.55 2.03 0 1.4.71 2.63 1.8 3.36-.66-.02-1.28-.2-1.82-.5v.05c0 1.95 1.39 3.57 3.24 3.94-.34.09-.7.14-1.07.14-.26 0-.51-.02-.75-.07.52 1.62 2.03 2.8 3.83 2.83A8.3 8.3 0 012 19.54a11.7 11.7 0 006.29 1.84c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z"/></svg>
                  </a>
                )}
                {userProfile?.instagram && (
                  <a href={userProfile.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-500 hover:text-pink-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.32 3.608 1.294.974.974 1.232 2.242 1.294 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.32 2.633-1.294 3.608-.974.974-2.242 1.232-3.608 1.294-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.32-3.608-1.294-.974-.974-1.232-2.242-1.294-3.608C2.212 15.634 2.2 15.25 2.2 12s.012-3.584.07-4.85c.062-1.366.32-2.633 1.294-3.608C4.538 2.59 5.806 2.332 7.172 2.27 8.438 2.212 8.822 2.2 12 2.2zm0-2.2C8.735 0 8.332.013 7.052.072 5.773.132 4.614.374 3.637 1.35 2.66 2.326 2.418 3.485 2.358 4.764c-.059 1.28-.072 1.683-.072 5.236s.013 3.956.072 5.236c.06 1.279.302 2.438 1.279 3.415.977.977 2.136 1.219 3.415 1.279 1.28.059 1.683.072 5.236.072s3.956-.013 5.236-.072c1.279-.06 2.438-.302 3.415-1.279.977-.977 1.219-2.136 1.279-3.415.059-1.28.072-1.683.072-5.236s-.013-3.956-.072-5.236c-.06-1.279-.302-2.438-1.279-3.415C19.362.374 18.203.132 16.924.072 15.645.013 15.242 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-8 3.999 3.999 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {userProfile?.facebook && (
                  <a href={userProfile.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-blue-600 hover:text-blue-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.676 0H1.324C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.324 24h11.495v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.676 0"/></svg>
                  </a>
                )}
                {/* 他SNSも必要に応じて追加 */}
              </div>
            </div>
            {/* プロフィール編集ボタンとシェアボタン */}
            <div className="flex space-x-2 w-full md:w-auto justify-center md:justify-end">
              {isCurrentUser && (
                <>
                  <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" onClick={onEditProfile}>編集</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200" onClick={onShare}>シェア</button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-2 justify-center md:justify-start">
            {/* フォロー数・フォロワー数等は必要に応じてpropsで受け渡し */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
