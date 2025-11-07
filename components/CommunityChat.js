"use client";
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunityChat(){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  async function load(initial=false){
    try{
      const r = await fetch('/api/community/messages');
      if (!r.ok) throw new Error('load failed');
      const d = await r.json();
      const arr = (d.messages||[]).reverse(); // oldest first
      setMessages(arr);
      if (initial) setTimeout(()=> endRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
    }catch(e){ /* ignore */ }
  }

  useEffect(()=>{
    let alive = true;
    load(true);
    const t = setInterval(()=>{ if (alive) load(false); }, 3000);
    return ()=>{ alive = false; clearInterval(t); };
  },[]);

  async function send(){
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    try{
      const r = await fetch('/api/community/messages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ text }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error||'send failed');
      setInput('');
      await load(false);
      endRef.current?.scrollIntoView({ behavior:'smooth' });
    }catch(e){ toast.error(e.message||'Could not send'); }
    finally{ setLoading(false); }
  }

  function onKey(e){ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); if(!loading) send(); } }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
      <div className="border-b border-white/20 p-3 text-sm font-medium dark:border-white/10">Community chat</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m)=>{
          const isMine = false; // server doesn’t include identity; keep neutral UI
          return (
            <div key={m._id} className={`flex ${isMine? 'justify-end':'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isMine? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white':'bg-white/80 dark:bg-white/10 border border-white/20 dark:border-white/10'}`}>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">{m.name||'User'} • {new Date(m.createdAt).toLocaleString()}</div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e)=>{ e.preventDefault(); if(!loading) send(); }} className="flex items-end gap-2 border-t border-white/20 p-3 dark:border-white/10">
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder="Share a question or tip…"
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-black placeholder:text-black/50 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:border-pink-500 dark:focus:ring-pink-800/40" />
        <button type="submit" disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white shadow-md shadow-pink-500/30 hover:bg-pink-600 disabled:opacity-60">
          <Send size={16}/> Send
        </button>
      </form>
    </div>
  );
}
