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
};

const CareerSection: React.FC<Props> = ({ careers, isCurrentUser, editingCareerId, editError, onEdit, onSave, onCancel, editLoading }) => {
  if (!careers || careers.length === 0) return (
    <div className="text-gray-500 my-4">職歴がまだ登録されていません。</div>
  );
  return (
    <div className="my-6">
      <h3 className="text-lg font-bold mb-2">職歴・キャリア</h3>
      <ul className="space-y-2">
        {careers.map((c) => (
          <li key={c.id} className="bg-white rounded shadow p-3 flex flex-col md:flex-row md:items-center md:justify-between">
            {editingCareerId === c.id ? (
              <CareerEditInline
                career={c}
                onSave={async (form) => onSave && await onSave(c.id, form)}
                onCancel={onCancel || (() => {})}
                loading={editLoading}
                error={editError}
              />
            ) : (
              <>
                <div>
                  <div className="font-semibold text-indigo-700">{c.company}</div>
                  <div className="text-sm text-gray-700">{c.position}</div>
                  <div className="text-xs text-gray-400">{c.start_date} 〜 {c.end_date || (c.is_current_position ? '現在' : '')}</div>
                  {c.department && <div className="text-xs text-gray-500">{c.department}</div>}
                  {c.description && <div className="text-xs mt-1">{c.description}</div>}
                </div>
                {isCurrentUser && onEdit && (
                  <button className="ml-4 text-xs text-blue-500 hover:underline" onClick={() => onEdit(c.id)}>編集</button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CareerSection;
