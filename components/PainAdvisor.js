"use client";
import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

function advise({ pain=0, blood=0, text='' }){
  const t = text.toLowerCase();
  const tips = [];
  if (pain >= 3) tips.push('Consider ibuprofen (if safe for you) and a heating pad. Hydrate well.');
  if (pain === 4) tips.push('If pain is persistent and severe, consult a healthcare professional.');
  if (blood >= 3) tips.push('Heavy flow noted — monitor for dizziness or fatigue; seek advice if concerned.');
  if (t.includes('cramp') || t.includes('cramps')) tips.push('Gentle stretching and light movement can ease cramps.');
  if (t.includes('nausea')) tips.push('Ginger tea and small meals may help with nausea.');
  if (tips.length === 0) tips.push('Rest, warm compress, hydration, and balanced meals can help overall comfort.');
  return tips;
}

export default function PainAdvisor(){
  const [pain, setPain] = useState(0);
  const [blood, setBlood] = useState(0);
  const [text, setText] = useState('');
  const tips = useMemo(()=>advise({ pain, blood, text }), [pain, blood, text]);
  return (
    <div className="glass p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-2"><Sparkles className="size-4 text-pink-600"/> <span className="font-medium">Pain Advisor</span></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600">Pain</label>
          <select className="mt-1 w-full border rounded px-2 py-1" value={pain} onChange={e=>setPain(Number(e.target.value))}>
            <option value={0}>None</option>
            <option value={1}>Mild</option>
            <option value={2}>Moderate</option>
            <option value={3}>Severe</option>
            <option value={4}>Unbearable</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Flow</label>
          <select className="mt-1 w-full border rounded px-2 py-1" value={blood} onChange={e=>setBlood(Number(e.target.value))}>
            <option value={0}>None</option>
            <option value={1}>Light</option>
            <option value={2}>Medium</option>
            <option value={3}>Heavy</option>
            <option value={4}>Very Heavy</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-600">Describe symptoms</label>
          <input className="mt-1 w-full border rounded px-2 py-1" value={text} onChange={e=>setText(e.target.value)} placeholder="e.g., cramps, nausea" />
        </div>
      </div>
      <ul className="mt-3 text-sm list-disc ml-5 space-y-1">
        {tips.map((t,i)=>(<li key={i}>{t}</li>))}
      </ul>
    </div>
  );
}
