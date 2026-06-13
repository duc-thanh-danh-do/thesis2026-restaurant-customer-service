import { ReactNode } from 'react';

interface DesktopLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DesktopLayout({ children, className = '' }: DesktopLayoutProps) {
  return (
    <div className={`min-h-screen bg-[#f5f9fc] ${className}`}>
      {children}
    </div>
  );
}

interface StaffSidebarProps {
  title: string;
  subtitle?: string;
  tables: Array<{
    id: string;
    name: string;
    warning?: boolean;
    timestamp: string;
    preview: string;
    badges: Array<{ text: string; color: 'orange' | 'blue' | 'green' }>;
  }>;
  selectedTable?: string;
  onTableSelect: (tableId: string) => void;
}

export function StaffSidebar({
  title,
  subtitle,
  tables,
  selectedTable,
  onTableSelect
}: StaffSidebarProps) {
  return (
    <div className="w-80 h-full bg-[#142653] p-5 flex flex-col">
      <div className="mb-6">
        <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-2">
          STAFF DASHBOARD
        </p>
        <h1 className="text-xl font-bold text-white mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/80">{subtitle}</p>
        )}
        <button className="mt-3 px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full hover:bg-white/20 transition-colors">
          Menu admin
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableSelect(table.id)}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              selectedTable === table.id
                ? 'bg-[#13275a] border border-white/20'
                : 'bg-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{table.name}</span>
              {table.warning && (
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              )}
            </div>
            <p className="text-xs text-white/60 mb-2">{table.timestamp}</p>
            <p className="text-xs text-white/80 mb-3 line-clamp-2">{table.preview}</p>
            <div className="flex flex-wrap gap-1">
              {table.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    badge.color === 'orange'
                      ? 'bg-orange-100 text-orange-700'
                      : badge.color === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface StaffHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export function StaffHeader({ title, subtitle, action }: StaffHeaderProps) {
  return (
    <div className="bg-white border-b border-[#d5e1ec] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            BISTRO AURORA
          </p>
          <h1 className="text-xl font-bold text-[#142653]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              action.variant === 'secondary'
                ? 'bg-white border border-[#d5e1ec] text-[#142653] hover:bg-[#f5f9fc]'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}