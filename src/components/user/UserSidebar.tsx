import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  User,
  Image,
  BarChart2,
  MessageSquare,
  Settings,
  Plus,
  X
} from 'lucide-react';

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  return (
    <div
      className={
        `w-64 bg-white border-r border-gray-200 h-full transition-transform duration-300 ease-in-out transform
         fixed top-0 left-0 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
         md:relative md:translate-x-0 md:border-r`
      }
    >
      {/* 左上ロゴ＋閉じるボタン */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-indigo-50 rounded-br-2xl shadow-sm">
        <Link to="/user/home" aria-label="ホームへ" role="link" tabIndex={0} className="focus:outline-none">
          <span className="text-2xl font-extrabold text-indigo-700 tracking-wide select-none leading-none font-logo">balubo</span>
        </Link>
        {/* 閉じるボタン（スマホのみ） */}
        <button
          className="md:hidden p-1 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={onClose}
          aria-label="メニューを閉じる"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      {/* --- 既存のナビゲーション・ボタン等 --- */}
      <nav className="mt-6 px-4">
        <div className="space-y-1">
          <Link to="/user/home" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <Home className="mr-3 h-5 w-5 text-gray-500" />
            Home
          </Link>
          <Link to="/search" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <Search className="mr-3 h-5 w-5 text-gray-500" />
            Search
          </Link>
          <Link to="/portfolio" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <User className="mr-3 h-5 w-5 text-gray-500" />
            Portfolio
          </Link>
          <Link to="/gallery" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <Image className="mr-3 h-5 w-5 text-gray-500" />
            Gallery
          </Link>
          <Link to="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <BarChart2 className="mr-3 h-5 w-5 text-gray-500" />
            AI Dashboard
          </Link>
          <Link to="/messages" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <MessageSquare className="mr-3 h-5 w-5 text-gray-500" />
            Messages
          </Link>
        </div>
        <div className="pt-5 mt-5 border-t border-gray-200">
          <Link to="/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100">
            <Settings className="mr-3 h-5 w-5 text-gray-500" />
            Settings
          </Link>
        </div>
      </nav>
      <div className="absolute bottom-0 left-0 w-full px-4 pb-6">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow transition text-base"
          onClick={() => navigate('/user/works/create')}
        >
          <Plus className="h-5 w-5" />
          Add New Work
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
