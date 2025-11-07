"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HealthChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm Pink Diary Chat. I can help with menstrual pain, PMS, irregular cycles, and self-care tips. How can I support you today? (This is general guidance, not medical advice.)",
    },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage() {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: next, message: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      toast.error('Chatbot error. Please try again.');
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
        aria-label="Open menstrual health chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-24 right-6 z-40 w-[90vw] max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-0 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/50"
            role="dialog"
            aria-label="Pink Diary Chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 bg-gradient-to-r from-pink-500/20 via-rose-400/20 to-orange-400/20 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-pink-500 text-white"><Bot size={18} /></div>
                <div>
                  <p className="text-sm font-semibold">Pink Diary Chat</p>
                  <p className="text-xs text-black/60 dark:text-white/60">Menstrual health guidance</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="max-h-[50vh] min-h-[280px] space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white'
                        : 'bg-white/80 text-black dark:bg-white/10 dark:text-white border border-white/20 dark:border-white/10'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/20 bg-white/80 px-4 py-3 text-sm text-black dark:border-white/10 dark:bg-white/10 dark:text-white">
                    Typing…
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) sendMessage();
              }}
              className="flex items-end gap-2 border-t border-white/20 p-3 dark:border-white/10"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask about cramps, PMS, late period, heavy flow, etc."
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-black placeholder:text-black/50 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:border-pink-500 dark:focus:ring-pink-800/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white shadow-md shadow-pink-500/30 hover:bg-pink-600 disabled:opacity-60"
              >
                <Send size={16} /> Send
              </button>
            </form>

            {/* Footer disclaimer */}
            <div className="px-4 pb-3 text-[11px] text-black/60 dark:text-white/60">
              This chatbot offers general guidance only and is not a substitute for professional medical advice. If you have severe symptoms or emergencies, seek care immediately.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
