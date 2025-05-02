import React, { useState, useEffect } from "react";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { searchCreators, CreatorProfile } from "@/lib/utils/searchCreators";
import NoAvatar from "@/components/ui/NoAvatar";

/**
 * クリエイター（ユーザー）検索ページ
 */
const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreatorProfile[]>([]);
  const [error, setError] = useState("");

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

  // 検索ワードをハイライトするユーティリティ
  function highlightText(text: string, query: string) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-indigo-900 rounded px-1">{part}</mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* メイン */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto py-10 px-6">
          <h1 className="text-2xl font-extrabold mb-8 text-center text-indigo-700 tracking-tight">クリエイター検索</h1>
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-xl mx-auto mb-10 bg-white rounded-xl shadow px-6 py-4 border border-gray-100 items-stretch sm:items-end"
          >
            <div className="flex-1">
              <FormInput
                label="キーワード"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="名前・スキル・業種などで検索"
                className="w-full"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md shadow min-w-[72px] h-10 mt-2 sm:mt-0"
              aria-label="検索"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "検索"}
            </Button>
          </form>
          {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
          {loading && <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-gray-400" /></div>}
          {!loading && results.length === 0 && (
            <div className="text-gray-500 text-center py-10">該当するクリエイターが見つかりませんでした</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
            {results.map((user) => (
              <button
                key={user.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center hover:shadow-2xl transition border border-gray-100 group focus:outline-none focus:ring-2 focus:ring-indigo-400 relative w-full cursor-pointer"
                onClick={() => window.location.href = `/profile/${user.id}`}
                tabIndex={0}
                aria-label={`${user.full_name || 'プロフィール'}を見る`}
              >
                <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-100 to-green-100 border-2 border-indigo-100 group-hover:scale-105 transition-transform">
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.full_name || "No Name"}
                      className="w-14 h-14 rounded-full object-cover border border-white shadow-sm"
                    />
                  ) : (
                    <NoAvatar size={56} />
                  )}
                </div>
                <div className="font-semibold text-base mb-1 text-gray-900 text-center group-hover:text-indigo-700 transition-colors">
                  {highlightText(user.full_name || "No Name", query)}
                </div>
                {user.headline && <div className="text-xs text-indigo-600 mb-1 text-center">{highlightText(user.headline, query)}</div>}
                {(user.location || user.industry) && (
                  <div className="text-xs text-gray-500 mb-1 text-center">
                    {[user.location, user.industry].filter(Boolean).join(" / ")}
                  </div>
                )}
                {user.about && <div className="text-xs text-gray-600 mb-2 text-center line-clamp-2 min-h-[2.5em]">{highlightText(user.about, query)}</div>}
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {user.skills && user.skills.map((skill, idx) => (
                    <span key={`${skill}-${idx}`} className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs">{highlightText(skill, query)}</span>
                  ))}
                </div>
                <span className="absolute inset-0" tabIndex={-1} aria-hidden="true"></span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSearchPage;
