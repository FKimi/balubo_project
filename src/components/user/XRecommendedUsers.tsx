// X（旧Twitter）風「おすすめユーザー」右カラム
import React, { useEffect, useState, useRef } from "react";
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  full_name?: string;
  profile_image_url?: string;
  headline?: string;
}

interface XRecommendedUsersProps {
  hideTitle?: boolean;
}

const XRecommendedUsers: React.FC<XRecommendedUsersProps> = ({ hideTitle = false }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null); // フォローボタン連打防止
  const [hasMore, setHasMore] = useState(true); // もっと見る用
  const limit = 5;

  // すでに表示済みのユーザーIDをuseRefで管理
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
     
  }, []);

  // 初回・リロード時
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // ログインユーザー取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('ログインが必要です');
        setUsers([]);
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);
      // フォロー済みID
      const followsRes = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id);
      const followedIds = (followsRes.data?.map(f => f.followed_id) || [])
        .filter(Boolean)
        .filter(id => id !== user.id);
      // 除外IDリスト
      const excludeIds = [...followedIds, user.id];
      shownIdsRef.current = new Set(excludeIds); // 初期化
      // クエリ
      const query = supabase
        .from('profiles')
        .select('id, full_name, profile_image_url, headline')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      const usersData: Profile[] = data || [];
      usersData.forEach(u => shownIdsRef.current.add(u.id));
      setUsers(usersData);
      setHasMore(usersData.length === limit);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'ユーザー取得に失敗しました';
      setError(errorMessage);
      setUsers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // もっと見る
  const fetchMoreUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUserId) return;
      // フォロー済みID
      const followsRes = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', currentUserId);
      const followedIds = (followsRes.data?.map(f => f.followed_id) || [])
        .filter(Boolean)
        .filter(id => id !== currentUserId);
      // すでに表示済み＋フォロー済み＋自分
      const excludeIds = [...Array.from(shownIdsRef.current), ...followedIds, currentUserId];
      // クエリ
      const query = supabase
        .from('profiles')
        .select('id, full_name, profile_image_url, headline')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      const usersData: Profile[] = data || [];
      usersData.forEach(u => shownIdsRef.current.add(u.id));
      setUsers(prev => [...prev, ...usersData]);
      setHasMore(usersData.length === limit);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'ユーザー取得に失敗しました';
      setError(errorMessage);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // フォロー/アンフォロートグル（フォローのみ）
  const handleFollowToggle = async (targetId: string) => {
    if (!currentUserId) return;
    setProcessing(targetId);
    try {
      // フォロー
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, followed_id: targetId });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== targetId));
      shownIdsRef.current.add(targetId);
    } catch {
      alert('フォロー処理に失敗しました');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 w-full">
      {!hideTitle && <h2 className="font-bold text-lg mb-4 text-gray-800">おすすめユーザー</h2>}
      {loading ? (
        <div className="text-gray-400 text-center py-6">読み込み中...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-6">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-gray-400 text-center py-6">おすすめユーザーがいません</div>
      ) : (
        <ul className="space-y-5">
          {users.map(user => (
            <li key={user.id} className="flex items-center gap-3">
              <Link to={`/profile/${user.id}`} tabIndex={0} aria-label={`${user.full_name || 'ユーザー'}のプロフィール`} className="focus:outline-none">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.full_name || 'ユーザー'}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-gray-200 text-indigo-500 cursor-pointer hover:bg-indigo-200 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.id}`} className="hover:text-indigo-600 transition">
                  <div className="font-semibold text-sm truncate">{user.full_name || 'ユーザー'}</div>
                </Link>
                <div className="text-xs text-gray-500 truncate">{user.headline || '⁠'}</div>
              </div>
              {currentUserId && (
                <button
                  className={`ml-2 px-3 py-1 rounded-full font-semibold text-xs transition ${
                    processing === user.id 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  disabled={processing === user.id}
                  onClick={() => handleFollowToggle(user.id)}
                >
                  {processing === user.id ? '処理中...' : 'フォロー'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasMore && !loading && (
        <button className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold text-xs text-gray-700 transition" onClick={fetchMoreUsers}>
          もっと見る
        </button>
      )}
    </div>
  );
};

export default XRecommendedUsers;
