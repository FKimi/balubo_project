// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Headers } from 'https://deno.land/std@0.168.0/http/header.ts'

// CORSヘッダーを設定する関数
function setCorsHeaders(headers: Headers): Headers {
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return headers
}

// ヘッダーオブジェクトを作成する関数
function createHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  
  return headers
}

// メインのサーブ関数
serve(async (req) => {
  // OPTIONSリクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: createHeaders()
    })
  }

  try {
    // URLパラメータからターゲットURLを取得
    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')

    // URLパラメータが存在しない場合はエラー
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'URLパラメータが必要です' }),
        {
          status: 400,
          headers: createHeaders('application/json')
        }
      )
    }

    // 外部リソースへのリクエスト
    const response = await fetch(targetUrl)

    // レスポンスが成功しなかった場合
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: '外部リソースの取得に失敗しました', 
          status: response.status,
          statusText: response.statusText 
        }),
        {
          status: response.status,
          headers: createHeaders('application/json')
        }
      )
    }

    // レスポンスのArrayBufferを取得
    const data = await response.arrayBuffer()

    // 元のContent-Typeを維持しつつ、CORSヘッダーを追加
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    
    // 成功レスポンスを返す
    return new Response(data, {
      status: 200,
      headers: createHeaders(contentType)
    })
  } catch (error: unknown) {
    // エラーハンドリング
    console.error('プロキシエラー:', error)
    
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    
    return new Response(
      JSON.stringify({ 
        error: 'プロキシ処理中にエラーが発生しました', 
        message: errorMessage 
      }),
      {
        status: 500,
        headers: createHeaders('application/json')
      }
    )
  }
})
