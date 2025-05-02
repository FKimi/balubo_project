import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import supabaseAdmin from '../../lib/supabase-admin';

// 接続テスト状態の型定義
interface ConnectionStatus {
  status: 'untested' | 'testing' | 'success' | 'failed';
  error?: string;
  details?: string;
}

interface SupabaseConnectionTestProps {
  initialStatus?: {
    supabase: 'untested' | 'success' | 'failed';
    supabaseAdmin: 'untested' | 'success' | 'failed';
    error?: string;
  };
}

/**
 * Supabase接続テストコンポーネント
 * 接続状態とエラーを詳細に表示します
 */
export function SupabaseConnectionTest({ initialStatus }: SupabaseConnectionTestProps = {}) {
  const [normalStatus, setNormalStatus] = useState<ConnectionStatus>({ 
    status: initialStatus?.supabase === 'failed' ? 'failed' : 
            initialStatus?.supabase === 'success' ? 'success' : 'untested',
    error: initialStatus?.error
  });

  const [adminStatus, setAdminStatus] = useState<ConnectionStatus>({ 
    status: initialStatus?.supabaseAdmin === 'failed' ? 'failed' : 
            initialStatus?.supabaseAdmin === 'success' ? 'success' : 'untested',
    error: initialStatus?.error
  });

  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  // 環境変数の収集
  useEffect(() => {
    try {
      // Vite環境変数を収集
      const env = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Not set',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
        VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set',
        VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? 'Set (hidden)' : 'Not set',
      };
      
      setEnvVars(env);
    } catch (error) {
      console.error('環境変数収集中にエラー:', error);
    }
  }, []);

  // 通常Supabaseクライアントのテスト
  const testNormalConnection = async () => {
    setNormalStatus({ status: 'testing' });
    try {
      // 詳細なログ
      console.log('通常Supabase接続テスト開始');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('ANON_KEY存在:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

      // シンプルなクエリを実行（詳細なエラー情報を取得するため）
      const { data, error } = await supabase
        .from('profiles')
        .select('count()', { count: 'exact', head: true });

      if (error) {
        console.error('通常Supabase接続エラー:', error);
        setNormalStatus({ 
          status: 'failed', 
          error: error.message,
          details: JSON.stringify(error, null, 2)
        });
      } else {
        console.log('通常Supabase接続成功:', data);
        setNormalStatus({ 
          status: 'success',
          details: JSON.stringify(data, null, 2)
        });
      }
    } catch (error) {
      console.error('通常Supabase接続例外:', error);
      setNormalStatus({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error),
        details: JSON.stringify(error, null, 2)
      });
    }
  };

  // 管理者Supabaseクライアントのテスト
  const testAdminConnection = async () => {
    setAdminStatus({ status: 'testing' });
    try {
      // 詳細なログ
      console.log('管理者Supabase接続テスト開始');
      
      // シンプルなクエリを実行
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count()', { count: 'exact', head: true });

      if (error) {
        console.error('管理者Supabase接続エラー:', error);
        setAdminStatus({ 
          status: 'failed', 
          error: error.message,
          details: JSON.stringify(error, null, 2)
        });
      } else {
        console.log('管理者Supabase接続成功:', data);
        setAdminStatus({ 
          status: 'success',
          details: JSON.stringify(data, null, 2)
        });
      }
    } catch (error) {
      console.error('管理者Supabase接続例外:', error);
      setAdminStatus({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error),
        details: JSON.stringify(error, null, 2)
      });
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#3182ce' }}>Supabase接続テスト</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <h2>環境変数</h2>
        <pre style={{ 
          backgroundColor: '#f7fafc',
          padding: '12px',
          borderRadius: '6px',
          overflow: 'auto'
        }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <h2>通常Supabase接続</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ marginRight: '12px' }}>ステータス:</span>
          {normalStatus.status === 'untested' && <span>未テスト</span>}
          {normalStatus.status === 'testing' && <span>テスト中...</span>}
          {normalStatus.status === 'success' && <span style={{ color: 'green' }}>✓ 成功</span>}
          {normalStatus.status === 'failed' && <span style={{ color: 'red' }}>✗ 失敗</span>}
          
          <button
            onClick={testNormalConnection}
            style={{
              marginLeft: '12px',
              padding: '6px 12px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            テスト実行
          </button>
        </div>
        
        {normalStatus.error && (
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ color: 'red' }}>エラー</h3>
            <p>{normalStatus.error}</p>
            {normalStatus.details && (
              <pre style={{ 
                backgroundColor: '#f7fafc',
                padding: '12px',
                borderRadius: '6px',
                overflow: 'auto'
              }}>
                {normalStatus.details}
              </pre>
            )}
          </div>
        )}
        
        {normalStatus.status === 'success' && normalStatus.details && (
          <div style={{ marginTop: '12px' }}>
            <h3>結果</h3>
            <pre style={{ 
              backgroundColor: '#f7fafc',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto'
            }}>
              {normalStatus.details}
            </pre>
          </div>
        )}
      </div>
      
      <div>
        <h2>管理者Supabase接続</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ marginRight: '12px' }}>ステータス:</span>
          {adminStatus.status === 'untested' && <span>未テスト</span>}
          {adminStatus.status === 'testing' && <span>テスト中...</span>}
          {adminStatus.status === 'success' && <span style={{ color: 'green' }}>✓ 成功</span>}
          {adminStatus.status === 'failed' && <span style={{ color: 'red' }}>✗ 失敗</span>}
          
          <button
            onClick={testAdminConnection}
            style={{
              marginLeft: '12px',
              padding: '6px 12px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            テスト実行
          </button>
        </div>
        
        {adminStatus.error && (
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ color: 'red' }}>エラー</h3>
            <p>{adminStatus.error}</p>
            {adminStatus.details && (
              <pre style={{ 
                backgroundColor: '#f7fafc',
                padding: '12px',
                borderRadius: '6px',
                overflow: 'auto'
              }}>
                {adminStatus.details}
              </pre>
            )}
          </div>
        )}
        
        {adminStatus.status === 'success' && adminStatus.details && (
          <div style={{ marginTop: '12px' }}>
            <h3>結果</h3>
            <pre style={{ 
              backgroundColor: '#f7fafc',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto'
            }}>
              {adminStatus.details}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
