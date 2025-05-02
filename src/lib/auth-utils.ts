import { supabase } from './supabase';

interface UserProfileData {
  id: string;
  full_name: string;
  email?: string | null;
  profile_image_url?: string | null;
  subscription_tier?: number;
}

export async function createUserProfile(data: UserProfileData) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        profile_image_url: data.profile_image_url,
        subscription_tier: data.subscription_tier || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}