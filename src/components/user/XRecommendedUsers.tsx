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

const XRecommendedUsers: React.FC = () => {
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
    // eslint-disable-next-line
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
      let query = supabase
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
    } catch (e: any) {
      setError(e.message || 'ユーザー取得に失敗しました');
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
      let query = supabase
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
    } catch (e: any) {
      setError(e.message || 'ユーザー取得に失敗しました');
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
    } catch (e) {
      alert('フォロー処理に失敗しました');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 w-full max-w-md">
      <h2 className="font-bold text-lg mb-4">おすすめユーザー</h2>
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
                <img
                  src={user.profile_image_url || '/noavatar.png'}
                  alt={user.full_name || 'ユーザー'}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">{user.full_name || 'ユーザー'}</div>
                <div className="text-xs text-gray-400 truncate">ID: {user.id.slice(0, 8)}</div>
                <div className="text-xs text-gray-500 truncate">{user.headline || ''}</div>
              </div>
              {currentUserId && (
                <button
                  className={`ml-2 px-4 py-1 rounded-full font-bold text-xs transition bg-black text-white hover:bg-gray-900`}
                  disabled={processing === user.id}
                  onClick={() => handleFollowToggle(user.id)}
                >
                  フォロー
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasMore && !loading && (
        <button className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold text-sm text-gray-700" onClick={fetchMoreUsers}>
          もっと見る
        </button>
      )}
    </div>
  );
};

export default XRecommendedUsers;
