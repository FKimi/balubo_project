import { supabase } from "@/lib/supabase";

export type CreatorProfile = {
  id: string;
  full_name: string;
  headline?: string | null;
  location?: string | null;
  industry?: string | null;
  about?: string;
  skills?: string[];
  profile_image_url?: string;
  website_url?: string;
  background_image_url?: string | null;
};

/**
 * クリエイター情報を名前・スキル・業種などで検索
 */
export async function searchCreators(query: string): Promise<CreatorProfile[]> {
  let base = supabase
    .from("profiles")
    .select("id, full_name, headline, location, industry, about, skills, profile_image_url, website_url, background_image_url")
    .order("full_name", { ascending: true });

  if (query) {
    base = base.or(
      `full_name.ilike.%${query}%,skills.cs.{${query}},industry.ilike.%${query}%,headline.ilike.%${query}%`
    );
  }

  const { data, error } = await base;
  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    ...item,
    skills: Array.isArray(item.skills) ? item.skills : [],
  }));
}
