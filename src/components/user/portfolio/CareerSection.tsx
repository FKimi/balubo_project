import React from "react";
import CareerEditInline from "./CareerEditInline";

type Career = {
  id: string;
  company: string;
  position: string;
  department: string;
  start_date: string;
  end_date?: string;
  is_current_position: boolean;
  description?: string;
};

type Props = {
  careers: Career[];
  isCurrentUser: boolean;
  editingCareerId?: string | null;
  editError?: string | null;
  onEdit?: (careerId: string) => void;
  onSave?: (careerId: string, form: Omit<Career, "id">) => Promise<void>;
  onCancel?: () => void;
  editLoading?: boolean;
  onDelete?: (careerId: string) => void;
};

const CareerSection: React.FC<Props> = ({ careers, isCurrentUser, editingCareerId, editError, onEdit, onSave, onCancel, editLoading, onDelete }) => {
  if (!careers || careers.length === 0) return (
    <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
      <div className="max-w-md mx-auto">
        <svg className="w-16 h-16 mx-auto text-indigo-100 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">キャリア情報がまだ登録されていません</h3>
        <p className="text-gray-500">プロフィールを充実させるために、あなたの職歴や経験を追加しましょう。</p>
      </div>
    </div>
  );
  
  return (
    <div className="my-8">
      <div className="relative pl-12 before:absolute before:left-5 before:top-2 before:bottom-8 before:w-0.5 before:bg-gradient-to-b before:from-indigo-400 before:via-blue-300 before:to-indigo-100">
        {careers.map((c, index) => (
          <div 
            key={c.id} 
            className={`relative mb-12 group`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* タイムラインドット */}
            <div className="absolute -left-7 top-0 w-10 h-10 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shadow-md group-hover:border-indigo-200 transition-all duration-300 group-hover:scale-110">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 group-hover:from-indigo-600 group-hover:to-blue-600 transition-all duration-300"></div>
            </div>
            
            {editingCareerId === c.id ? (
              <CareerEditInline
                career={c}
                onSave={async (form) => onSave && await onSave(c.id, form)}
                onCancel={onCancel || (() => {})}
                loading={editLoading}
                error={editError}
              />
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-indigo-100 hover:translate-x-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">{c.company}</h4>
                      {c.department && (
                        <span className="text-sm text-gray-500 md:border-l md:border-gray-300 md:pl-2">{c.department}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-sm font-medium rounded-full mb-3">
                        {c.position}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        <span className="font-medium">{c.start_date}</span> 〜 
                        <span className={c.is_current_position ? "font-medium text-indigo-600" : "font-medium"}>
                          {c.end_date || (c.is_current_position ? '現在' : '')}
                        </span>
                      </span>
                    </div>
                    
                    {c.description && (
                      <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100">
                        {c.description}
                      </div>
                    )}
                  </div>
                  
                  {isCurrentUser && (
                    <div className="flex md:flex-col gap-2 self-end md:self-start">
                      {onEdit && (
                        <button 
                          className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-colors shadow-sm"
                          onClick={() => onEdit(c.id)}
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17v-4z" />
                          </svg>
                          編集
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors shadow-sm"
                          onClick={() => onDelete(c.id)}
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          削除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 年表示 - 最後のアイテムを除く */}
            {index < careers.length - 1 && (
              <div className="absolute left-6 bottom-0 transform translate-y-1/2 -translate-x-1/2 text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded">
                {c.end_date ? c.end_date.split('-')[0] : '現在'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerSection;
