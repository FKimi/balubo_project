/**
 * ユーザーデータ移行スクリプト
 * 
 * このスクリプトは、usersテーブルからprofilesテーブルへデータを移行します。
 * 実行前に必ずデータベースのバックアップを取得してください。
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// Supabaseクライアントの初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // サービスロールキーを使用

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません。.envファイルを確認してください。');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Using service role key for authentication');

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * usersテーブルからprofilesテーブルへデータを移行する関数
 */
async function migrateUsersToProfiles() {
  console.log('データ移行を開始します...');

  try {
    // usersテーブルのデータを取得
    console.log('usersテーブルからデータを取得中...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      throw new Error(`usersテーブルの取得に失敗しました: ${usersError.message}`);
    }
    
    console.log('取得したデータ:', users);
    
    if (!users || users.length === 0) {
      console.log('移行するユーザーデータがありません。');
      return;
    }
    
    console.log(`${users.length}人のユーザーデータを移行します...`);
    
    // 各ユーザーについて処理
    for (const user of users) {
      // 既存のプロファイルを確認
      console.log(`ユーザーID: ${user.id} のプロファイルを確認中...`);
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (existingProfile) {
        // 既存のプロファイルを更新
        console.log(`ユーザーID: ${user.id} のプロファイルを更新します...`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: user.name || existingProfile.full_name,
            about: user.bio || existingProfile.about,
            website_url: user.website_url || existingProfile.website_url,
            avatar_url: user.profile_image_url || existingProfile.avatar_url,
            background_image_url: user.background_image_url || existingProfile.background_image_url,
            twitter_username: user.twitter_username || existingProfile.twitter_username,
            instagram_username: user.instagram_username || existingProfile.instagram_username,
            facebook_username: user.facebook_username || existingProfile.facebook_username,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`ユーザーID: ${user.id} の更新に失敗しました:`, updateError);
        } else {
          console.log(`ユーザーID: ${user.id} の更新が完了しました`);
        }
      } else {
        // 新規プロファイルを作成
        console.log(`ユーザーID: ${user.id} の新規プロファイルを作成します...`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.name || '',
            about: user.bio || '',
            website_url: user.website_url || '',
            avatar_url: user.profile_image_url || '',
            background_image_url: user.background_image_url || '',
            twitter_username: user.twitter_username || '',
            instagram_username: user.instagram_username || '',
            facebook_username: user.facebook_username || '',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`ユーザーID: ${user.id} の作成に失敗しました:`, insertError);
        } else {
          console.log(`ユーザーID: ${user.id} の作成が完了しました`);
        }
      }
    }
    
    console.log('データ移行が完了しました！');
    console.log('注意: 移行が正常に完了したことを確認してから、usersテーブルを削除してください。');
    
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトの実行
migrateUsersToProfiles()
  .then(() => {
    console.log('スクリプトの実行が完了しました。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
