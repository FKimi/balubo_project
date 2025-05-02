/**
 * 日付文字列（YYYY-MM または YYYY-MM-DD）→「YYYY年M月」形式に変換
 * @param dateString 日付文字列
 * @returns YYYY年M月 or 空文字列
 */
export function formatYearMonth(dateString?: string): string {
  if (!dateString) return '';
  // YYYY-MM or YYYY-MM-DD のどちらも対応
  const match = dateString.match(/^(\d{4})-(\d{2})/);
  if (!match) return '';
  const year = match[1];
  const month = String(Number(match[2])); // 先頭ゼロ除去
  return `${year}年${month}月`;
}
