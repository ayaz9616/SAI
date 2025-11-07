"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [err, setErr] = useState('');
  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const f = new FormData(e.currentTarget);
    const email = f.get('email');
    const password = f.get('password');
    const name = f.get('name');
    const age = Number(f.get('age') || '');
    const heightCm = Number(f.get('heightCm') || '');
    const weightKg = Number(f.get('weightKg') || '');
    const firstPeriodAge = f.get('firstPeriodAge') ? Number(f.get('firstPeriodAge')) : undefined;
    const primaryConcern = f.get('primaryConcern') || '';
    const cycleDuration = Number(f.get('cycleDuration') || '');
    const periodDuration = Number(f.get('periodDuration') || '');
    const payload = { email, password, name, age, heightCm, weightKg, firstPeriodAge, primaryConcern, cycleDuration, periodDuration };
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const d = await res.json().catch(()=>({error:'Signup failed'}));
      setErr(d.error || 'Signup failed');
      return;
    }
    // After signup, redirect to login
    router.push('/login');
  }
  return (
    <div className="min-h-[80vh] grid place-items-center">
      <div className="w-full max-w-2xl p-6 card">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="text-sm text-gray-600">Join Pink Diary and track your cycle beautifully</p>
        </div>
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Name</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="text" name="name" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="email" name="email" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Password</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="password" name="password" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Age</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="age" min={10} max={60} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Height (cm)</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="heightCm" min={100} max={220} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Weight (kg)</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="weightKg" min={30} max={200} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Cycle length (days)</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="cycleDuration" min={20} max={60} placeholder="30" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Period length (days)</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="periodDuration" min={2} max={10} placeholder="5" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">First period age (optional)</label>
              <input className="mt-1 w-full border rounded px-3 py-2" type="number" name="firstPeriodAge" min={8} max={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Primary concern (optional)</label>
            <textarea className="mt-1 w-full border rounded px-3 py-2" name="primaryConcern" rows={3} placeholder="E.g., cramps, irregular cycles, mood, etc."></textarea>
          </div>

          <button type="submit" className="w-full mt-2 px-4 py-2 rounded bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow hover:shadow-md">Create account</button>
        </form>
        <div className="text-center mt-3 text-sm text-gray-600">
          Already have an account? <a className="text-pink-600" href="/login">Login</a>
        </div>
      </div>
    </div>
  );
}
