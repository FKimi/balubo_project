import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User } from "lucide-react";

const navItems = [
  {
    label: "Home",
    icon: Home,
    path: "/user/home",
  },
  {
    label: "Search",
    icon: Search,
    path: "/search",
  },
  {
    label: "Add",
    icon: Plus,
    path: "/user/works/create",
    isCenter: true,
  },
  {
    label: "Messages",
    icon: MessageSquare,
    path: "/messages",
  },
  {
    label: "Portfolio",
    icon: User,
    path: "/portfolio",
  },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-between items-center bg-white border-t border-gray-200 z-40 md:hidden shadow">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        if (item.isCenter) {
          return (
            <button
              key={item.label}
              aria-label={item.label}
              onClick={() => navigate(item.path)}
              className="relative -mt-6 flex flex-col items-center justify-center bg-indigo-500 text-white rounded-full h-16 w-16 shadow-lg border-4 border-white z-10 hover:bg-indigo-600 transition"
              style={{
                boxShadow: "0 4px 16px 0 rgba(99,102,241,0.12)",
              }}
            >
              <Icon className="h-8 w-8 mb-1" />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          );
        }
        return (
          <button
            key={item.label}
            aria-label={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 px-2 py-2 ${isActive ? "text-indigo-600" : "text-gray-500"} hover:text-indigo-700 transition`}
          >
            <Icon className="h-6 w-6 mb-0.5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
