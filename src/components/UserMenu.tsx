import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface UserMenuProps {
  /** Optional class for the trigger button (e.g. from page nav styles). */
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { user, vendorUser, loginType, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    loginType === 'vendor'
      ? (vendorUser?.username ?? 'Vendor')
      : (user?.name ?? user?.username ?? 'User');
  const displayEmail =
    loginType === 'vendor' ? undefined : (user?.username ?? '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 pl-3 pr-1 py-1',
            className
          )}
          aria-label="Open user menu"
        >
          <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate hidden sm:inline-block">
            {displayName}
          </span>
          <div className="flex items-center justify-center rounded-full w-7 h-7 bg-slate-100 text-slate-600">
            <User size={16} />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[220px] p-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#2563eb] bg-white text-[#2563eb]">
              <User size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-slate-900 truncate">{displayName}</span>
              {displayEmail ? (
                <span className="text-xs text-slate-500 truncate">{displayEmail}</span>
              ) : (
                <span className="text-xs text-slate-500">Vendor account</span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer text-slate-700 focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
