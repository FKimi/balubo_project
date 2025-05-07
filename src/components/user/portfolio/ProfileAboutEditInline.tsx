import React, { useState } from "react";
import { Button } from "../../ui/Button";

type Props = {
  about: string;
  onSave: (about: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

const ProfileAboutEditInline: React.FC<Props> = ({ about, onSave, onCancel, loading, error }) => {
  const [value, setValue] = useState(about || "");
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

  const handleCancel = () => {
    setEditing(false);
    setValue(about); // 元の値に戻す
    onCancel(); // 親コンポーネントのキャンセルハンドラを呼び出す
  };

  if (!editing) {
    return (
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="whitespace-pre-line text-gray-600 mb-4">
          {value || <span className="text-gray-400 italic">自己紹介はまだ登録されていません</span>}
        </div>
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
      />
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
        <Button variant="secondary" onClick={handleCancel} disabled={saving || loading}>
          キャンセル
        </Button>
      </div>
    </div>
  );
};

export default ProfileAboutEditInline;
