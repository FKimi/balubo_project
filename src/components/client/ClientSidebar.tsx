import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  Users, 
  MessageSquare, 
  LineChart, 
  Settings,
  HelpCircle,
  LogOut,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ClientSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/client/login');
  };

  return (
    <aside className="bg-white h-screen w-64 border-r border-gray-200 fixed left-0 top-0 z-10">
      {/* ロゴ */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-600">balubo</h1>
        <p className="text-sm text-gray-500">企業アカウント</p>
      </div>
      
      {/* ナビゲーションメニュー */}
      <nav className="py-6">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/client/home" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Home className="h-5 w-5 mr-3" />
              ホーム
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/dashboard" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Home className="h-5 w-5 mr-3" />
              ダッシュボード
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/projects" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Briefcase className="h-5 w-5 mr-3" />
              案件管理
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/creators" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Users className="h-5 w-5 mr-3" />
              クリエイター検索
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/messages" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              メッセージ
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/analytics" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <LineChart className="h-5 w-5 mr-3" />
              分析・レポート
            </NavLink>
          </li>
        </ul>
        
        {/* 区切り線 */}
        <div className="my-6 border-t border-gray-200"></div>
        
        {/* 設定・ヘルプ */}
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/client/profile" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Building className="h-5 w-5 mr-3" />
              企業プロフィール
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/settings" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <Settings className="h-5 w-5 mr-3" />
              設定
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/client/help" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-gray-700 ${isActive ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'hover:bg-gray-50'}`
              }
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              ヘルプ・サポート
            </NavLink>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5 mr-3" />
              ログアウト
            </button>
          </li>
        </ul>
      </nav>
      
      {/* 新規案件作成ボタン */}
      <div className="px-4 mt-6">
        <button
          onClick={() => navigate('/client/project/new')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-md flex items-center justify-center"
        >
          <span className="mr-2">+</span> 新規案件作成
        </button>
      </div>
    </aside>
  );
};

export default ClientSidebar; 