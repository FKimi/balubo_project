import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Project, Application } from '../../types';
import { getProjects, getApplicationsByProject } from '../../api/services/client';
import { Briefcase, Calendar, MessageSquare, Filter, Plus } from 'lucide-react';
import ClientLayout from './ClientLayout';

// Supabaseクライアントの初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClientProjects: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed' | 'completed'>('all');
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProjectsData() {
      setLoading(true);
      
      try {
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/client/login');
          return;
        }
        
        // 案件情報を取得
        const projectsData = await getProjects(user.id);
        console.log('取得したプロジェクト:', projectsData); // デバッグログ
        setProjects(projectsData);
        
        // 全案件の応募情報を取得
        const applicationsMap: Record<string, Application[]> = {};
        for (const project of projectsData) {
          const projectApplications = await getApplicationsByProject(project.id);
          applicationsMap[project.id] = projectApplications;
        }
        setApplications(applicationsMap);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjectsData();
  }, [navigate]);

  // 表示する案件をフィルタリング
  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  // ステータス選択肢の型を明示
  const statusOptions: { id: 'all' | 'draft' | 'published' | 'closed' | 'completed'; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'draft', label: '下書き' },
    { id: 'published', label: '公開中' },
    { id: 'closed', label: '募集終了' },
    { id: 'completed', label: '完了' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Briefcase className="mr-2 text-indigo-600" size={24} />
            案件管理
          </h1>
          <button
            onClick={() => navigate('/client/project/new')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={18} className="mr-1" />
            新規案件作成
          </button>
        </div>
        
        {/* フィルター */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center">
          <Filter size={18} className="text-gray-400 mr-2" />
          <span className="text-gray-600 mr-4">ステータス:</span>
          <div className="flex space-x-2">
            {statusOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === item.id
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 案件リスト */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">案件がありません</h3>
            <p className="text-gray-500 mb-6">新しい案件を作成して、最適なクリエイターを探しましょう。</p>
            <button
              onClick={() => navigate('/client/project/new')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md inline-flex items-center"
            >
              <Plus size={18} className="mr-2" />
              新規案件作成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const projectApplications = applications[project.id] || [];
              return (
                <div 
                  key={project.id} 
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/client/project/${project.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{project.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      project.status === 'published' ? 'bg-green-100 text-green-700' :
                      project.status === 'closed' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {project.status === 'draft' ? '下書き' :
                       project.status === 'published' ? '公開中' :
                       project.status === 'closed' ? '募集終了' : '完了'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.required_skills?.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <MessageSquare size={16} className="mr-1" />
                        <span>{projectApplications.length} 件の応募</span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          <span>期限: {new Date(project.deadline).toLocaleDateString('ja-JP')}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {project.budget_min && project.budget_max ? (
                        <span>予算: {project.budget_min.toLocaleString()} 〜 {project.budget_max.toLocaleString()} 円</span>
                      ) : project.budget_min ? (
                        <span>予算: {project.budget_min.toLocaleString()} 円〜</span>
                      ) : project.budget_max ? (
                        <span>予算: 〜{project.budget_max.toLocaleString()} 円</span>
                      ) : (
                        <span>予算: 要相談</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientProjects; 