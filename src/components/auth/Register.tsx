import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';
import { Container } from '../../components/Container';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { FormInput } from '../../components/FormInput';
import { Alert } from '../../components/Alert';
import { Mail, Lock, Chrome } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { createUserProfile } from '../../lib/auth-utils';

export function Register() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (user && !profile) {
        try {
          console.log('Creating profile for user:', user.id);
          
          const newProfile = await createUserProfile({
            id: user.id,
            full_name: user.user_metadata?.name || name || 'ユーザー',
            email: user.email,
            profile_image_url: user.user_metadata?.avatar_url || null,
            subscription_tier: 0,
          });

          if (!newProfile) {
            setError('プロファイルの作成に失敗しました');
            return;
          }

          await refreshProfile();
          
          navigate('/portfolio');
        } catch (err) {
          console.error('Error in profile creation:', err);
          setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
        }
      } else if (user && profile) {
        navigate('/portfolio');
      }
    };

    createProfileIfNeeded();
  }, [user, profile, navigate, name, refreshProfile]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: existingUsers, error: emailCheckError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (emailCheckError) {
        console.error('Error checking existing email:', emailCheckError);
      }

      if (existingUsers) {
        setError('このメールアドレスは既に登録されています。ログインページからログインしてください。');
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('ユーザー登録に失敗しました');
      }

      const newProfile = await createUserProfile({
        id: authData.user.id,
        full_name: name,
        email,
        subscription_tier: 0,
      });

      if (!newProfile) {
        await supabase.auth.signOut();
        throw new Error('プロファイルの作成に失敗しました');
      }

      await refreshProfile();

      navigate('/portfolio');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Googleログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900">
                Baluboへようこそ
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                アカウントを作成して、ポートフォリオ作成を始めましょう
              </p>
            </div>

            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <FormInput
                label="名前"
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="あなたの名前"
              />
              <FormInput
                label="メールアドレス"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />
              <FormInput
                label="パスワード"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8文字以上のパスワード"
                icon={<Lock className="h-5 w-5 text-gray-400" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? '登録中...' : 'アカウント作成'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full flex items-center justify-center"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <Chrome className="h-5 w-5 mr-2" />
                  Googleで登録
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちですか？{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  ログイン
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}