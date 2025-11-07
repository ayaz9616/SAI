"use client";
import { useEffect, useState } from 'react';

export default function SettingsPage(){
  const [cycleDuration, setCycleDuration] = useState(30);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const d = await fetch('/api/profile').then(r=>r.json()).catch(()=>({}));
      if (d?.user) {
        if (d.user.cycleDuration) setCycleDuration(d.user.cycleDuration);
        if (d.user.periodDuration) setPeriodDuration(d.user.periodDuration);
      }
    })();
  }, []);

  async function save(e){
    e.preventDefault();
    setStatus('');
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ cycleDuration: Number(cycleDuration), periodDuration: Number(periodDuration) }) });
    if (!res.ok) { setStatus('Failed to save'); return; }
    setStatus('Saved');
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <form onSubmit={save} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600">Cycle length (days)</label>
          <input className="mt-1 w-full border rounded px-3 py-2" type="number" min={20} max={60} value={cycleDuration} onChange={e=>setCycleDuration(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Period length (days)</label>
          <input className="mt-1 w-full border rounded px-3 py-2" type="number" min={1} max={10} value={periodDuration} onChange={e=>setPeriodDuration(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <button className="px-4 py-2 rounded bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow hover:shadow-[0_0_25px_rgba(255,111,97,0.45)]">
            Save settings
          </button>
          {status && <span className="ml-3 text-sm text-gray-600">{status}</span>}
        </div>
      </form>
    </div>
  );
}
