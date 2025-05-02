// 共通カードレイアウト: セクションごとに使う
import React from "react";
import { cn } from "../../lib/utils/cn";

interface ProfileCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  title,
  icon,
  children,
  className = "",
  description,
}) => (
  <section
    className={cn(
      "bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 flex flex-col",
      className
    )}
    aria-label={title}
  >
    <div className="flex items-center mb-2 gap-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <h2 className="text-lg md:text-xl font-bold">{title}</h2>
    </div>
    {description && (
      <p className="text-gray-500 text-xs mb-2 leading-snug">{description}</p>
    )}
    <div>{children}</div>
  </section>
);

export default ProfileCard;
