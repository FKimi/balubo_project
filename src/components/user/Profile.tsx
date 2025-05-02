import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import FollowListModal from '../ui/FollowListModal';
import { TagRankingList } from "./TagRankingList";
import { InputLogCard } from "./InputLogCard";
import CareerSection from './portfolio/CareerSection';

type UserProfile = {
  id: string;
  full_name: string;
  about: string;
  website_url: string;
  profile_image_url: string;
  headline?: string;
  location?: string;
  industry?: string;
  background_image_url?: string;
  skills?: string[]; // Add this line
};

const dummyProfile: UserProfile = {
  id: '1',
  full_name: 'ユーザー名',
  about: '自己紹介文がありません',
  website_url: '',
  profile_image_url: 'https://via.placeholder.com/150?text=No+Image',
  headline: '',
  location: '',
  industry: '',
  background_image_url: '',
  skills: [], // Add this line
};

type InputLogData = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
};

type TagRanking = {
  id: string;
  name: string;
  count: number;
};

type Career = {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string;
  description?: string; // Add this line
};

import type { InputLog } from "./InputLogCard";

export function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputLogs, setInputLogs] = useState<InputLogData[]>([]);
  const [tagRankings, setTagRankings] = useState<TagRanking[]>([]);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [careers, setCareers] = useState<Career[]>([]); // Add this line

  const fetchInputLogs = async () => {
    try {
      const { data: inputLogsData, error: inputLogsError } = await supabase
        .from('input_logs')
        .select('*')
        .eq('user_id', String(id))
        .order('created_at', { ascending: false });
      if (inputLogsError) {
        console.error('インプットログ取得エラー:', inputLogsError);
        return;
      }
      setInputLogs(inputLogsData);
    } catch (err) {
      console.error('インプットログ取得エラー:', err);
    }
  };

  const fetchTagRankings = async () => {
    try {
      const { data: tagRankingsData, error: tagRankingsError } = await supabase
        .from('tag_rankings')
        .select('*')
        .eq('user_id', String(id))
        .order('count', { ascending: false });
      if (tagRankingsError) {
        console.error('タグランキング取得エラー:', tagRankingsError);
        return;
      }
      setTagRankings(tagRankingsData);
    } catch (err) {
      console.error('タグランキング取得エラー:', err);
    }
  };

  const fetchCareers = async () => {
    try {
      const { data: careersData, error: careersError } = await supabase
        .from('careers')
        .select('*')
        .eq('user_id', String(id));
      if (careersError) {
        console.error('キャリア取得エラー:', careersError);
        return;
      }
      setCareers(careersData);
    } catch (err) {
      console.error('キャリア取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchInputLogs();
    fetchTagRankings();
    fetchCareers(); // Add this line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchProfile = async () => {
      try {
        if (!id) {
          setError('プロフィールIDが見つかりません');
          setLoading(false);
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', String(id))
          .single();
        if (profileError) {
          console.error('プロフィール取得エラー:', profileError);
          setError('プロフィールの取得に失敗しました');
          setLoading(false);
          return;
        }
        setProfile(profileData);
        setLoading(false);
      } catch (err) {
        console.error('プロフィールページ全体の読み込みに失敗しました:', err);
        setError('プロフィールの読み込みに失敗しました');
        setProfile(dummyProfile);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const convertToInputLog = (log: InputLogData): InputLog => ({
    id: log.id,
    type: "", // 必要に応じて型情報を追加
    title: log.title,
    createdAt: log.created_at,
    imageUrl: log.image_url,
    description: log.description,
    // 他フィールドは空でOK
  });

  const tagRankingToList = (tags: TagRanking[]): { name: string; value: number }[] =>
    tags.map((tag) => ({ name: tag.name, value: tag.count }));

  type CareerWithOptional = Career & { department?: string; is_current_position?: boolean };

  // CareerSection用の型に合わせて整形
  const toCareerSectionType = (career: CareerWithOptional) => ({
    id: career.id,
    company: career.company_name,
    position: career.job_title,
    department: career.department ?? "",
    start_date: career.start_date,
    end_date: career.end_date,
    is_current_position:
      typeof career.is_current_position === "boolean"
        ? career.is_current_position
        : !career.end_date,
    description: career.description || '',
  });

  const isCurrentUser = false; // 必要に応じてロジック化

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        <span className="ml-4 text-gray-500">読み込み中...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
        <span className="text-red-500">{error}</span>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex justify-center items-center h-96 text-gray-400">
        プロフィール情報がありません
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* --- 基本プロフィール --- */}
      <div className="flex items-center gap-6 mb-8">
        <img
          src={profile.profile_image_url || '/noavatar.png'}
          alt={profile.full_name}
          className="w-24 h-24 rounded-full object-cover border shadow"
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
          <p className="text-gray-600 mt-2">{profile.about}</p>
          {profile.headline && (
            <div className="text-sm text-indigo-600 mt-1">{profile.headline}</div>
          )}
          {(profile.location || profile.industry) && (
            <div className="text-xs text-gray-500 mt-1">
              {[profile.location, profile.industry].filter(Boolean).join(' / ')}
            </div>
          )}
          {isCurrentUser && (
            <button
              className="mt-2 px-4 py-1 rounded bg-indigo-500 text-white text-xs hover:bg-indigo-600"
              onClick={() => window.location.href = '/profile/edit'}
            >
              プロフィール編集
            </button>
          )}
        </div>
      </div>

      {/* --- 自己紹介 --- */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">自己紹介</h3>
        <div className="text-gray-800 whitespace-pre-line bg-gray-50 rounded p-4 border border-gray-100">
          {profile.about ? profile.about : '自己紹介文が登録されていません。'}
        </div>
      </div>

      {/* --- できること・スキルセット --- */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">できること</h3>
        {profile.skills && profile.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <li key={skill} className="bg-indigo-100 text-indigo-700 rounded px-2 py-1 text-xs">{skill}</li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400">できること（スキル）が登録されていません。</div>
        )}
      </div>

      {/* --- キャリア --- */}
      <CareerSection careers={careers.map(toCareerSectionType)} isCurrentUser={isCurrentUser} />

      {/* --- AI分析 --- */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {inputLogs.map((log) => (
          <InputLogCard key={log.id} log={convertToInputLog(log)} />
        ))}
      </div>
      <div className="mb-8">
        <TagRankingList tags={tagRankingToList(tagRankings)} />
      </div>
      <div className="flex justify-center items-center h-96">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setFollowModalOpen(true)}
        >
          フォローする
        </button>
        <FollowListModal
          open={followModalOpen}
          onOpenChange={setFollowModalOpen}
          userId={profile.id}
        />
      </div>
    </div>
  );
}

export default Profile;