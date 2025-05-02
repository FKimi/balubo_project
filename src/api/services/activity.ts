import { supabase } from "../../lib/supabase";
import { ActivityData } from "../../components/user/portfolio/ActivityChart";

export type ActivityType = "投稿" | "コメント" | "いいね";

export async function fetchUserActivity(
  userId: string,
  range: "7d" | "30d" | "90d",
  type: ActivityType | "全て"
): Promise<ActivityData[]> {
  // 日付範囲の計算
  const now = new Date();
  const from = new Date(now);
  if (range === "7d") from.setDate(now.getDate() - 6);
  if (range === "30d") from.setDate(now.getDate() - 29);
  if (range === "90d") from.setDate(now.getDate() - 89);
  const fromDate = from.toISOString().slice(0, 10);

  let query = supabase
    .from("user_activity")
    .select("date, type, count")
    .eq("user_id", userId)
    .gte("date", fromDate);
  if (type !== "全て") {
    query = query.eq("type", type);
  }
  const { data, error } = await query;
  if (error) return [];
  // 日付ごとに集計
  const result: Record<string, number> = {};
  data.forEach((row: { date: string; count: number }) => {
    result[row.date] = (result[row.date] || 0) + row.count;
  });
  // レンジ内の日付をすべて出力
  const out: ActivityData[] = [];
  for (const d = new Date(from); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    out.push({ date: dateStr, count: result[dateStr] || 0 });
  }
  return out;
}

// 年月ごとの作品投稿数を取得するAPI
export async function fetchWorkPostActivityByMonth(
  userId: string,
  months: number = 12
): Promise<{ ym: string; count: number }[]> {
  // 今月から過去Nヶ月分の年月リストを生成
  const now = new Date();
  const ymList: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    ymList.unshift(ym);
  }
  // Supabaseから該当ユーザー・年月ごとの投稿数を取得
  const fromYm = ymList[0] + "-01";
  const { data, error } = await supabase
    .from("works")
    .select("id, created_at")
    .eq("user_id", userId)
    .gte("created_at", fromYm);
  if (error || !data) return [];
  // 年月ごとに集計
  const result: Record<string, number> = {};
  data.forEach((row: { created_at: string }) => {
    const d = new Date(row.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result[ym] = (result[ym] || 0) + 1;
  });
  // 投稿履歴がある年月のみ返却
  return Object.entries(result).map(([ym, count]) => ({ ym, count }));
}
