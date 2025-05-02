import React, { useState } from "react";
import { Button } from "../../ui/Button";

interface Props {
  about: string;
  onSave: (about: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ProfileAboutEditInline: React.FC<Props> = ({ about, onSave, onCancel, loading }) => {
  const [aboutValue, setAboutValue] = useState(about || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (aboutValue.length > 500) {
        setError("自己紹介は500文字以内で入力してください。");
        setSaving(false);
        return;
      }
      await onSave(aboutValue);
    } catch {
      setError("保存時にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4 mb-4">
      <label className="block font-semibold mb-1">自己紹介</label>
      <textarea
        className="w-full border rounded p-2 mb-3 text-sm"
        rows={4}
        value={aboutValue}
        onChange={e => setAboutValue(e.target.value)}
        maxLength={500}
        placeholder="自己紹介を入力してください（500文字以内）"
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

export default ProfileAboutEditInline;
