"use client";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CalendarWidget({ onSelectDate }) {
  const [entries, setEntries] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [totalDuration, setTotalDuration] = useState(30);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({ blood: 0, mood: 0, pain: 0, sex: 0, notes: '' });

  useEffect(() => {
    fetch('/api/entries').then(r=>{
      if (r.status===401) return { entries: [] };
      return r.json();
    }).then(d=> {
      setEntries(d.entries || []);
      if (d.settings) {
        if (d.settings.cycleDuration) setTotalDuration(d.settings.cycleDuration);
        if (d.settings.periodDuration) setPeriodDuration(d.settings.periodDuration);
      }
    }).catch(()=>{});
  }, []);

  const lastStartDate = useMemo(() => {
    // find the most recent date with blood > 0
    const filtered = entries.filter(e => (e.blood||0) > 0).sort((a,b)=> new Date(b.date) - new Date(a.date));
    return filtered.length ? new Date(filtered[0].date) : null;
  }, [entries]);

  function tileClassName({ date, view }) {
    if (view !== 'month') return null;
    const key = new Date(date).toDateString();
    const e = entries.find(x => new Date(x.date).toDateString() === key);
    if (e && e.blood) return `blood-${e.blood}`;
    if (!lastStartDate) return null;
    const diffDays = Math.floor((date - lastStartDate) / (1000*60*60*24));
    if (diffDays >= 0 && diffDays < periodDuration) return 'predict-1';
    if (diffDays > 0 && (diffDays % totalDuration) < periodDuration) return 'predict-1';
    return null;
  }

  function findEntryByDate(dt) {
    const key = new Date(dt).toDateString();
    return entries.find(x => new Date(x.date).toDateString() === key) || null;
  }

  function onDayClick(date) {
    setCurrentDate(date);
    setSelected(findEntryByDate(date));
    const entry = findEntryByDate(date);
    if (entry) {
      setSelected(entry);
      setEditing(false);
      setOpen(true);
    } else {
      // If caller provided onSelectDate, notify it to prefill quick log
      if (typeof onSelectDate === 'function') {
        onSelectDate(date);
      }
    }
  }

  async function saveEdit() {
    try {
      const payload = {
        date: format(currentDate, 'yyyy-MM-dd'),
        blood: Number(editValues.blood || 0),
        mood: Number(editValues.mood || 0),
        pain: Number(editValues.pain || 0),
        sex: Number(editValues.sex || 0),
        notes: String(editValues.notes || ''),
      };
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const { entry } = await res.json();
      // Update local state
      setEntries((prev) => {
        const key = new Date(currentDate).toDateString();
        const idx = prev.findIndex(x => new Date(x.date).toDateString() === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return prev;
      });
      setSelected(entry);
      setEditing(false);
      toast.success('Entry updated');
    } catch (e) {
      toast.error('Could not update entry');
    }
  }

  return (
    <div className="space-y-2">
      <Calendar
        className="glass p-2"
        value={currentDate}
        onClickDay={onDayClick}
        tileClassName={tileClassName}
        // Force a consistent locale to avoid server/client aria-label mismatch
        locale="en-US"
        formatLongDate={(locale, date) =>
          date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        }
      />
      <div className="calendarLegend text-sm text-gray-600">
        <span className="dot red" /> Logged period
        <span className="dot pink" /> Predicted period
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={()=>setOpen(false)}>
          <div className="w-[92vw] max-w-md rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/50" onClick={e=>e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMM d, yyyy')}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Daily log details</p>
              </div>
              <button className="rounded-full px-2 py-1 text-sm text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10" onClick={()=>setOpen(false)}>Close</button>
            </div>
            {selected ? (
              <div className="space-y-4">
                {!editing && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
                      <p className="text-xs text-gray-500">Flow</p>
                      <p className="text-base font-medium">{['None','Light','Medium','Heavy','Very Heavy'][selected.blood||0]}</p>
                    </div>
                    <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
                      <p className="text-xs text-gray-500">Mood</p>
                      <p className="text-base font-medium">{['None','😀','🙂','😕','😫'][selected.mood||0]}</p>
                    </div>
                    <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
                      <p className="text-xs text-gray-500">Pain</p>
                      <p className="text-base font-medium">{['None','Mild','Moderate','Severe','Unbearable'][selected.pain||0]}</p>
                    </div>
                    <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
                      <p className="text-xs text-gray-500">Sex</p>
                      <p className="text-base font-medium">{['No','Yes','Protected'][selected.sex||0] || 'No'}</p>
                    </div>
                    {selected.notes && (
                      <div className="md:col-span-2 rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{selected.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                {editing && (
                  <form onSubmit={e=>{e.preventDefault(); saveEdit();}} className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs text-gray-500">Flow</label>
                      <select className="mt-1 w-full rounded border px-2 py-1" value={editValues.blood} onChange={e=>setEditValues(v=>({...v,blood:Number(e.target.value)}))}>
                        <option value={0}>None</option><option value={1}>Light</option><option value={2}>Medium</option><option value={3}>Heavy</option><option value={4}>Very Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Mood</label>
                      <select className="mt-1 w-full rounded border px-2 py-1" value={editValues.mood} onChange={e=>setEditValues(v=>({...v,mood:Number(e.target.value)}))}>
                        <option value={0}>None</option><option value={1}>😀</option><option value={2}>🙂</option><option value={3}>😕</option><option value={4}>😫</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Pain</label>
                      <select className="mt-1 w-full rounded border px-2 py-1" value={editValues.pain} onChange={e=>setEditValues(v=>({...v,pain:Number(e.target.value)}))}>
                        <option value={0}>None</option><option value={1}>Mild</option><option value={2}>Moderate</option><option value={3}>Severe</option><option value={4}>Unbearable</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Sex</label>
                      <select className="mt-1 w-full rounded border px-2 py-1" value={editValues.sex} onChange={e=>setEditValues(v=>({...v,sex:Number(e.target.value)}))}>
                        <option value={0}>No</option><option value={1}>Yes</option><option value={2}>Protected</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500">Notes</label>
                      <textarea className="mt-1 w-full rounded border px-2 py-1" rows={3} value={editValues.notes} onChange={e=>setEditValues(v=>({...v,notes:e.target.value}))} />
                    </div>
                    <div className="md:col-span-2 flex gap-2 mt-2">
                      <button type="submit" className="px-3 py-1 rounded bg-pink-600 text-white text-xs">Save changes</button>
                      <button type="button" onClick={()=>{ setEditing(false); }} className="px-3 py-1 rounded border text-xs">Cancel</button>
                    </div>
                  </form>
                )}
                {!editing && (
                  <div className="flex gap-2 pt-2">
                    <button className="px-3 py-1 rounded bg-pink-600 text-white text-xs" onClick={()=>{ setEditing(true); setEditValues({ blood:selected.blood||0, mood:selected.mood||0, pain:selected.pain||0, sex:selected.sex||0, notes:selected.notes||'' }); }}>Edit</button>
                    <button className="px-3 py-1 rounded border text-xs" onClick={()=>setOpen(false)}>Close</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">No log for this day.</div>
            )}
            <div className="mt-4 text-[11px] text-black/60 dark:text-white/60">Tip: Use the Quick log on the Home page to add or update today’s entry.</div>
          </div>
        </div>
      )}
    </div>
  );
}
