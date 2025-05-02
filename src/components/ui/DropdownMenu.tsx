import * as React from "react";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="focus:outline-none">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, icon, children }) => (
  <button
    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition rounded-md"
    onClick={onClick}
    type="button"
  >
    {icon}
    {children}
  </button>
);
