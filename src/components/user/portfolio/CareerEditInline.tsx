import React, { useState } from "react";
import { Button } from "../../ui/Button";

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
  career: Career;
  onSave: (form: Omit<Career, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

const CareerEditInline: React.FC<Props> = ({ career, onSave, onCancel, loading, error }) => {
  const [form, setForm] = useState<Omit<Career, "id">>({
    company: career.company || "",
    position: career.position || "",
    department: career.department || "",
    start_date: career.start_date || "",
    end_date: career.end_date || "",
    is_current_position: career.is_current_position || false,
    description: career.description || ""
  });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async () => {
    setLocalError(null);
    setSaving(true);
    if (!form.company || !form.position || !form.start_date) {
      setLocalError("会社名・役職・開始日は必須です");
      setSaving(false);
      return;
    }
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="bg-white border rounded p-4 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs font-semibold mb-1">会社名*</label>
          <input
            className="w-full border rounded p-2 text-sm"
            name="company"
            value={form.company}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">役職*</label>
          <input
            className="w-full border rounded p-2 text-sm"
            name="position"
            value={form.position}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">部署</label>
          <input
            className="w-full border rounded p-2 text-sm"
            name="department"
            value={form.department}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">開始年月*</label>
          <input
            className="w-full border rounded p-2 text-sm"
            name="start_date"
            type="month"
            value={form.start_date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">終了年月</label>
          <input
            className="w-full border rounded p-2 text-sm"
            name="end_date"
            type="month"
            value={form.end_date}
            onChange={handleChange}
            disabled={form.is_current_position}
          />
        </div>
        <div className="flex items-center mt-5">
          <input
            type="checkbox"
            name="is_current_position"
            checked={form.is_current_position}
            onChange={handleChange}
            id="is_current_position"
          />
          <label htmlFor="is_current_position" className="ml-2 text-xs">現在も在籍中</label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">説明</label>
        <textarea
          className="w-full border rounded p-2 text-sm"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
        />
      </div>
      {(localError || error) && <div className="text-red-500 text-xs mb-2">{localError || error}</div>}
      <div className="flex gap-2 mt-2">
        <Button type="button" onClick={handleSave} disabled={saving || loading}>
          {saving || loading ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving || loading}>
          キャンセル
        </Button>
      </div>
    </div>
  );
};

export default CareerEditInline;
