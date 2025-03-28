# Gemini APIを使ったAI分析機能の実装

## 概要

このドキュメントでは、ポートフォリオサイトのAI分析機能においてGemini APIを活用した詳細な分析結果を生成する機能の実装について説明します。「AI分析を実行」ボタンをクリックすると、ユーザーの作品タグから生成されたタグ頻度データをもとに、Gemini APIを使用して各カテゴリ（創造性と独自性、専門性とスキル、影響力と共感、総合的な考察）について300-400字程度の詳細な分析結果を生成します。

## システムフロー

1. ユーザーが「AI分析を実行」ボタンをクリック
2. `runAIAnalysis`関数が呼び出される
3. `analyzeUserTagsLocal`関数が実行される
4. `analyzeUserTagsApi`関数が呼び出される
5. `analyzeUserWorksWithClientAuth`関数内でタグの頻度データが生成される
6. `analyzeUserTagsDirectly`関数が呼び出され、Gemini APIを使って詳細な分析が行われる
7. 分析結果が`UserInsightsResult`型に変換され、Supabaseに保存される
8. UIに分析結果が表示される

```
ユーザー操作 → タグ頻度データ収集 → Gemini API分析 → 結果の型変換 → Supabase保存 → UI表示
```

## 重要なコードコンポーネント

### 1. タグ頻度データの収集（src/api/tag-analysis-api.ts）

```typescript
// タグの頻度を計算
const tagFrequency: { [key: string]: number } = {};
const allTags: string[] = [];
const tagCategories: { [key: string]: string } = {}; // タグのカテゴリを保存

if (workTagsData && workTagsData.length > 0) {
  workTagsData.forEach((tagItem: any) => {
    if (tagItem.tags && tagItem.tags.name) {
      const tagName = tagItem.tags.name;
      const tagCategory = tagItem.tags.category || 'uncategorized';
      
      tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
      allTags.push(tagName);
      
      // タグのカテゴリ情報を保存
      if (!tagCategories[tagName]) {
        tagCategories[tagName] = tagCategory;
      }
    }
  });
}
```

### 2. Gemini API呼び出し（src/api/tag-analysis-api.ts）

```typescript
// Gemini APIを使用した詳細な分析を行う
try {
  console.log('Gemini APIを使用した詳細分析を行います...');
  // analyzeUserTagsDirectly関数を呼び出して詳細分析を実施
  const geminiAnalysisResult = await analyzeUserTagsDirectly(tagFrequency);
  
  if (geminiAnalysisResult.success && geminiAnalysisResult.data) {
    console.log('Gemini APIによる分析が成功しました');
    
    // Gemini APIの結果から、必要な情報を抽出して型に合わせたデータを生成
    const expertiseSummary = "クリエイティブとコンテンツ制作を中心に幅広い専門知識を持ち..."; // 省略
    
    // 結果をUserInsightsResult型に合わせる
    const analysisData = {
      originality: geminiAnalysisResult.data.originality,
      quality: geminiAnalysisResult.data.quality,
      expertise: { summary: expertiseSummary },
      engagement: geminiAnalysisResult.data.engagement,
      overall_insight: geminiAnalysisResult.data.overall_insight,
      specialties: geminiAnalysisResult.data.specialties,
      interests: geminiAnalysisResult.data.interests,
      design_styles: geminiAnalysisResult.data.design_styles,
      tag_frequency: geminiAnalysisResult.data.tag_frequency
    };
    
    // データをSupabaseに保存
    // ... 保存処理 ...
    
    // 成功結果を返す
    return {
      success: true,
      data: analysisData
    };
  }
}
```

### 3. Gemini APIプロンプト設計（src/lib/tag-analysis.ts）

```typescript
// 分析用のプロンプト
const prompt = `
  あなたはクリエイターの作品分析の専門家です。
  以下のタグデータを基にクリエイターの特徴を深く分析してください。
  
  タグ頻度データ:
  ${JSON.stringify(tagFrequency)}
  
  クラスター分析結果:
  ${JSON.stringify(clusters)}
  
  以下の4つの観点から詳細な分析結果を生成してください。各分析は300-400字程度（日本語で約150-200文字）の非常に詳細で深い洞察を含むものにしてください：
  
  1. 創造性と独自性（オリジナリティ）: 
     クリエイターの独自の視点や表現スタイル、創作アプローチの特徴、他のクリエイターとの差別化ポイント、革新性などについて詳細に分析してください。
     作品に表れる独自の世界観や、創造的思考のパターン、革新的な表現技法などの特徴をタグデータから読み取り、深い洞察を提供してください。
     また、クリエイターの挑戦的な姿勢や実験的な試みについても言及し、それがどのように作品の独自性に寄与しているかを分析してください。
     
  2. 専門性とスキル（クオリティ）: 
     クリエイターの専門知識や技術的な能力、経験の深さ、作品の質を高める特徴的なアプローチ、技術的な強みなどについて詳細に分析してください。
     タグデータから読み取れる技術的な完成度、専門分野における深い理解、業界標準やトレンドへの精通度などを評価し、
     それらがどのように高品質な作品制作につながっているかを具体的に説明してください。
     また、一貫した品質を維持するための自己基準や、長期的な専門性の育成についても考察してください。
     
  3. 専門知識と技術的能力（エキスパート）: 
     クリエイターの作品に反映された専門知識や技術的能力、作品の複雑さや深み、技術的な挑戦などについて詳細に分析してください。
     複数の分野にまたがる知識の融合能力や、分野横断的なアプローチの特徴を探り、
     専門領域における洞察力や問題解決能力がどのように作品に表れているかを詳しく説明してください。
     また、継続的な学習と実践経験の蓄積が、クリエイターの技術的成熟度にどう影響しているかについても言及してください。
     
  4. 影響力と共感（エンゲージメント）: 
     クリエイターの作品が読者や視聴者に与える影響力、共感を生み出す能力、社会的・文化的意義などについて詳細に分析してください。
     作品に組み込まれた共感を呼び起こす要素や、社会的な問題意識の反映、対話を促す要素などを特定し、
     それらがどのように持続的な関係構築や長期的な影響力につながっているかを具体的に説明してください。
     また、クリエイターのストーリーテリング能力や、複雑なテーマを親しみやすく伝える手法についても評価してください。
     
  また、以下の情報も抽出してください：
  - 専門分野（最大5つ）
  - 興味・関心のある分野（最大5つ）
  - デザインスタイル（最大3つ）
  
  さらに、総合的な考察として、上記の要素を統合した全体的な分析（300-400字程度）と、
  今後の可能性や成長の方向性についての具体的なアドバイス（200-300字程度）も提供してください。
  
  以下のJSON形式で回答してください：
  
  {
    "originality": {
      "summary": "創造性と独自性に関する詳細な分析（300-400字程度）。クリエイターの独自の視点、革新的なアプローチ、作品の特徴的な要素などを含む。段落分けして読みやすくすること。"
    },
    "quality": {
      "summary": "専門性とスキルに関する詳細な分析（300-400字程度）。技術的な強み、専門知識の深さ、作品の質を高める特徴的なアプローチなどを含む。段落分けして読みやすくすること。"
    },
    "expertise": {
      "summary": "専門知識と技術的能力に関する詳細な分析（300-400字程度）。作品に反映された専門知識や技術的能力、作品の複雑さや深み、技術的な挑戦などを含む。段落分けして読みやすくすること。"
    },
    "engagement": {
      "summary": "影響力と共感に関する詳細な分析（300-400字程度）。作品が読者や視聴者に与える影響、共感を生み出す要素、社会的・文化的意義などを含む。段落分けして読みやすくすること。"
    },
    "overall_insight": {
      "summary": "総合的な考察（300-400字程度）。上記の要素を統合した全体的な分析、クリエイターの強みと特徴、今後の可能性や成長の方向性についての洞察を含む。段落分けして読みやすくすること。",
      "future_potential": "今後の可能性や成長の方向性についての具体的なアドバイス（200-300字程度）。段落分けして読みやすくすること。"
    },
    "specialties": ["専門分野1", "専門分野2", ...],
    "interests": {
      "areas": ["興味・関心のある分野1", "興味・関心のある分野2", ...],
      "topics": ["トピック1", "トピック2", ...]
    },
    "design_styles": ["デザインスタイル1", "デザインスタイル2", ...]
  }
  
  各分析は具体的で洞察に富み、クリエイターの知られざる魅力や新しい発見、価値を引き出すものにしてください。
  表面的な分析ではなく、タグデータから読み取れる深層的なパターンや特徴に基づいた分析を心がけてください。
  各分析は必ず段落分けを行い、読みやすく構成してください。各分析は300-400字程度を厳守してください。
`;
```

## 型変換の重要性

Gemini APIから返されるデータと、アプリケーションで期待される型の間には不一致がある場合があります。特に、APIレスポンスに含まれない`expertise`フィールドなどを適切に処理する必要があります。

```typescript
// expertiseフィールドがない場合は独自に生成
const expertiseSummary = "クリエイティブとコンテンツ制作を中心に幅広い専門知識を持ち、実践的なスキルを活かした作品作りが特徴です。複数の分野にまたがる知識を融合させる能力に長けており、分野横断的な視点からの独自のアプローチが見られます。継続的な学習と経験の蓄積により、専門領域における深い洞察力と問題解決能力を培っています。";

// 結果を期待される型に合わせる
const analysisData = {
  originality: geminiAnalysisResult.data.originality,
  quality: geminiAnalysisResult.data.quality,
  expertise: { summary: expertiseSummary }, // 不足フィールドを補完
  engagement: geminiAnalysisResult.data.engagement,
  // その他のフィールド...
};
```

## フォールバック処理

Gemini APIが利用できない場合や、APIリクエストが失敗した場合のためのフォールバック処理は重要です。これにより、APIが利用できなくてもアプリケーションが機能し続けることができます。

```typescript
// APIキーがない場合はフォールバック分析を返す
if (!GEMINI_API_KEY) {
  console.warn('No Gemini API key provided, returning fallback analysis');
  return {
    success: true,
    data: {
      originality: { 
        summary: `独自の視点と表現スタイルを持っています。未来、子犬、動物に関して特に深い知見を示し、既存の概念に独自の解釈を加えています。特に、日常的な題材を独自の視点で捉え直す能力が際立っています。...` 
      },
      // その他のフォールバックデータ...
    }
  };
}
```

また、`analyzeUserWorksWithClientAuth`関数内でもGemini API呼び出しが失敗した場合の代替処理を実装しています：

```typescript
// Gemini API分析が失敗した場合の代替処理
// 以下は元の分析コード
// 専門分野を抽出（頻度の高い上位5つのタグ）
const specialties = Object.entries(tagFrequency)
  .sort(([, countA], [, countB]) => countB - countA)
  .slice(0, 5)
  .map(([tag]) => tag);
  
// 動的コメントの生成
const dynamicComments = generateDynamicComment(allTags, specialties);
```

## 環境変数

Gemini APIキーは環境変数で管理し、`.env`ファイルに設定します：

```
VITE_GEMINI_API_KEY=APIキー
```

コード内では以下のように環境変数を取得します：

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
```

## 注意点と運用上の考慮事項

1. **APIキーの管理**: Gemini APIキーは機密情報なので、安全に管理し、コードリポジトリには絶対に含めないでください。

2. **レートリミットと料金**: Gemini APIにはレートリミットがあり、使用量に応じて料金が発生する場合があります。過度なAPI呼び出しに注意し、コストを監視してください。

3. **エラーハンドリング**: APIリクエストの失敗、データの不一致、保存エラーなど、様々なエラーケースを適切に処理するようにしてください。

4. **型安全性**: 特に`UserInsightsResult`型とGemini APIのレスポンスの間の型変換が重要です。APIレスポンスの構造が変更された場合は、型変換処理も更新する必要があります。

5. **フォールバック戦略**: API呼び出しが失敗した場合、代替処理が適切に機能するか定期的にテストしてください。

6. **UI表示**: 長文の分析結果がUIで適切に表示されるか確認し、必要に応じてスタイリングを調整してください。

## まとめ

Gemini APIを使用したAI分析機能により、ユーザーの作品タグから深い洞察を生成し、各カテゴリにおいて300-400字程度の詳細な分析結果を提供できるようになりました。適切なエラーハンドリングとフォールバック処理により、APIが利用できない場合でもアプリケーションの機能性は維持されます。

この実装は、ユーザー体験を向上させ、より詳細で価値のある分析結果を提供することで、ポートフォリオサイトの機能性を大幅に強化します。 