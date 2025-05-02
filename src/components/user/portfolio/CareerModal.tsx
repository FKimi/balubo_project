import React from "react";

type CareerForm = {
  company: string;
  position: string;
  department: string;
  start_date: string;
  end_date: string;
  is_current_position: boolean;
  description: string;
};

type Props = {
  open: boolean;
  editingCareer: boolean;
  careerForm: CareerForm;
  careerError: string | null;
  onChange: (form: Partial<CareerForm>) => void;
  onCancel: () => void;
  onSave: () => void;
};

const CareerModal: React.FC<Props> = ({ open, editingCareer, careerForm, careerError, onChange, onCancel, onSave }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{editingCareer ? '職歴を編集' : '職歴を追加'}</h3>
        <div className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="会社名" value={careerForm.company} onChange={e => onChange({ company: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="役職" value={careerForm.position} onChange={e => onChange({ position: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="部署（任意）" value={careerForm.department} onChange={e => onChange({ department: e.target.value })} />
          <div className="flex gap-2">
            <input type="month" className="flex-1 border rounded px-3 py-2" placeholder="開始年月" value={careerForm.start_date} onChange={e => onChange({ start_date: e.target.value })} />
            <input type="month" className="flex-1 border rounded px-3 py-2" placeholder="終了年月（任意）" value={careerForm.end_date || ''} onChange={e => onChange({ end_date: e.target.value })} disabled={careerForm.is_current_position}/>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_current_position" checked={careerForm.is_current_position} onChange={e => onChange({ is_current_position: e.target.checked, end_date: e.target.checked ? '' : careerForm.end_date })} />
            <label htmlFor="is_current_position" className="text-xs">現在も在籍中</label>
          </div>
          <textarea className="w-full border rounded px-3 py-2" placeholder="詳細（任意）" value={careerForm.description} onChange={e => onChange({ description: e.target.value })} />
          {careerError && <div className="text-red-500 text-xs">{careerError}</div>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={onCancel}>キャンセル</button>
          <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={onSave}>{editingCareer ? '保存' : '追加'}</button>
        </div>
      </div>
    </div>
  );
};

export default CareerModal;
