"use client";
import { useEffect, useState } from 'react';

import { Flame, CalendarDays } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(r=>r.json()).then(d=>setUser(d.user || null)).catch(()=>{});
    fetch('/api/profile').then(r=>r.json()).then(d=>setProfile(d.user || null)).catch(()=>{});
  }, []);
  async function logout(){
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/login';
  }
  return (
    <div className="sticky top-0 z-20 bg-gradient-to-r from-rose-50/70 to-orange-50/70 backdrop-blur border-b border-rose-100/60">
      <div className="container flex items-center gap-4 py-3">
        <a href="/" className="font-semibold flex items-center gap-2 text-pink-700">
          <Flame className="size-5 text-orange-500" />
          <span>Pink Diary</span>
        </a>
        {user && <>
          <a href="/" className="text-sm flex items-center gap-1 hover:text-pink-700"><CalendarDays className="size-4"/> Home</a>
          <a href="/add" className="text-sm hover:text-pink-700">Log symptoms</a>
          <a href="/graphs" className="text-sm hover:text-pink-700">Analytics</a>
          <a href="/help" className="text-sm hover:text-pink-700">Help</a>
          <span className="ml-auto text-xs md:text-sm text-gray-600 dark:text-zinc-300 hidden sm:block">{user.email}</span>
          <a href="/settings" className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-rose-100/60 overflow-hidden">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="avatar" src={profile.avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-orange-300 text-white grid place-items-center text-xs font-semibold">
                {user.email?.slice(0,2).toUpperCase()}
              </div>
            )}
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/settings" className="text-xs md:text-sm text-gray-700 dark:text-zinc-300 hover:text-pink-700">Settings</a>
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow hover:shadow-[0_0_25px_rgba(255,111,97,0.45)]">Logout</button>
          </div>
        </>}
        {!user && <div className="ml-auto flex gap-2 items-center">
          <ThemeToggle />
          <a href="/login" className="text-sm px-3 py-1.5 rounded-full bg-white/70 hover:bg-white border border-rose-100">Login</a>
          <a href="/signup" className="text-sm px-3 py-1.5 rounded-full text-white bg-gradient-to-r from-pink-500 to-orange-400 shadow hover:shadow-[0_0_25px_rgba(255,111,97,0.45)]">Sign up</a>
        </div>}
      </div>
    </div>
  );
}
