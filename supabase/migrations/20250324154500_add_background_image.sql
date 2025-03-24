-- プロファイルテーブルが存在しない場合は作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            username TEXT UNIQUE,
            full_name TEXT,
            avatar_url TEXT,
            website TEXT,
            profile_image_url TEXT,
            background_image_url TEXT
        );

        -- RLSを有効化
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- ポリシーを作成
        CREATE POLICY "プロフィールは本人のみ編集可能" 
        ON public.profiles FOR ALL 
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

        -- 匿名ユーザーに閲覧権限を付与
        CREATE POLICY "プロフィールは全員が閲覧可能" 
        ON public.profiles FOR SELECT 
        TO anon
        USING (true);
    ELSE
        -- 既存のprofilesテーブルにbackground_image_urlカラムを追加
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS background_image_url TEXT;

        -- 既にprofile_image_urlが存在しない場合は追加
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'profile_image_url'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN profile_image_url TEXT;
        END IF;
    END IF;
END $$;

-- バケットが存在するか確認するための関数を作成
CREATE OR REPLACE FUNCTION storage.bucket_exists(bucket_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = bucket_name
    );
END;
$$ LANGUAGE plpgsql;

-- backgroundsバケットを作成
DO $$
BEGIN
    -- backgroundsバケットが存在しない場合は作成
    IF NOT storage.bucket_exists('backgrounds') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('backgrounds', 'backgrounds', true);
        
        -- バケットのRLSポリシーを設定
        -- 認証済みユーザーは自分のファイルをアップロード、更新、削除可能
        CREATE POLICY "背景画像は認証済みユーザーがアップロード可能" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        CREATE POLICY "ユーザーは自分の背景画像のみ更新可能" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        CREATE POLICY "ユーザーは自分の背景画像のみ削除可能" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        -- 全員が背景画像を閲覧可能
        CREATE POLICY "背景画像は全員が閲覧可能" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'backgrounds');
    END IF;
    
    -- avatarsバケットが存在しない場合も作成
    IF NOT storage.bucket_exists('avatars') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
        
        -- バケットのRLSポリシーを設定
        -- 認証済みユーザーは自分のファイルをアップロード、更新、削除可能
        CREATE POLICY "プロフィール画像は認証済みユーザーがアップロード可能" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        CREATE POLICY "ユーザーは自分のプロフィール画像のみ更新可能" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        CREATE POLICY "ユーザーは自分のプロフィール画像のみ削除可能" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
        
        -- 全員がプロフィール画像を閲覧可能
        CREATE POLICY "プロフィール画像は全員が閲覧可能" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'avatars');
    END IF;
END $$;
