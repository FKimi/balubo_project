import React from "react";
import { UserCategory } from '../../../types';

interface Props {
  userCategories: UserCategory[];
  editingCategoryId: string | null;
  editingCategoryName: string;
  setEditingCategoryName: (name: string) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onSave: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string) => void;
  onCancel: () => void;
  onEdit: (id: string) => void;
};

const CategoryEditSection: React.FC<Props> = ({
  userCategories,
  editingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  newCategoryName,
  setNewCategoryName,
  onSave,
  onDelete,
  onAdd,
  onCancel,
  onEdit
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">カテゴリー管理</h2>
      <ul className="mb-4">
        {userCategories.map(cat => (
          <li key={cat.id} className="flex items-center gap-2">
            {editingCategoryId === cat.id ? (
              <>
                <input
                  type="text"
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2"
                  value={editingCategoryName}
                  onChange={e => setEditingCategoryName(e.target.value)}
                  style={{ minWidth: 80 }}
                  autoFocus
                />
                <button className="text-indigo-600 hover:underline focus:outline-none text-xs mr-2" onClick={() => onSave(cat.id, editingCategoryName)}>保存</button>
                <button className="text-gray-500" onClick={onCancel}>キャンセル</button>
              </>
            ) : (
              <>
                <span>{cat.name}</span>
                <button className="text-blue-500" onClick={() => onEdit(cat.id)}>編集</button>
                <button className="text-red-500" onClick={() => onDelete(cat.id)}>削除</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="新しいカテゴリー名" className="border px-2 py-1 rounded" />
        <button type="button" className="bg-gray-200 px-2 py-1 rounded flex items-center gap-1" onClick={() => onAdd(newCategoryName)}>
          <span className="text-lg">＋</span><span>カテゴリー追加</span>
        </button>
      </div>
    </div>
  );
};

export default CategoryEditSection;
