import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ClientLayout from './ClientLayout';
import AISupportButton from './ai/AISupportButton';
import AIRequirementsGenerator from './ai/AIRequirementsGenerator';
import AITitleGenerator from './ai/AITitleGenerator';
import AIBudgetSuggestion from './ai/AIBudgetSuggestion';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 案件カテゴリーのオプション
const projectCategories = [
  '記事作成', 'Webデザイン', 'SNS運用', 'コピーライティング',
  'イラスト', '写真・動画', 'Webサイト制作', 'マーケティング',
  'その他'
];

// 納期指定方法のオプション
const deliveryTypes = [
  { value: 'specific_date', label: '具体的な日付' },
  { value: 'within_period', label: '期間内に完了' },
  { value: 'negotiable', label: '応相談' }
];

// 期間オプション
const periodOptions = [
  { value: '1_week', label: '1週間以内' },
  { value: '2_weeks', label: '2週間以内' },
  { value: '1_month', label: '1ヶ月以内' },
  { value: '2_months', label: '2ヶ月以内' },
  { value: '3_months', label: '3ヶ月以内' },
  { value: '6_months', label: '半年以内' },
  { value: 'other', label: 'その他' }
];

const ClientProjectNew = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    requirements: '',
    budget_min: '',
    budget_max: '',
    budget_negotiable: false,
    delivery_type: '',
    delivery_date: '',
    delivery_period: '',
    delivery_period_custom: '',
    is_public: true,
    attachments: [] as File[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  // AIモーダルの状態
  const [showRequirementsGenerator, setShowRequirementsGenerator] = useState(false);
  const [showTitleGenerator, setShowTitleGenerator] = useState(false);
  const [showBudgetSuggestion, setShowBudgetSuggestion] = useState(false);

  // 入力フィールド変更時のハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // エラーをクリア
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // チェックボックス変更時のハンドラー
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // ファイル選択時のハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...files]
      });
    }
  };

  // ファイル削除のハンドラー
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...formData.attachments];
    updatedFiles.splice(index, 1);
    setFormData({
      ...formData,
      attachments: updatedFiles
    });
  };

  // フォーム検証
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '案件タイトルは必須です';
    }
    
    if (!formData.category) {
      newErrors.category = 'カテゴリーを選択してください';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '案件の説明は必須です';
    }
    
    // 予算のバリデーション
    if (!formData.budget_negotiable) {
      // 相談可能でない場合は予算入力が必須
      if (!formData.budget_min) {
        newErrors.budget_min = '最小予算を入力してください';
      } else if (isNaN(Number(formData.budget_min)) || Number(formData.budget_min) < 0) {
        newErrors.budget_min = '有効な金額を入力してください';
      }
      
      if (formData.budget_max && !isNaN(Number(formData.budget_max)) && Number(formData.budget_max) > 0) {
        if (Number(formData.budget_min) > Number(formData.budget_max)) {
          newErrors.budget_max = '最大予算は最小予算よりも大きい値を設定してください';
        }
      }
    }
    
    // 納期のバリデーション
    if (!formData.delivery_type) {
      newErrors.delivery_type = '納期の指定方法を選択してください';
    } else {
      if (formData.delivery_type === 'specific_date' && !formData.delivery_date) {
        newErrors.delivery_date = '納期の日付を指定してください';
      } else if (formData.delivery_type === 'within_period' && !formData.delivery_period) {
        newErrors.delivery_period = '期間を選択してください';
      } else if (formData.delivery_type === 'within_period' && formData.delivery_period === 'other' && !formData.delivery_period_custom) {
        newErrors.delivery_period_custom = '具体的な期間を入力してください';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/client/login');
        return;
      }
      
      // 予算データの整理
      type BudgetData = {
        budget_min?: number;
        budget_max?: number | null;
        budget_negotiable: boolean;
      };
      let budgetData: BudgetData;
      
      if (formData.budget_negotiable) {
        budgetData = {
          budget_negotiable: true
        };
      } else {
        budgetData = {
          budget_min: Number(formData.budget_min),
          budget_max: formData.budget_max ? Number(formData.budget_max) : null,
          budget_negotiable: false
        };
      }

      // 納期データの整理
      type DeliveryData = {
        delivery_type: string;
        delivery_date?: string;
        delivery_period?: string;
      };
      const deliveryData: DeliveryData = {
        delivery_type: formData.delivery_type
      };

      if (formData.delivery_type === 'specific_date') {
        deliveryData.delivery_date = formData.delivery_date;
      } else if (formData.delivery_type === 'within_period') {
        deliveryData.delivery_period = formData.delivery_period === 'other' 
          ? formData.delivery_period_custom 
          : periodOptions.find(option => option.value === formData.delivery_period)?.label || '';
      }
      
      // プロジェクトデータをSupabaseに保存
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: formData.title,
          category: formData.category,
          description: formData.description,
          requirements: formData.requirements,
          ...budgetData,
          ...deliveryData,
          is_public: formData.is_public,
          client_id: user.id,
          status: 'published'
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      const projectId = data?.[0]?.id;
      
      // 添付ファイルがある場合はアップロード
      if (formData.attachments.length > 0 && projectId) {
        for (const file of formData.attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${projectId}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project_attachments')
            .upload(fileName, file);
          
          if (uploadError) {
            console.error('ファイルアップロードエラー:', uploadError);
          }
        }
      }
      
      setSuccessMessage('案件が正常に作成されました！');
      
      // 3秒後にプロジェクト一覧ページに遷移
      setTimeout(() => {
        navigate('/client/projects');
      }, 3000);
      
    } catch (error) {
      console.error('案件作成エラー:', error);
      setErrors({
        submit: '案件の作成中にエラーが発生しました。再度お試しください。'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 数値のカンマ区切り表示
  const formatNumber = (value: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // カンマ区切りの数値を処理するハンドラー
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^\d]/g, '');
    
    setFormData({
      ...formData,
      [name]: numericValue
    });
    
    // エラーをクリア
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // 納期のJSXを生成
  const renderDeliveryInput = () => {
    if (!formData.delivery_type) {
      return null;
    }

    switch (formData.delivery_type) {
      case 'specific_date':
        return (
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1" htmlFor="delivery_date">
              納期日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="delivery_date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // 今日以降の日付のみ選択可能
              className={`w-full px-3 py-2 border ${
                errors.delivery_date ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.delivery_date && <p className="text-red-500 text-sm mt-1">{errors.delivery_date}</p>}
          </div>
        );
      
      case 'within_period':
        return (
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1" htmlFor="delivery_period">
              期間 <span className="text-red-500">*</span>
            </label>
            <select
              id="delivery_period"
              name="delivery_period"
              value={formData.delivery_period}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.delivery_period ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">期間を選択</option>
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.delivery_period && <p className="text-red-500 text-sm mt-1">{errors.delivery_period}</p>}
            
            {formData.delivery_period === 'other' && (
              <div className="mt-3">
                <label className="block text-sm text-gray-700 mb-1" htmlFor="delivery_period_custom">
                  具体的な期間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="delivery_period_custom"
                  name="delivery_period_custom"
                  value={formData.delivery_period_custom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.delivery_period_custom ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="例: 4ヶ月以内"
                />
                {errors.delivery_period_custom && <p className="text-red-500 text-sm mt-1">{errors.delivery_period_custom}</p>}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // AIから生成された要件を適用
  const handleApplyRequirements = (requirements: string) => {
    setFormData({
      ...formData,
      description: requirements
    });
    
    // エラーをクリア
    if (errors.description) {
      setErrors({
        ...errors,
        description: ''
      });
    }
  };

  // AIから生成されたタイトルを適用
  const handleApplyTitle = (title: string) => {
    setFormData({
      ...formData,
      title: title
    });
    
    // エラーをクリア
    if (errors.title) {
      setErrors({
        ...errors,
        title: ''
      });
    }
  };

  // AIから提案された予算を適用
  const handleApplyBudget = (min: string, max: string) => {
    setFormData({
      ...formData,
      budget_min: min,
      budget_max: max,
      budget_negotiable: false
    });
    
    // エラーをクリア
    if (errors.budget_min) {
      setErrors({
        ...errors,
        budget_min: ''
      });
    }
    if (errors.budget_max) {
      setErrors({
        ...errors,
        budget_max: ''
      });
    }
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" />
          戻る
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">新規案件作成</h1>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowRequirementsGenerator(true)}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI要件定義
              </button>
            </div>
          </div>
          
          {successMessage ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{successMessage}</span>
              <span className="block mt-2 text-sm">プロジェクト一覧ページに自動的に移動します...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* 案件タイトル */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-medium" htmlFor="title">
                    案件タイトル <span className="text-red-500">*</span>
                  </label>
                  <AISupportButton 
                    onClick={() => setShowTitleGenerator(true)} 
                    label="タイトル生成"
                  />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="例：オウンドメディア用の記事作成依頼"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              
              {/* カテゴリー */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                  カテゴリー <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">カテゴリーを選択</option>
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
              
              {/* 案件説明 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-medium" htmlFor="description">
                    案件の説明 <span className="text-red-500">*</span>
                  </label>
                  <AISupportButton 
                    onClick={() => setShowRequirementsGenerator(true)}
                    label="要件を整理"
                  />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-3 py-2 border ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="案件の背景、目的、依頼内容について詳しく記載してください。"
                ></textarea>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              
              {/* 要件・条件 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="requirements">
                  要件・条件
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="特定のスキルや経験、参考にしてほしい資料などがあれば記載してください。"
                ></textarea>
              </div>
              
              {/* 予算 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-medium">
                    予算 <span className="text-red-500">*</span>
                  </label>
                  <AISupportButton 
                    onClick={() => setShowBudgetSuggestion(true)}
                    label="予算提案"
                  />
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="budget_negotiable"
                      name="budget_negotiable"
                      checked={formData.budget_negotiable}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="budget_negotiable" className="ml-2 block text-sm text-gray-700">
                      予算は応相談
                    </label>
                  </div>
                </div>
                
                {!formData.budget_negotiable && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1" htmlFor="budget_min">
                        最小予算（円）<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="budget_min"
                          name="budget_min"
                          value={formatNumber(formData.budget_min)}
                          onChange={handleNumberChange}
                          className={`w-full px-3 py-2 border ${
                            errors.budget_min ? 'border-red-500' : 'border-gray-300'
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          placeholder="例: 50,000"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">円</span>
                      </div>
                      {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-1" htmlFor="budget_max">
                        最大予算（円）
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="budget_max"
                          name="budget_max"
                          value={formatNumber(formData.budget_max)}
                          onChange={handleNumberChange}
                          className={`w-full px-3 py-2 border ${
                            errors.budget_max ? 'border-red-500' : 'border-gray-300'
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          placeholder="例: 100,000"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">円</span>
                      </div>
                      {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        ※最大予算は省略可能です。最小予算のみ設定した場合は「〜円以上」として表示されます。
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 納期 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  納期 <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3">
                  <label className="block text-sm text-gray-700 mb-1">納期の指定方法</label>
                  <div className="flex flex-wrap gap-3">
                    {deliveryTypes.map((type) => (
                      <div key={type.value}>
                        <input
                          type="radio"
                          id={`delivery_type_${type.value}`}
                          name="delivery_type"
                          value={type.value}
                          checked={formData.delivery_type === type.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <label
                          htmlFor={`delivery_type_${type.value}`}
                          className={`px-4 py-2 border rounded-md cursor-pointer ${
                            formData.delivery_type === type.value
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.delivery_type && <p className="text-red-500 text-sm mt-1">{errors.delivery_type}</p>}
                  
                  {renderDeliveryInput()}
                </div>
              </div>
              
              {/* 添付ファイル */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  添付ファイル（任意）
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">クリックしてアップロード</span> またはドラッグ＆ドロップ</p>
                      <p className="text-xs text-gray-500">参考資料やデザイン案など (最大10MB)</p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* 選択したファイル一覧 */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">選択したファイル:</p>
                    <ul className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span className="text-sm truncate max-w-xs">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* 公開設定 */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    この案件をクリエイター一覧に公開する
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  非公開にした場合、個別にクリエイターを指名して案件を依頼することができます。
                </p>
              </div>
              
              {/* エラーメッセージ */}
              {errors.submit && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                  <span className="block sm:inline">{errors.submit}</span>
                </div>
              )}
              
              {/* 送信ボタン */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? '送信中...' : '案件を作成する'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* AIモーダル */}
      {showRequirementsGenerator && (
        <AIRequirementsGenerator
          onApplyRequirements={handleApplyRequirements}
          onClose={() => setShowRequirementsGenerator(false)}
        />
      )}

      {showTitleGenerator && (
        <AITitleGenerator
          description={formData.description}
          onApplyTitle={handleApplyTitle}
          onClose={() => setShowTitleGenerator(false)}
        />
      )}

      {showBudgetSuggestion && (
        <AIBudgetSuggestion
          category={formData.category}
          description={formData.description}
          onApplyBudget={handleApplyBudget}
          onClose={() => setShowBudgetSuggestion(false)}
        />
      )}
    </ClientLayout>
  );
};

export default ClientProjectNew; 