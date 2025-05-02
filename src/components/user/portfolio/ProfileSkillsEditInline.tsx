import React, { useState } from "react";
import { Button } from "../../ui/Button";

interface Props {
  skills: string[];
  onSave: (skills: string[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ProfileSkillsEditInline: React.FC<Props> = ({ skills, onSave, onCancel, loading }) => {
  const [skillsValue, setSkillsValue] = useState(skills.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const skillsArr = skillsValue.split(",").map(s => s.trim()).filter(Boolean);
      if (skillsArr.length > 20) {
        setError("スキルは20個以内で入力してください。");
        setSaving(false);
        return;
      }
      await onSave(skillsArr);
    } catch {
      setError("保存時にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4 mb-4">
      <label className="block font-semibold mb-1 mt-2">できること（カンマ区切りで入力）</label>
      <input
        className="w-full border rounded p-2 mb-3 text-sm"
        value={skillsValue}
        onChange={e => setSkillsValue(e.target.value)}
        placeholder="例: ライティング, 編集, 企画"
      />
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
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

export default ProfileSkillsEditInline;
