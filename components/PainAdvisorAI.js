"use client";
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Droplet, Sparkles } from 'lucide-react';

const stepsFlow = [
  { id: 0, title: 'How intense is your pain?', key: 'pain' },
  { id: 1, title: 'How is your flow today?', key: 'blood' },
  { id: 2, title: 'Add any symptoms (optional)', key: 'text' },
  { id: 3, title: 'Your personalized advice', key: 'result' },
];

export default function PainAdvisorAI(){
  const [step, setStep] = useState(0);
  const [pain, setPain] = useState(0);
  const [blood, setBlood] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const canNext = useMemo(() => {
    if (step === 0) return true; // pain selected
    if (step === 1) return true; // blood selected
    if (step === 2) return true; // text optional
    return false;
  }, [step]);

  async function getAdvice(){
    setLoading(true);
    setAdvice(null);
    try {
      const res = await fetch('/api/ai/pain-advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pain, blood, symptomsText: text }) });
      const data = await res.json();
      if (data?.advice) setAdvice(data.advice);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (step === 3) getAdvice(); }, [step]);

  function SeverityBar({ value }){
    const pct = Math.max(0, Math.min(100, value ?? (pain*25 + blood*12)));
    return (
      <div className="h-3 w-full rounded-full bg-rose-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400" style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <div className="glass p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4"><Sparkles className="size-5 text-pink-600"/> <span className="font-semibold">Pain Advisor (AI)</span></div>
      <div className="mb-3"><SeverityBar /></div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
            <div className="text-sm text-gray-700 dark:text-zinc-300">How intense is your pain?</div>
            <div className="grid grid-cols-5 gap-2">
              {[0,1,2,3,4].map(v => (
                <button key={v} onClick={()=>setPain(v)} className={`px-3 py-2 rounded-lg border ${v===pain? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white/70 dark:bg-zinc-800/50'}`}>{v}</button>
              ))}
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="s1" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
            <div className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-2"><Droplet className="size-4 text-pink-600"/> Flow level</div>
            <div className="grid grid-cols-5 gap-2">
              {[0,1,2,3,4].map(v => (
                <button key={v} onClick={()=>setBlood(v)} className={`px-3 py-2 rounded-lg border ${v===blood? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white/70 dark:bg-zinc-800/50'}`}>{v}</button>
              ))}
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
            <div className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-2"><Activity className="size-4 text-orange-500"/> Describe symptoms (optional)</div>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g., cramps, nausea" className="w-full border rounded px-3 py-2"/>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
            {loading && <div className="text-sm text-gray-600">Thinking…</div>}
            {!loading && advice && (
              <div className="space-y-3">
                {typeof advice.severity === 'number' && <SeverityBar value={advice.severity} />}
                {advice.summary && <div className="text-sm">{advice.summary}</div>}
                {Array.isArray(advice.steps) && advice.steps.length>0 && (
                  <ol className="list-decimal ml-5 space-y-1 text-sm">
                    {advice.steps.map((s,i)=>(<li key={i}><span className="font-medium">{s.title}</span> — {s.detail}</li>))}
                  </ol>
                )}
                {advice.whenToSeekCare && <div className="text-xs text-gray-500">{advice.whenToSeekCare}</div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <button disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))} className="px-3 py-1.5 rounded-full bg-white/70 dark:bg-zinc-800/70 border border-rose-100/60 disabled:opacity-50">Back</button>
        {step<3 && <button disabled={!canNext} onClick={()=>setStep(s=>Math.min(3,s+1))} className="px-4 py-1.5 rounded-full text-white bg-gradient-to-r from-pink-500 to-orange-400 shadow hover:shadow-[0_0_25px_rgba(255,111,97,0.45)] disabled:opacity-50">Next</button>}
      </div>
    </div>
  );
}
