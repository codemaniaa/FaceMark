/**
 * FaceMark - Sidebar Navigation
 */
import React, {useState} from 'react'; 
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',    icon: '⬡',  roles: ['admin','teacher','student'] },
  { path: '/attendance',  label: 'Take Attendance', icon: '◎', roles: ['admin','teacher','student'] },
  { path: '/register',    label: 'Register Face', icon: '⊕',  roles: ['admin','teacher'] },
  { path: '/users',       label: 'Users',         icon: '⊞',  roles: ['admin'] },
  { path: '/reports',     label: 'Reports',       icon: '⊟',  roles: ['admin','teacher'] },
  { path: '/logs',        label: 'Audit Logs',    icon: '⊠',  roles: ['admin'] },
  { path: '/settings',    label: 'Settings',      icon: '⚙',  roles: ['admin','teacher','student'] },
];

export default function Sidebar() {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));
  const [show, setShow]=useState(true);
   
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className={`${show ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-card border-r border-border flex flex-col h-screen`}>
      {/* Brand */}
      <div className="p-6 border-b border-border">
       <button
  onClick={() => setShow(!show)}
  className="text-white text-lg"
>
  ☰
</button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-lg">
            👁
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">FaceMark</h1>
            <p className="text-xs text-slate-500">Attendance System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-primary-600/20 text-primary-300 border border-primary-700/40'
                 : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {show && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role} · {user?.user_id}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-slate-500 hover:text-red-400 transition-colors px-1 py-1"
        >
          → Sign out
        </button>
      </div>
    </aside>
  );
}
