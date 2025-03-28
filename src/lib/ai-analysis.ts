// 作品の型定義
export interface Work {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  views: number;
  comment_count: number;
  tags?: string[];
  tagCategories?: string[]; // タグカテゴリ情報を追加
}

// AI分析結果の型定義
export interface LegacyAIAnalysisResult {
  expertise: {
    summary: string;
    topSkills: string[];
    level: number;
  };
  uniqueness: {
    summary: string;
    differentiators: string[];
    level: number;
  };
  interests: {
    summary: string;
    topInterests: string[];
    level: number;
  };
  talent?: string;
  specialties?: string[];
  designStyles?: string[];
}

/**
 * ユーザーデータを分析する関数
 * @param works ユーザーの作品一覧
 * @returns 分析結果
 */
export async function analyzeUserData(works: Work[]): Promise<LegacyAIAnalysisResult> {
  try {
    // 全作品からタグを抽出
    const allTags: string[] = [];
    works.forEach(work => {
      if (work.tags && Array.isArray(work.tags)) {
        allTags.push(...work.tags);
      }
    });
    
    // タグの出現回数をカウント
    const tagCounts: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    // タグカテゴリの出現回数をカウント
    const categoryCounts: Record<string, number> = {};
    works.forEach(work => {
      if (work.tagCategories && Array.isArray(work.tagCategories)) {
        work.tagCategories.forEach(category => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });
    
    // 専門性の分析
    const expertise = analyzeExpertise(works, allTags, categoryCounts);
    
    // 独自性の分析
    const uniqueness = analyzeUniqueness(works, allTags);
    
    // 興味・関心の分析
    const interests = analyzeInterests(works, allTags, categoryCounts);
    
    // 結果を返す
    return {
      expertise,
      uniqueness,
      interests,
      talent: generateTalentSummary(expertise),
      specialties: generateSpecialties(tagCounts),
      designStyles: generateDesignStyles(works)
    };
  } catch (error) {
    console.error('AI分析エラー:', error);
    // エラー時のデフォルト値を返す
    return {
      expertise: {
        summary: '十分なデータがありません。作品を追加して再度分析してください。',
        topSkills: ['データが不足しています'],
        level: 1
      },
      uniqueness: {
        summary: '十分なデータがありません。作品を追加して再度分析してください。',
        differentiators: ['データが不足しています'],
        level: 1
      },
      interests: {
        summary: '十分なデータがありません。作品を追加して再度分析してください。',
        topInterests: ['データが不足しています'],
        level: 1
      },
      talent: '十分なデータがありません',
      specialties: ['データが不足しています'],
      designStyles: ['データが不足しています']
    };
  }
}

// 専門性を分析する関数
function analyzeExpertise(works: Work[], tags: string[], categoryCounts: Record<string, number>): LegacyAIAnalysisResult['expertise'] {
  // タグを専門カテゴリに分類
  const expertiseCategories = categorizeTagsByExpertise(tags);
  
  // カテゴリ情報も活用
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // 専門カテゴリとタグカテゴリを組み合わせて最終的な専門性を決定
  const combinedExpertise = [...new Set([...expertiseCategories.slice(0, 3), ...topCategories.slice(0, 2)])].slice(0, 3);
  
  // 十分な専門性が特定できない場合はデフォルト値を使用
  if (combinedExpertise.length < 3) {
    const defaultExpertise = ["コンテンツ制作", "クリエイティブ表現", "視覚デザイン"];
    for (let i = combinedExpertise.length; i < 3; i++) {
      combinedExpertise.push(defaultExpertise[i]);
    }
  }
  
  // 専門レベルを計算（作品数、タグの多様性、作品の詳細度に基づく）
  const expertiseLevel = Math.min(9, 3 + Math.floor(works.length / 3) + Math.min(3, Math.floor(tags.length / 10)));
  
  // 専門性の要約文を生成
  const summary = combinedExpertise.length >= 2 
    ? `${combinedExpertise[0]}と${combinedExpertise[1]}を中心に、幅広い専門性を持っています。`
    : `${combinedExpertise[0] || 'コンテンツ制作'}に関する専門性を持っています。`;
  
  return {
    summary,
    topSkills: combinedExpertise,
    level: expertiseLevel
  };
}

// 興味・関心を分析する関数
function analyzeInterests(works: Work[], tags: string[], categoryCounts: Record<string, number>): LegacyAIAnalysisResult['interests'] {
  // タグを興味カテゴリに分類
  const interestCategories = categorizeTagsByInterest(tags);
  
  // カテゴリ情報も活用
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // 興味カテゴリとタグカテゴリを組み合わせて最終的な興味・関心を決定
  const combinedInterests = [...new Set([...interestCategories.slice(0, 3), ...topCategories.slice(0, 2)])].slice(0, 3);
  
  // 十分な興味・関心が特定できない場合はデフォルト値を使用
  if (combinedInterests.length < 3) {
    const defaultInterests = ["視覚芸術", "デジタルメディア", "コンテンツ制作"];
    for (let i = combinedInterests.length; i < 3; i++) {
      combinedInterests.push(defaultInterests[i]);
    }
  }
  
  // 興味レベルを計算（作品数とタグの多様性に基づく）
  const interestLevel = Math.min(9, 4 + Math.floor(works.length / 4) + Math.min(2, Math.floor(tags.length / 12)));
  
  // 興味・関心の要約文を生成
  const summary = combinedInterests.length >= 2 
    ? `${combinedInterests[0]}と${combinedInterests[1]}に強い関心を持ち、${combinedInterests[2] || '創造的表現'}にも興味があります。`
    : `${combinedInterests[0] || '視覚芸術'}に強い関心を持っています。`;
  
  return {
    summary,
    topInterests: combinedInterests,
    level: interestLevel
  };
}

// タグを専門カテゴリに分類する関数
function categorizeTagsByExpertise(tags: string[]): string[] {
  // タグをカテゴリにマッピング
  const expertiseMapping: Record<string, string> = {
    // ライティング関連
    "ライティング": "ライティング",
    "記事": "ライティング",
    "ブログ": "ライティング",
    "コピーライティング": "ライティング",
    
    // デザイン関連
    "デザイン": "デザイン",
    "UI": "デザイン",
    "UX": "デザイン",
    "グラフィック": "デザイン",
    "ビジュアル": "デザイン",
    
    // プログラミング関連
    "プログラミング": "プログラミング",
    "コーディング": "プログラミング",
    "開発": "プログラミング",
    "エンジニアリング": "プログラミング",
    
    // マーケティング関連
    "マーケティング": "マーケティング",
    "広告": "マーケティング",
    "PR": "マーケティング",
    "販促": "マーケティング",
    
    // 編集関連
    "編集": "編集",
    "校正": "編集",
    "キュレーション": "編集",
    
    // 分析関連
    "分析": "データ分析",
    "リサーチ": "データ分析",
    "調査": "データ分析"
  };
  
  // タグをカテゴリに変換し、カテゴリの出現回数をカウント
  const categoryCounts: Record<string, number> = {};
  
  tags.forEach(tag => {
    const category = expertiseMapping[tag] || tag;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // カテゴリを出現回数でソート
  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

// タグを興味カテゴリに分類する関数
function categorizeTagsByInterest(tags: string[]): string[] {
  // タグをカテゴリにマッピング
  const interestMapping: Record<string, string> = {
    // テクノロジー関連
    "テクノロジー": "テクノロジー",
    "プログラミング": "テクノロジー",
    "コーディング": "テクノロジー",
    "ウェブ開発": "テクノロジー",
    "AI": "テクノロジー",
    "機械学習": "テクノロジー",
    
    // デザイン関連
    "デザイン": "デザイン",
    "UI": "デザイン",
    "UX": "デザイン",
    "グラフィック": "デザイン",
    "イラスト": "デザイン",
    "ビジュアル": "デザイン",
    
    // ビジネス関連
    "ビジネス": "ビジネス",
    "マーケティング": "ビジネス",
    "戦略": "ビジネス",
    "分析": "ビジネス",
    "コンサルティング": "ビジネス",
    
    // コンテンツ関連
    "コンテンツ制作": "コンテンツ制作",
    "ライティング": "コンテンツ制作",
    "編集": "コンテンツ制作",
    "記事": "コンテンツ制作",
    "ブログ": "コンテンツ制作",
    
    // 教育関連
    "教育": "教育",
    "学習": "教育",
    "指導": "教育",
    "トレーニング": "教育"
  };
  
  // タグをカテゴリに変換し、カテゴリの出現回数をカウント
  const categoryCounts: Record<string, number> = {};
  
  tags.forEach(tag => {
    const category = interestMapping[tag] || tag;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // カテゴリを出現回数でソート
  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

// 独自性を分析する関数
function analyzeUniqueness(works: Work[], tags: string[]): LegacyAIAnalysisResult['uniqueness'] {
  // タグと作品内容から独自性を特定
  const uniqueTraits = identifyUniqueTraits(works, tags);
  
  // 独自性のトップ3を抽出
  const topDifferentiators = uniqueTraits.slice(0, 3);
  
  // 十分な特徴がない場合はデフォルト値を追加
  if (topDifferentiators.length < 3) {
    const defaultTraits = ["創造的アプローチ", "独自の視点", "革新的な表現"];
    for (let i = topDifferentiators.length; i < 3; i++) {
      topDifferentiators.push(defaultTraits[i]);
    }
  }
  
  // 独自性レベルを計算（タグの多様性と作品の独自性に基づく）
  const uniquenessLevel = Math.min(9, 5 + Math.floor(works.length / 4) + Math.min(2, Math.floor(tags.length / 7)));
  
  // 独自性の要約文を生成
  const summary = topDifferentiators.length >= 2 
    ? `${topDifferentiators[0]}と${topDifferentiators[1]}を組み合わせた独自のアプローチが作品に反映されています。`
    : `${topDifferentiators[0] || '独自の視点'}が作品に反映されています。`;
  
  return {
    summary,
    differentiators: topDifferentiators,
    level: uniquenessLevel
  };
}

// 独自性の特徴を特定する関数
function identifyUniqueTraits(works: Work[], tags: string[]): string[] {
  // タグの組み合わせから独自性を特定
  const uniqueTraits: string[] = [];
  
  // タグの組み合わせを分析
  const tagPairs: Record<string, number> = {};
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const pair = [tags[i], tags[j]].sort().join('-');
      tagPairs[pair] = (tagPairs[pair] || 0) + 1;
    }
  }
  
  // 頻度の低いタグペアは独自性が高い
  const uniquePairs = Object.entries(tagPairs)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(entry => entry[0].split('-'));
  
  // 独自性の高いタグペアから特徴を抽出
  uniquePairs.forEach(pair => {
    if (pair.length === 2) {
      uniqueTraits.push(`${pair[0]}と${pair[1]}の組み合わせ`);
    }
  });
  
  // 作品の説明文から独自性を抽出（実際のプロジェクトではより高度な分析を行う）
  const commonPhrases = ["独自", "革新", "創造", "新しい", "ユニーク"];
  works.forEach(work => {
    if (work.description) {
      commonPhrases.forEach(phrase => {
        if (work.description.includes(phrase)) {
          uniqueTraits.push(`${phrase}的な表現`);
        }
      });
    }
  });
  
  // 重複を削除
  return [...new Set(uniqueTraits)];
}

// 才能の要約を生成する関数
function generateTalentSummary(expertise: LegacyAIAnalysisResult['expertise']): string {
  // 作品数に基づいて経験レベルを判断
  const experienceLevel = expertise.level > 5 ? "豊富な" : expertise.level > 3 ? "一定の" : "基本的な";
  
  // タグから主な専門分野を特定
  const mainSpecialty = expertise.topSkills[0] || "コンテンツ制作";
  
  // 作品の平均文字数を計算して文章力を判断
  const avgCharLength = expertise.level > 5 ? 1000 : expertise.level > 3 ? 500 : 200;
  
  const writingSkill = avgCharLength > 1000 ? "詳細な解説が得意" : 
                       avgCharLength > 500 ? "わかりやすい説明が得意" : 
                       "簡潔な表現が得意";
  
  // 要約を生成
  return `${mainSpecialty}に関する${experienceLevel}知識と経験をお持ちです。${writingSkill}で、読者に価値ある情報を提供できます。`;
}

// 専門分野を生成する関数
function generateSpecialties(tagCounts: Record<string, number>): string[] {
  // タグの出現回数でソート
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // 最大5つの専門分野を返す
  return sortedTags.slice(0, 5);
}

// デザインスタイルを生成する関数
function generateDesignStyles(works: Work[]): string[] {
  // デザイン関連のタグを抽出
  const designTags = works.flatMap(work => work.tags || []).filter(tag => 
    ["モダン", "ミニマル", "クリエイティブ", "シンプル", "エレガント", "ポップ", "カラフル"].includes(tag)
  );
  
  // デザインタグがない場合はデフォルト値を返す
  if (designTags.length === 0) {
    return ["モダン", "ミニマル", "ユーザー中心"];
  }
  
  // 最大3つのデザインスタイルを返す
  return [...new Set(designTags)].slice(0, 3);
}