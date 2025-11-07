"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState('');
  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const f = new FormData(e.currentTarget);
    const email = f.get('email');
    const password = f.get('password');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) {
      const d = await res.json().catch(()=>({error:'Login failed'}));
      setErr(d.error || 'Login failed');
      return;
    }
    router.push('/');
  }
  return (
    <div className="min-h-[80vh] grid place-items-center">
      <div className="w-full max-w-md p-6 card">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-gray-600">Login to continue tracking your cycle</p>
        </div>
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input className="mt-1 w-full border rounded px-3 py-2" type="email" name="email" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input className="mt-1 w-full border rounded px-3 py-2" type="password" name="password" required />
          </div>
          <button type="submit" className="w-full mt-2 px-4 py-2 rounded bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow hover:shadow-md">Login</button>
        </form>
        <div className="text-center mt-3 text-sm text-gray-600">
          New here? <a className="text-pink-600" href="/signup">Create an account</a>
        </div>
      </div>
    </div>
  );
}
