import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './dialog';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Loader2 } from 'lucide-react';

interface FollowListModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'following' | 'followers';
}

const TABS = [
  { key: 'following', label: 'フォロー中' },
  { key: 'followers', label: 'フォロワー' }
];

export const FollowListModal: React.FC<FollowListModalProps> = ({ userId, open, onOpenChange, initialTab = 'following' }) => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(initialTab);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let followQuery, ids: string[] = [];
    if (activeTab === 'following') {
      followQuery = await supabase.from('follows').select('followed_id').eq('follower_id', userId);
      ids = (followQuery.data || []).map((f: any) => f.followed_id);
    } else {
      followQuery = await supabase.from('follows').select('follower_id').eq('followed_id', userId);
      ids = (followQuery.data || []).map((f: any) => f.follower_id);
    }
    if (ids.length === 0) {
      setUsers([]); setLoading(false); return;
    }
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    setUsers(profiles || []);
    setLoading(false);
  }, [activeTab, userId]);

  useEffect(() => { if (open) fetchUsers(); }, [open, activeTab, fetchUsers]);
  useEffect(() => { if (open) setActiveTab(initialTab); }, [open, initialTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>{TABS.find(t => t.key === activeTab)?.label}</DialogTitle>
          <div className="flex gap-4 mt-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`px-2 py-1 rounded ${activeTab === tab.key ? 'font-bold border-b-2 border-black' : 'text-gray-500'}`}
                onClick={() => setActiveTab(tab.key as 'following' | 'followers')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>
        <div className="mt-4 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400 py-8">ユーザーがいません</div>
          ) : (
            <ul>
              {users.map(user => (
                <li key={user.id} className="flex items-center gap-3 py-3 border-b">
                  <img src={user.profile_image_url || '/noavatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-semibold">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.about?.slice(0, 40)}</div>
                  </div>
                  {/* TODO: フォロー/アンフォローボタン実装可 */}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogClose asChild>
          <button className="absolute top-2 right-2 text-gray-400 hover:text-black">×</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListModal;
