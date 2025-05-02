"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeContent = analyzeContent;
exports.testGeminiAPI = testGeminiAPI;
const generative_ai_1 = require("@google/generative-ai");
// Netlify Functions/Node.js用: process.envのみ参照
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// APIキーが設定されていない場合の警告
if (!GEMINI_API_KEY) {
    console.warn('Missing Gemini API key. Please set GEMINI_API_KEY in your environment.');
}
// Gemini Proのモデル設定
const generationConfig = {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 4096,
};
// 安全性設定
const safetySettings = [
    {
        category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];
async function analyzeContent(content) {
    try {
        // APIキーがない場合はフォールバック分析を返す
        if (!GEMINI_API_KEY) {
            console.warn('No Gemini API key provided, returning fallback analysis');
            return getFallbackAnalysis();
        }
        // Initialize the API client
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
        try {
            // Get the model
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig,
                safetySettings,
            });
            // プロンプトの作成
            const prompt = `
# 記事分析タスク

## 分析対象
タイトル: ${content.title}
説明: ${content.description || '説明なし'}
タグ: ${content.tags ? content.tags.join('、') : 'タグなし'}

## 分析指示
あなたはプロの編集者・ライターです。記事タイトル・説明文・タグのみをもとに、記事の魅力や強みを最大限に引き出す分析を行ってください。
- 本文がない場合は、タイトル・説明文・タグから読み取れる情報をもとに、想像力や編集者としての知見も活かして分析してください。
- すべての記事分析項目で、ライティング・編集の観点から具体的な特徴や工夫、読者への価値を説明してください。
- summaryや説明文は「短く・端的に・インパクト重視」でまとめてください。
- 評価はプロの知見と誠実さを感じさせつつ、少しだけフランクさやユーモアを交え、話しかけるような語り口で書いてください。
- やさしい語り口や親しみやすさは歓迎ですが、馴れ馴れしすぎず、信頼感と適度な距離感を大切にしてください。
- 体言止めは避け、「〜です」「〜ます」で締めてください。
- 抽象的な説明には必ず具体例を添え、専門用語には平易な解説を加えてください。
- 長い文と短い文を交互に使い、リズムよく読みやすくしてください。
- 「タイトルや説明文から分析しました」などの補足や分析過程の説明は不要です。
- 押し付けがましい断定は避け、「一つの見方として」「私見ですが」など柔らかい結論を心がけてください。

1. 創造性（最大5つ、スコア付き）
【定義】記事タイトルや説明文から感じられる独自性、新規性、切り口の斬新さです。
【よくあるパターン】独創的なタイトルや意外性のあるテーマ設定、新しい視点の提示、他分野との融合、読者の興味を引くキャッチコピーなどが挙げられます。
- 独創的なタイトルや切り口
- 新しい視点やテーマの提示
- 既存アイデアの新しい組み合わせ

2. 専門性（最大5つ、スコア付き）
【定義】説明文やタグから伝わる分野知識の深さ、情報の正確性、専門的な切り口や論理性です。
【よくあるパターン】専門用語の活用、明確なターゲット設定、信頼性の高い情報、論理的な構成、業界特有の視点などです。
- 専門用語や業界知識の活用
- 明確な読者ターゲット
- 論理的な構成
- 情報の信頼性

3. 影響力（最大5つ、タイトルと説明付き）
【定義】タイトルや説明文が読者に与えるインパクト、共感・行動喚起・社会的意義です。
【よくあるパターン】共感を呼ぶ表現やストーリー性、行動を促すメッセージ、社会的な意義や話題性、記憶に残るワードなどです。
- 共感を呼ぶ表現やストーリー性
- 行動を促すメッセージ
- 社会的な意義や話題性

4. 共通のタグリスト（最大10個）
【定義】記事の主題や対象読者、関連分野やキーワードを表すラベルです。
【よくあるパターン】ジャンル（例：ビジネス、ライフスタイル）、テーマ（例：働き方改革、健康）、読者層（例：若手社会人）、専門分野（例：マーケティング）、キーワード（例：ノウハウ、トレンド）などです。
- ジャンル
- テーマ
- 読者層
- 専門分野
- キーワード

## 出力形式
以下のJSON形式で出力してください：

{
  "originality": {
    "features": [
      { "name": "独創的なタイトル", "score": 4.5 },
      { "name": "新しい視点", "score": 4.2 }
    ],
    "summary": "独自の切り口と新鮮な視点が光っていますね。読者の関心を自然に引き寄せる構成です。たとえば、日常の何気ない出来事をテーマにすることで、幅広い層に親しみやすさを感じてもらえそうです。個人的には、こういう発想、すごく好きです。"
  },
  "quality": {
    "categories": [
      { "name": "専門用語の活用", "score": 4.8 },
      { "name": "論理的な構成", "score": 4.3 }
    ],
    "summary": "内容からしっかりとした知識と経験が伝わってきます。専門用語も適切に使われていて、説明も分かりやすいです。たとえば、複雑な概念を身近な例に置き換える工夫が見られます。こういう工夫があると、読者も安心して読み進められると思います。"
  },
  "engagement": {
    "points": [
      { "title": "共感を呼ぶ表現", "description": "読者の共感を呼び起こし、行動につなげる力がありますね。" },
      { "title": "社会的な意義", "description": "身近な課題を具体的に描写することで、多くの人に考えるきっかけを与えています。こういう記事、もっと増えてほしいです。" }
    ],
    "summary": "社会的な意義や時代性も意識されていて、内容の深みを感じます。たとえば、身近な課題を具体的に描写することで、多くの人に考えるきっかけを与えています。こういう記事、もっと増えてほしいです。"
  },
  "tags": [
    "ビジネス", "働き方改革", "若手社会人", "ノウハウ"
  ]
}
`;
            // テキスト生成
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            // JSON部分を抽出
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('APIからの応答にJSON形式のデータが含まれていません');
            }
            const jsonText = jsonMatch[0];
            console.log('API応答からJSON抽出:', jsonText);
            try {
                return JSON.parse(jsonText);
            }
            catch (parseError) {
                console.error('JSON解析エラー:', parseError);
                throw new Error('APIレスポンスのJSON解析に失敗しました');
            }
        }
        catch (apiError) {
            console.error('Gemini API呼び出しエラー:', apiError);
            // エラーの種類に応じたメッセージ
            if (apiError instanceof Error) {
                if (apiError.message.includes('API key')) {
                    throw new Error('API keyが無効です。環境変数を確認してください。');
                }
                else if (apiError.message.includes('quota')) {
                    throw new Error('API使用量の上限に達しました。後でもう一度お試しください。');
                }
                else if (apiError.message.includes('rate')) {
                    throw new Error('APIリクエストが多すぎます。しばらく待ってから再試行してください。');
                }
            }
            throw apiError;
        }
    }
    catch (error) {
        console.error('コンテンツ分析エラー:', error);
        return getFallbackAnalysis();
    }
}
// フォールバック分析を返す関数
function getFallbackAnalysis() {
    return {
        originality: {
            features: [
                { name: "一般", score: 0.8 },
                { name: "未分類", score: 0.7 }
            ],
            summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
        },
        quality: {
            categories: [
                { name: "一般", score: 0.8 },
                { name: "未分類", score: 0.7 }
            ],
            summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
        },
        engagement: {
            points: [
                { title: "基本情報", description: "コンテンツの基本情報が含まれています。" }
            ],
            summary: "APIキーが設定されていないため、詳細な分析ができませんでした。"
        },
        tags: ["一般", "その他"]
    };
}
// API接続テスト用関数
async function testGeminiAPI() {
    try {
        if (!GEMINI_API_KEY) {
            return {
                success: false,
                message: 'APIキーが設定されていません。環境変数GEMINI_API_KEYを確認してください。',
                response: ''
            };
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 100,
            }
        });
        const prompt = "こんにちは、簡単なテストメッセージです。「Gemini API接続テスト成功」と返してください。";
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return {
            success: true,
            message: 'Gemini APIへの接続に成功しました。',
            response: text
        };
    }
    catch (error) {
        console.error('Gemini API接続テストエラー:', error);
        let errorMessage = 'Gemini APIへの接続中にエラーが発生しました。';
        if (error instanceof Error) {
            errorMessage += ' ' + error.message;
        }
        return {
            success: false,
            message: errorMessage,
            response: ''
        };
    }
}
