// Tailwind/shadcn用のクラス結合ユーティリティ
export function cn(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(' ');
}
