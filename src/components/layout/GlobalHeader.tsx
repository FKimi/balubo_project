import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  User,
  BarChart2,
  LogOut,
  Pencil,
  Bell,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";

// 一時的にGallery, Messages, Settingsをヘッダーから除外
const navItems = [
  { label: "Home", path: "/user/home", icon: Home },
  { label: "Search", path: "/search", icon: Search },
  { label: "Portfolio", path: "/portfolio", icon: User },
  // { label: "Gallery", path: "/gallery", icon: Image }, // 一時非表示
  { label: "AI Dashboard", path: "/dashboard", icon: BarChart2 },
  // { label: "Messages", path: "/messages", icon: MessageSquare }, // 一時非表示
  // { label: "Settings", path: "/settings", icon: Settings }, // 一時非表示
];

const GlobalHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ログアウト処理（仮実装）
  const handleLogout = () => {
    alert("ログアウトしました（ダミー）");
    navigate("/login");
  };

  // 通知ベルクリック時
  const handleNotificationClick = () => {
    alert("通知機能は今後実装予定です");
  };

  return (
    <header className="w-full h-14 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-200 shadow-sm z-50 fixed top-0 left-0">
      {/* ロゴ */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <Link
          to="/user/home"
          className="text-2xl font-extrabold text-indigo-700 tracking-wide select-none leading-none font-logo hover:text-indigo-800 transition"
          aria-label="ホームへ"
        >
          balubo
        </Link>
      </div>
      {/* ナビゲーション（PCのみ表示） */}
      <nav className="hidden md:flex items-center gap-1 mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"}`}
              style={{ minWidth: 90, justifyContent: 'center' }}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-gray-500"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* 右側：通知ベル＋ユーザーアイコン＋メニュー */}
      <div className="flex items-center gap-2 min-w-[80px] justify-end">
        <button
          className="relative rounded-full p-2 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="通知"
          onClick={handleNotificationClick}
          type="button"
        >
          <Bell className="h-6 w-6 text-indigo-500" />
          {/* 通知バッジ例（未読数）
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
          */}
        </button>
        <DropdownMenu
          trigger={
            <span>
              <User className="h-6 w-6 text-indigo-700" />
            </span>
          }
        >
          <DropdownMenuItem icon={<User className="h-4 w-4 text-indigo-600" />} onClick={() => navigate("/portfolio")}>マイページ</DropdownMenuItem>
          <DropdownMenuItem icon={<Pencil className="h-4 w-4 text-indigo-600" />} onClick={() => navigate("/profile/edit")}>プロフィール編集</DropdownMenuItem>
          <DropdownMenuItem icon={<LogOut className="h-4 w-4 text-red-500" />} onClick={handleLogout}>ログアウト</DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default GlobalHeader;
