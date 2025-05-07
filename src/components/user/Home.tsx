import * as React from 'react';
import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Plus } from 'lucide-react';
import XRecommendedUsers from './XRecommendedUsers';

// 型定義
interface Work {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  created_at: string;
  user_id: string;
  user?: UserType;
  tags?: string[];
  views?: number;
  likes?: number;
  comments?: number;
  likeCount?: number;
  likedByMe?: boolean;
}

interface Mutter {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: UserType;
  likeCount?: number;
  likedByMe?: boolean;
  comments?: number;
}

interface Comment {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  text: string;
  created_at: string;
  user?: UserType;
}

export interface UserType {
  id: string;
  full_name: string;
  profile_image_url: string;
  headline: string;
}

const Home: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [mutters, setMutters] = useState<Mutter[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'works' | 'mutters'>('works');
  const [likeLoading, setLikeLoading] = useState<string | null>(null); 
  const [commentModalWorkId, setCommentModalWorkId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [mutterLikeLoading, setMutterLikeLoading] = useState<string | null>(null);
  const [mutterCommentModalId, setMutterCommentModalId] = useState<string | null>(null);
  const [mutterComments, setMutterComments] = useState<Comment[]>([]);
  const [mutterCommentInput, setMutterCommentInput] = useState('');
  const [mutterCommentLoading, setMutterCommentLoading] = useState(false);
  const [mutterCommentError, setMutterCommentError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecentWorks = useCallback(async () => {
    try {
      setLoading(true);
      const worksQuery = supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      const { data: worksData, error: worksError } = await worksQuery;
      if (worksError) {
        console.error('Supabase works error:', worksError.message);
        throw worksError;
      }
      if (!worksData || worksData.length === 0) {
        setWorks([]);
        return;
      }
      const userIds = Array.from(new Set(worksData.map((w: Work) => w.user_id).filter(Boolean)));
      let usersMap: Record<string, UserType> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (!usersError && usersData) {
          usersMap = Object.fromEntries(
            (usersData as UserType[]).map(u => [u.id, u])
          );
        }
      }
      const workIds = worksData.map((w: Work) => w.id);
      const { data: { user } } = await supabase.auth.getUser();
      let likeCounts: Record<string, number> = {};
      let likedWorkIds: string[] = [];
      if (workIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('content_id, user_id')
          .eq('content_type', 'work')
          .in('content_id', workIds);
        if (!likesError && likesData) {
          likeCounts = likesData.reduce((acc: Record<string, number>, row: { content_id: string; user_id: string }) => {
            acc[row.content_id] = (acc[row.content_id] || 0) + 1;
            return acc;
          }, {});
          if (user) {
            likedWorkIds = likesData.filter((row: { user_id: string }) => row.user_id === user.id).map((row: { content_id: string }) => row.content_id);
          }
        }
      }
      const merged = worksData.map((w: Work) => ({
        ...w,
        user: usersMap[w.user_id] || undefined,
        likeCount: likeCounts[w.id] || 0,
        likedByMe: likedWorkIds.includes(w.id)
      }));
      setWorks(merged);
    } catch {
      console.error('Fetch error:');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMutters = useCallback(async () => {
    try {
      setLoading(true);
      const muttersQuery = supabase
        .from('mutters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      const { data: muttersData, error: muttersError } = await muttersQuery;
      if (muttersError) {
        console.error('Supabase mutters error:', muttersError.message);
        setMutters([]);
        return;
      }
      if (!muttersData || muttersData.length === 0) {
        setMutters([]);
        return;
      }
      const userIds = Array.from(new Set(muttersData.map((m: Mutter) => m.user_id).filter(Boolean)));
      let usersMap: Record<string, UserType> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (!usersError && usersData) {
          usersMap = Object.fromEntries(
            (usersData as UserType[]).map(u => [u.id, u])
          );
        }
      }
      const mutterIds = muttersData.map((m: Mutter) => m.id);
      const { data: { user } } = await supabase.auth.getUser();
      let likeCounts: Record<string, number> = {};
      let likedMutterIds: string[] = [];
      let commentCounts: Record<string, number> = {};
      if (mutterIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('content_id, user_id')
          .eq('content_type', 'mutter')
          .in('content_id', mutterIds);
        if (!likesError && likesData) {
          likeCounts = likesData.reduce((acc: Record<string, number>, row: { content_id: string; user_id: string }) => {
            acc[row.content_id] = (acc[row.content_id] || 0) + 1;
            return acc;
          }, {});
          if (user) {
            likedMutterIds = likesData.filter((row: { user_id: string }) => row.user_id === user.id).map((row: { content_id: string }) => row.content_id);
          }
        }
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('content_id')
          .eq('content_type', 'mutter')
          .in('content_id', mutterIds);
        if (!commentsError && commentsData) {
          commentCounts = commentsData.reduce((acc: Record<string, number>, row: { content_id: string }) => {
            acc[row.content_id] = (acc[row.content_id] || 0) + 1;
            return acc;
          }, {});
        }
      }
      const merged = muttersData.map((m: Mutter) => ({
        ...m,
        user: usersMap[m.user_id] || undefined,
        likeCount: likeCounts[m.id] || 0,
        likedByMe: likedMutterIds.includes(m.id),
        comments: commentCounts[m.id] || 0
      }));
      setMutters(merged);
    } catch {
      console.error('Supabase mutters fetch error:');
      setMutters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (workId: string) => {
    setCommentLoading(true);
    setCommentError(null);
    try {
      const { data: commentData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', 'work')
        .eq('content_id', workId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!commentData || commentData.length === 0) {
        setComments([]);
        setCommentLoading(false);
        return;
      }
      const userIds = Array.from(new Set(commentData.map((c: Comment) => c.user_id).filter(Boolean)));
      let usersMap: Record<string, UserType> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (!usersError && usersData) {
          usersMap = Object.fromEntries(
            (usersData as UserType[]).map(u => [u.id, u])
          );
        }
      }
      const merged = commentData.map((c: Comment) => ({
        ...c,
        user: usersMap[c.user_id] || undefined
      }));
      setComments(merged);
    } catch {
      setCommentError('コメントの取得に失敗しました');
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const fetchMutterComments = useCallback(async (mutterId: string) => {
    setMutterCommentLoading(true);
    setMutterCommentError(null);
    try {
      const { data: commentData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', 'mutter')
        .eq('content_id', mutterId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!commentData || commentData.length === 0) {
        setMutterComments([]);
        setMutterCommentLoading(false);
        return;
      }
      const userIds = Array.from(new Set(commentData.map((c: Comment) => c.user_id).filter(Boolean)));
      let usersMap: Record<string, UserType> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (!usersError && usersData) {
          usersMap = Object.fromEntries(
            (usersData as UserType[]).map(u => [u.id, u])
          );
        }
      }
      const merged = commentData.map((c: Comment) => ({
        ...c,
        user: usersMap[c.user_id] || undefined
      }));
      setMutterComments(merged);
    } catch {
      setMutterCommentError('コメントの取得に失敗しました');
      setMutterComments([]);
    } finally {
      setMutterCommentLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (feedType === 'works') {
      fetchRecentWorks();
    } else {
      fetchMutters();
    }
  }, [feedType, fetchRecentWorks, fetchMutters]);

  const refreshWork = useCallback(async (workId: string) => {
    const { data, error } = await supabase
      .from('works')
      .select('*, profiles!inner(id, full_name, profile_image_url)')
      .eq('id', workId)
      .single();
    if (!error && data) {
      setWorks(prev =>
        prev.map(w => w.id === workId
          ? { ...w, ...data, user: data.profiles }
          : w
        )
      );
    }
  }, []);

  const toggleLike = useCallback(async (workId: string, liked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('いいねするにはログインが必要です');
      return;
    }
    setLikeLoading(workId);
    try {
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', workId)
          .eq('content_type', 'work');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, content_id: workId, content_type: 'work' });
        if (error) throw error;
      }
      await refreshWork(workId);
    } catch {
      alert('いいね操作に失敗しました');
    } finally {
      setLikeLoading(null);
    }
  }, [refreshWork]);

  const toggleMutterLike = useCallback(async (mutterId: string, liked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('いいねするにはログインが必要です');
      return;
    }
    setMutterLikeLoading(mutterId);
    try {
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', mutterId)
          .eq('content_type', 'mutter');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, content_id: mutterId, content_type: 'mutter' });
        if (error) throw error;
      }
      setMutters(prev => prev.map(m =>
        m.id === mutterId
          ? {
              ...m,
              likeCount: m.likeCount ? (liked ? m.likeCount - 1 : m.likeCount + 1) : (liked ? 0 : 1),
              likedByMe: !liked
            }
          : m
      ));
    } catch {
      alert('いいね操作に失敗しました');
    } finally {
      setMutterLikeLoading(null);
    }
  }, []);

  const postComment = useCallback(async (workId: string) => {
    setCommentLoading(true);
    setCommentError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCommentError('コメントするにはログインが必要です');
        setCommentLoading(false);
        return;
      }
      if (!commentInput.trim()) {
        setCommentError('コメントを入力してください');
        setCommentLoading(false);
        return;
      }
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content_id: workId,
          content_type: 'work',
          text: commentInput.trim(),
        });
      if (error) throw error;
      setCommentInput('');
      await fetchComments(workId); 
      setWorks(prev => prev.map(w => w.id === workId ? { ...w, comments: (w.comments ?? 0) + 1 } : w));
    } catch {
      setCommentError('コメントの投稿に失敗しました');
    } finally {
      setCommentLoading(false);
    }
  }, [commentInput, fetchComments]);

  const postMutterComment = useCallback(async (mutterId: string) => {
    setMutterCommentLoading(true);
    setMutterCommentError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMutterCommentError('コメントするにはログインが必要です');
        setMutterCommentLoading(false);
        return;
      }
      if (!mutterCommentInput.trim()) {
        setMutterCommentError('コメントを入力してください');
        setMutterCommentLoading(false);
        return;
      }
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content_id: mutterId,
          content_type: 'mutter',
          text: mutterCommentInput.trim(),
        });
      if (error) throw error;
      setMutterCommentInput('');
      await fetchMutterComments(mutterId);
      setMutters(prev => prev.map(m => m.id === mutterId ? { ...m, comments: (m.comments ?? 0) + 1 } : m));
    } catch {
      setMutterCommentError('コメントの投稿に失敗しました');
    } finally {
      setMutterCommentLoading(false);
    }
  }, [mutterCommentInput, fetchMutterComments]);


  const closeCommentModal = useCallback(() => {
    setCommentModalWorkId(null);
    setComments([]);
    setCommentInput('');
    setCommentError(null);
  }, []);

  const openMutterCommentModal = useCallback((mutterId: string) => {
    setMutterCommentModalId(mutterId);
    setMutterCommentInput('');
    fetchMutterComments(mutterId);
  }, [fetchMutterComments]);

  const closeMutterCommentModal = useCallback(() => {
    setMutterCommentModalId(null);
    setMutterComments([]);
    setMutterCommentInput('');
    setMutterCommentError(null);
  }, []);

  const [mutterInput, setMutterInput] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [inputError, setInputError] = React.useState('');

  const postMutter = useCallback(async () => {
    if (!mutterInput.trim()) {
      setInputError('投稿内容を入力してください');
      return;
    }
    if (mutterInput.length > 200) {
      setInputError('投稿内容は200文字以内で入力してください');
      return;
    }
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInputError('ログインが必要です');
        return;
      }
      const { error } = await supabase.from('mutters').insert({
        content: mutterInput,
        user_id: user.id
      });
      if (!error) {
        setMutterInput('');
        fetchMutters();
        setInputError('');
      } else {
        setInputError('投稿に失敗しました');
      }
    } finally {
      setPosting(false);
    }
  }, [mutterInput, fetchMutters]);

  return (
    <>
      {/* 3カラムレイアウト */}
      <div className="flex justify-between bg-gradient-to-b from-gray-50 to-white min-h-screen pt-0 w-full max-w-screen-2xl mx-auto">
        {/* 左サイドバー */}
        <aside className="hidden lg:flex flex-col min-w-[72px] max-w-[220px] w-full px-2 py-6 overflow-y-auto h-screen">
        </aside>
        {/* メインカラム */}
        <main className="flex-1 max-w-full sm:max-w-2xl md:max-w-xl lg:max-w-2xl w-full px-0 sm:px-4 border-x border-gray-100 bg-white min-h-screen shadow-sm">
          {/* ヘッダー＆タブ・フィルタ一体型カード */}
          <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20 backdrop-blur-sm bg-white/95">
            <div className="max-w-full sm:max-w-2xl mx-auto flex flex-col gap-4 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 tracking-tight">ホーム</h1>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm sm:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  onClick={() => navigate('/works/new')}
                >
                  <Plus className="w-4 h-4" /> 新規投稿
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-4 py-2 rounded-full font-semibold text-sm sm:text-base shadow-sm border transition-all duration-200 ${feedType === 'works' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50'}`}
                  onClick={() => setFeedType('works')}
                >作品フィード</button>
                <button
                  className={`px-4 py-2 rounded-full font-semibold text-sm sm:text-base shadow-sm border transition-all duration-200 ${feedType === 'mutters' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50'}`}
                  onClick={() => setFeedType('mutters')}
                >ぼやきフィード</button>
              </div>
            </div>
          </div>

          {/* ぼやき投稿フォーム（ぼやきフィード時のみ） */}
          {feedType === 'mutters' && (
            <div className="max-w-full sm:max-w-2xl mx-auto px-4 sm:px-6 py-5">
              <div className="bg-white rounded-2xl shadow-md flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                <textarea
                  className={`flex-1 border rounded-xl p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50 ${inputError ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="いまの気持ちやひとことを投稿..."
                  rows={2}
                  maxLength={200}
                  value={mutterInput}
                  onChange={e => setMutterInput(e.target.value)}
                  disabled={posting}
                />
                <button
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-base shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  onClick={postMutter}
                  disabled={posting}
                >投稿する</button>
              </div>
              {inputError && <div className="text-red-500 text-sm mt-2 ml-1">{inputError}</div>}
            </div>
          )}

          {/* メインフィード */}
          <div className="max-w-full w-full mx-auto py-6 sm:py-8 px-4 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : feedType === 'works' ? (
              works.length === 0 ? (
                <div className="text-center text-gray-400 py-16 bg-gray-50/50 rounded-2xl">
                  <div className="text-gray-300 mb-3 text-5xl">🖼️</div>
                  <p className="text-lg font-medium text-gray-500">作品がありません</p>
                  <p className="text-sm text-gray-400 mt-2">新しい作品を投稿してみましょう</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {works.map(work => {
                    const thumb = work.thumbnailUrl || work.thumbnail_url;
                    return (
                      <div
                        key={work.id}
                        className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col p-0 sm:p-1 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-indigo-200 cursor-pointer no-underline transform hover:-translate-y-1"
                        onClick={() => navigate(`/works/${work.id}`)}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt="thumbnail"
                            className="w-full h-52 object-cover rounded-t-2xl bg-white"
                            style={{ display: 'block' }}
                          />
                        ) : (
                          <div className="w-full h-52 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center justify-center text-gray-300 text-5xl rounded-t-2xl">🖼️</div>
                        )}
                        <div className="flex flex-col gap-3 px-5 pb-5 pt-3">
                          <div className="flex items-center gap-3 mb-1">
                            <div
                              className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm transform transition-transform hover:scale-110"
                              onClick={e => { e.stopPropagation(); if (work.user) navigate(`/profile/${work.user.id}`); }}
                            >
                              {work.user?.profile_image_url ? (
                                <img src={work.user.profile_image_url} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span 
                                className="font-bold text-base sm:text-lg text-gray-900 leading-snug hover:text-indigo-600 cursor-pointer transition-colors"
                                onClick={e => { e.stopPropagation(); if (work.user) navigate(`/profile/${work.user.id}`); }}
                              >
                                {work.user?.full_name || 'ユーザー'}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(work.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                          <div className="font-bold text-base sm:text-xl text-gray-900 mb-1 line-clamp-2 leading-snug">{work.title}</div>
                          <div className="text-gray-700 text-sm sm:text-base line-clamp-2 leading-relaxed">{work.description}</div>
                          <div className="flex items-center gap-6 mt-2 text-gray-500 text-sm">
                            <button
                              className="flex items-center gap-2 focus:outline-none group transition-colors hover:text-indigo-600"
                              onClick={e => { e.stopPropagation(); toggleLike(work.id, work.likedByMe!); }}
                              disabled={likeLoading === work.id}
                              aria-label={work.likedByMe ? 'いいね解除' : 'いいね'}
                            >
                              <Heart className={`w-5 h-5 transition-all ${work.likedByMe ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400 group-hover:scale-110'}`} />
                              <span>{work.likeCount}</span>
                              {likeLoading === work.id && <span className="ml-1 animate-spin">⏳</span>}
                            </button>
                            <button
                              className="flex items-center gap-2 focus:outline-none group relative transition-colors hover:text-indigo-600"
                              onClick={e => { e.stopPropagation(); navigate(`/works/${work.id}`); }}
                              aria-label="コメント一覧・投稿"
                            >
                              <MessageSquare className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
                              <span>{work.comments ?? 0}</span>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">詳細ページでコメント</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              mutters.length === 0 ? (
                <div className="text-center text-gray-400 py-16 bg-gray-50/50 rounded-2xl">
                  <div className="text-gray-300 mb-3 text-5xl">💭</div>
                  <p className="text-lg font-medium text-gray-500">ぼやきがありません</p>
                  <p className="text-sm text-gray-400 mt-2">今の気持ちを投稿してみましょう</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {mutters.map(mutter => (
                    <div key={mutter.id} className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col p-5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-200 transform hover:-translate-y-0.5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          {mutter.user?.profile_image_url ? (
                            <img src={mutter.user.profile_image_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-gray-900 leading-snug">{mutter.user?.full_name || 'ユーザー'}</span>
                          <span className="text-xs text-gray-400">{new Date(mutter.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 whitespace-pre-line">{mutter.content}</div>
                      <div className="flex items-center gap-6 mt-2 text-gray-500 text-sm">
                        <button
                          className="flex items-center gap-2 focus:outline-none group transition-colors hover:text-indigo-600"
                          onClick={e => { e.stopPropagation(); toggleMutterLike(mutter.id, mutter.likedByMe!); }}
                          disabled={mutterLikeLoading === mutter.id}
                          aria-label={mutter.likedByMe ? 'いいね解除' : 'いいね'}
                        >
                          <Heart className={`w-5 h-5 transition-all ${mutter.likedByMe ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400 group-hover:scale-110'}`} />
                          <span>{mutter.likeCount}</span>
                          {mutterLikeLoading === mutter.id && <span className="ml-1 animate-spin">⏳</span>}
                        </button>
                        <button
                          className="flex items-center gap-2 focus:outline-none group transition-colors hover:text-indigo-600"
                          onClick={e => { e.stopPropagation(); openMutterCommentModal(mutter.id); }}
                          aria-label="コメント一覧・投稿"
                        >
                          <MessageSquare className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
                          <span>{mutter.comments ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            
            {/* モバイル・タブレット用おすすめユーザー（md以下で表示） */}
            <div className="md:hidden mt-16">
              <h2 className="font-bold text-xl mb-6 px-2 text-gray-700">おすすめユーザー</h2>
              <XRecommendedUsers hideTitle={true} />
            </div>
          </div>
        </main>
        {/* 右カラム */}
        <aside className="hidden md:block min-w-[280px] xl:min-w-[320px] max-w-[320px] w-full px-5 py-8">
          <div className="sticky top-4 space-y-6">
            <XRecommendedUsers />
          </div>
        </aside>
      </div>

      {/* コメントモーダル */}
      {commentModalWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={closeCommentModal}
              aria-label="閉じる"
            >×</button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">コメント</h3>
            {commentLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : commentError ? (
              <div className="text-red-500 py-4 text-center bg-red-50 rounded-lg">{commentError}</div>
            ) : (
              <div className="max-h-64 overflow-y-auto mb-5 pr-2 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl">
                    <p className="text-base">まだコメントがありません</p>
                    <p className="text-sm mt-1">最初のコメントを投稿しましょう</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                        {c.user?.profile_image_url ? (
                          <img src={c.user.profile_image_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900">{c.user?.full_name || 'ユーザー'}</div>
                        <div className="text-gray-700 text-sm whitespace-pre-line mt-1">{c.text}</div>
                        <div className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t pt-4">
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                rows={3}
                placeholder="コメントを入力..."
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                disabled={commentLoading}
              />
              <button
                className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-base font-medium hover:bg-indigo-700 disabled:opacity-60 shadow-sm hover:shadow transition-all"
                onClick={() => postComment(commentModalWorkId)}
                disabled={commentLoading || !commentInput.trim()}
              >{commentLoading ? '送信中...' : 'コメント送信'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ぼやき コメントモーダル */}
      {mutterCommentModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={closeMutterCommentModal}
              aria-label="閉じる"
            >×</button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">コメント</h3>
            {mutterCommentLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : mutterCommentError ? (
              <div className="text-red-500 py-4 text-center bg-red-50 rounded-lg">{mutterCommentError}</div>
            ) : (
              <div className="max-h-64 overflow-y-auto mb-5 pr-2 space-y-4">
                {mutterComments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl">
                    <p className="text-base">まだコメントがありません</p>
                    <p className="text-sm mt-1">最初のコメントを投稿しましょう</p>
                  </div>
                ) : (
                  mutterComments.map(c => (
                    <div key={c.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                        {c.user?.profile_image_url ? (
                          <img src={c.user.profile_image_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900">{c.user?.full_name || 'ユーザー'}</div>
                        <div className="text-gray-700 text-sm whitespace-pre-line mt-1">{c.text}</div>
                        <div className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t pt-4">
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                rows={3}
                placeholder="コメントを入力..."
                value={mutterCommentInput}
                onChange={e => setMutterCommentInput(e.target.value)}
                disabled={mutterCommentLoading}
              />
              <button
                className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-base font-medium hover:bg-indigo-700 disabled:opacity-60 shadow-sm hover:shadow transition-all"
                onClick={() => postMutterComment(mutterCommentModalId)}
                disabled={mutterCommentLoading || !mutterCommentInput.trim()}
              >{mutterCommentLoading ? '送信中...' : 'コメント送信'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;