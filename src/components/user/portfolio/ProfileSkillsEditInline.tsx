import React, { useState } from "react";
import { Button } from "../../ui/Button";

type Props = {
  skills: string | null;
  onSave: (skills: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

const ProfileSkillsEditInline: React.FC<Props> = ({ skills, onSave, onCancel, loading, error }) => {
  const [value, setValue] = useState(skills || "");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSave = async () => {
    setLocalError(null);
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await onSave(value);
      setSaveSuccess(true);
      
      // 保存が成功したら1秒後に表示モードに切り替え
      setTimeout(() => {
        setEditing(false);
      }, 1000);
    } catch (error) {
      console.error('保存中にエラーが発生しました:', error);
      setLocalError("保存処理中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setLocalError(null);
    setSaveSuccess(false);
  };

  if (!editing) {
    // 表示モード
    const skillList = value.split(',').map(s => s.trim()).filter(s => s);
    
    return (
      <div className="bg-white rounded-lg p-4 mb-6">
        {skillList.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {skillList.map((skill, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic mb-4">できることはまだ登録されていません</p>
        )}
        <Button onClick={handleEdit}>
          編集する
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-6">
      <textarea
        className="w-full border rounded p-2 mb-2"
        value={value}
        onChange={handleChange}
        rows={6}
        placeholder="スキル・技術・得意分野を入力してください"
      />
      <p className="text-sm text-gray-500 mb-2">
        カンマ(,)区切りで複数入力できます。例: デザイン, イラスト, 記事執筆
      </p>
      {(localError || error) && (
        <div className="text-red-500 text-xs mb-2">{localError || error}</div>
      )}
      {saveSuccess && (
        <div className="text-green-500 text-xs mb-2">保存しました！</div>
      )}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving || loading ? "保存中..." : "保存"}
        </Button>
        <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving || loading}>
          キャンセル
        </Button>
      </div>
    </div>
  );
};

export default ProfileSkillsEditInline;
