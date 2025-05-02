import React from "react";

/**
 * デフォルトのアバターアイコン（SVG）
 * - 画像未登録ユーザー用
 * - カラーやサイズは親要素で調整可能
 */
const NoAvatar: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="bg-gradient-to-tr from-blue-100 to-green-100 rounded-full border-2 border-indigo-100"
  >
    <circle cx="28" cy="28" r="28" fill="#F3F4F6" />
    <circle cx="28" cy="22" r="10" fill="#E0E7EF" />
    <ellipse cx="28" cy="42" rx="14" ry="7" fill="#E0E7EF" />
    <text x="50%" y="57%" textAnchor="middle" fill="#A0AEC0" fontSize="12" fontWeight="bold" dy=".3em" fontFamily="sans-serif">
      No Image
    </text>
  </svg>
);

export default NoAvatar;
