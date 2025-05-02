import { Link, useNavigate } from "react-router-dom";
import { Home, User, PlusCircle, LogOut } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { label: "ホーム", href: "/", icon: <Home className="w-5 h-5" /> },
    { label: "マイページ", href: "/mypage", icon: <User className="w-5 h-5" /> },
    { label: "作品を追加", href: "/works/add", icon: <PlusCircle className="w-5 h-5" /> },
    { label: "ログアウト", href: "/logout", icon: <LogOut className="w-5 h-5" /> },
  ];
  return (
    <nav className="flex flex-col gap-4 items-center py-4 h-full">
      {/* ロゴ */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate("/")}> 
        <span className="text-2xl font-bold text-indigo-700">Balubo</span>
      </div>
      {/* ナビゲーションリンク */}
      <ul className="flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => (
          <li key={item.href} className="w-full">
            <Link to={item.href} className="flex flex-col items-center text-gray-700 hover:text-indigo-600 transition-colors">
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
