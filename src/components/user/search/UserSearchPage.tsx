import React, { useState, useEffect } from "react";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Loader2, Search, MapPin, Briefcase } from "lucide-react";
import { searchCreators, CreatorProfile } from "@/lib/utils/searchCreators";
import NoAvatar from "@/components/ui/NoAvatar";
import { useNavigate } from "react-router-dom";

/**
 * クリエイター（ユーザー）検索ページ
 */
const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreatorProfile[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 検索実行
  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await searchCreators(query);
      setResults(data);
    } catch {
      setError("検索中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(); // 初回ロード時に全ユーザー表示
    // eslint-disable-next-line
  }, []);

  // プロフィールページに遷移する関数
  const handleProfileClick = (userId: string) => {
    navigate(`/creator/${userId}`);
  };

  // 検索ワードをハイライトするユーティリティ
  function highlightText(text: string, query: string) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-100 text-indigo-900 rounded px-1">{part}</mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* メイン */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              クリエイター検索
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              あなたのプロジェクトに最適なクリエイターを見つけましょう
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto mb-16"
          >
            <div className="relative flex items-center">
              <div className="absolute left-4 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="名前・スキル・業種などで検索"
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading}
                className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "検索"}
              </Button>
            </div>
          </form>

          {error && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 text-red-600 rounded-xl text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-12 h-12 text-indigo-500" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-xl text-gray-600">該当するクリエイターが見つかりませんでした</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleProfileClick(user.id)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 flex flex-col items-center relative overflow-hidden"
                tabIndex={0}
                aria-label={`${user.full_name || 'プロフィール'}を見る`}
              >
                <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border-2 border-indigo-50 group-hover:scale-105 transition-transform duration-300">
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.full_name || "No Name"}
                      className="w-18 h-18 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <NoAvatar size={72} />
                  )}
                </div>

                <div className="text-center space-y-2 w-full">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {highlightText(user.full_name || "No Name", query)}
                  </h3>
                  
                  {user.headline && (
                    <p className="text-sm text-indigo-600 font-medium">
                      {highlightText(user.headline, query)}
                    </p>
                  )}

                  {(user.location || user.industry) && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      {user.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {user.location}
                        </span>
                      )}
                      {user.industry && (
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {user.industry}
                        </span>
                      )}
                    </div>
                  )}

                  {user.about && (
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5em]">
                      {highlightText(user.about, query)}
                    </p>
                  )}

                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {user.skills.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {highlightText(skill, query)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/10 group-hover:via-indigo-50/5 group-hover:to-indigo-50/0 transition-all duration-300" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSearchPage;
