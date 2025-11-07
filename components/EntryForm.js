"use client";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Droplet, Smile, Activity, Heart } from 'lucide-react';
import { format } from 'date-fns';

export default function EntryForm({ onSaved, selectedDate }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blood, setBlood] = useState(0);
  const [mood, setMood] = useState(0);
  const [pain, setPain] = useState(0);
  const [sex, setSex] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  async function save(e){
    e?.preventDefault();
    setStatus('');
    const res = await fetch('/api/entries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, blood, mood, pain, sex, notes })});
    if (!res.ok) { setStatus('Failed to save'); toast.error('Save failed'); return; }
    setStatus('Saved');
    toast.success('Entry saved');
    onSaved?.();
  }

  // update date if parent selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      try {
        const d = format(new Date(selectedDate), 'yyyy-MM-dd');
        setDate(d);
      } catch (_) {}
    }
  }, [selectedDate]);

  return (
    <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-600">Date</label>
        <input type="date" className="mt-1 w-full border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-600">Notes (optional)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" rows={3} placeholder="Optional notes for this date" />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Flow</label>
        <select className="mt-1 w-full border rounded px-2 py-1" value={blood} onChange={e=>setBlood(Number(e.target.value))}>
          <option value={0}>None</option>
          <option value={1}>Light</option>
          <option value={2}>Medium</option>
          <option value={3}>Heavy</option>
          <option value={4}>Very Heavy</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600">Mood</label>
        <select className="mt-1 w-full border rounded px-2 py-1" value={mood} onChange={e=>setMood(Number(e.target.value))}>
          <option value={0}>None</option>
          <option value={1}>😀</option>
          <option value={2}>🙂</option>
          <option value={3}>😕</option>
          <option value={4}>😫</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600">Pain</label>
        <select className="mt-1 w-full border rounded px-2 py-1" value={pain} onChange={e=>setPain(Number(e.target.value))}>
          <option value={0}>None</option>
          <option value={1}>Mild</option>
          <option value={2}>Moderate</option>
          <option value={3}>Severe</option>
          <option value={4}>Unbearable</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600">Sex</label>
        <select className="mt-1 w-full border rounded px-2 py-1" value={sex} onChange={e=>setSex(Number(e.target.value))}>
          <option value={0}>No</option>
          <option value={1}>Yes</option>
          <option value={2}>Protected</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700">Save entry</button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
      <div className="md:col-span-2 mt-2 text-xs text-gray-600 flex items-center gap-4">
        <span className="inline-flex items-center gap-1"><Droplet className="size-3 text-pink-600"/> Flow</span>
        <span className="inline-flex items-center gap-1"><Smile className="size-3 text-rose-500"/> Mood</span>
        <span className="inline-flex items-center gap-1"><Activity className="size-3 text-orange-500"/> Pain</span>
        <span className="inline-flex items-center gap-1"><Heart className="size-3 text-pink-500"/> Sex</span>
      </div>
    </form>
  );
}
