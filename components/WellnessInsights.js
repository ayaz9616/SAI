"use client";
import { useEffect, useMemo, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { useCallback } from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

export default function WellnessInsights({ minimal = false }){
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [settings, setSettings] = useState({ cycleDuration: 30, periodDuration: 5 });

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const r = await fetch('/api/entries');
        if (!r.ok) throw new Error('entries fetch failed');
        const d = await r.json();
        if (alive) {
          setEntries(d.entries || []);
          if (d.settings) setSettings({
            cycleDuration: d.settings.cycleDuration ?? 30,
            periodDuration: d.settings.periodDuration ?? 5,
          });
        }
      }catch{ /* ignore */ }
      finally{ if (alive) setLoading(false); }
    })();
    return ()=>{ alive = false; };
  },[]);

  const recent = useMemo(()=>{
    const sorted = [...entries].sort((a,b)=> new Date(a.date)-new Date(b.date));
    const cutoff = Date.now() - 1000*60*60*24*30; // last 30 days
    return sorted.filter(e=> new Date(e.date).getTime() >= cutoff);
  },[entries]);

  // Fetch AI-generated report for serious issues (server side chat attaches logs)
  async function fetchAIReport(){
    try{
      const r = await fetch('/api/ai/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ history:[], message: 'Please analyze my recent menstrual logs for any serious issues, red flags, and suggested next steps. Provide a short "Serious issues" summary and personalized tips.' }) });
      const d = await r.json();
      if (d?.reply) setAiReport(d.reply);
    }catch(e){ /* ignore */ }
  }

  // Compute Menstrual Wellness Index (0-100, higher is better)
  const mwi = useMemo(()=>{
    if (!recent.length) return 100;
    const avg = (key)=> recent.reduce((s,e)=> s + (e[key]||0),0)/recent.length;
    const avgPain = avg('pain');
    const avgBlood = avg('blood');
    const avgMood = avg('mood');
    const penalty = avgPain*15 + avgBlood*8 + Math.max(0, (avgMood-2))*10;
    return Math.round(clamp(100 - penalty, 0, 100));
  },[recent]);

  const tips = useMemo(()=>{
    const arr = [];
    const avg = (key)=> recent.length ? recent.reduce((s,e)=> s + (e[key]||0),0)/recent.length : 0;
    const avgPain = avg('pain');
    const avgBlood = avg('blood');
    const avgMood = avg('mood');
    if (avgPain >= 2) arr.push('Apply heat (15–20 min), try gentle stretches, and consider OTC NSAIDs if safe for you.');
    if (avgBlood >= 3) arr.push('Track pad/tampon usage; if soaking ≥1 per hour for >2 hours, seek medical advice.');
    if (avgMood >= 3) arr.push('Prioritize sleep, hydration, regular meals; brief daylight walks can help mood.');
    if (!arr.length) arr.push('Great trends! Keep logging daily to personalize insights further.');
    return arr;
  },[recent]);

  const lineData = useMemo(()=>{
    const labels = recent.map(e=> format(new Date(e.date), 'MM-dd'));
    return {
      labels,
      datasets: [
        { label: 'Pain', data: recent.map(e=> e.pain||0), borderColor: '#f43f5e', backgroundColor: '#f43f5e66', tension: .35 },
        { label: 'Flow', data: recent.map(e=> e.blood||0), borderColor: '#fb923c', backgroundColor: '#fb923c66', tension: .35 },
      ]
    };
  },[recent]);

  const pieData = useMemo(()=>{
    const counts = [0,0,0,0,0];
    for (const e of recent) counts[e.mood||0]++;
    return {
      labels: ['None','😀','🙂','😕','😫'],
      datasets: [{
        data: counts,
        backgroundColor: ['#e5e7eb','#22c55e','#60a5fa','#f59e0b','#ef4444'],
      }]
    };
  },[recent]);

  // Irregularities: detect period start dates and compare cycle lengths against expected
  const irregular = useMemo(() => {
    if (!entries?.length) return null;
    // map date string -> blood
    const byDay = new Map();
    for (const e of entries) {
      const ds = new Date(e.date).toISOString().slice(0,10);
      byDay.set(ds, Math.max(byDay.get(ds)||0, e.blood||0));
    }
    // set of days with any bleeding
    const bleedDays = new Set([...byDay.entries()].filter(([,v]) => v>0).map(([k]) => k));
    // helpers
    const prevDay = (ds) => {
      const d = new Date(ds + 'T00:00:00');
      d.setDate(d.getDate()-1);
      return d.toISOString().slice(0,10);
    };
    // start days: bleed today and not bleeding yesterday
    const startDays = [...bleedDays].filter(ds => !bleedDays.has(prevDay(ds))).sort();
    if (startDays.length < 2) return { startDays, expected: settings.cycleDuration, intervals: [], last: null };
    const intervals = [];
    for (let i=1;i<startDays.length;i++) {
      const a = new Date(startDays[i-1]+'T00:00:00');
      const b = new Date(startDays[i]+'T00:00:00');
      const diff = Math.round((b - a) / (1000*60*60*24));
      intervals.push({ from: startDays[i-1], to: startDays[i], days: diff });
    }
    const expected = Number(settings.cycleDuration || 30);
    const last = intervals[intervals.length-1];
    let deviation = null, direction = 'on-time';
    if (last) {
      deviation = last.days - expected; // positive = late, negative = early
      if (deviation > 0) direction = 'late';
      else if (deviation < 0) direction = 'early';
    }
    const absDev = Math.abs(deviation ?? 0);
    let intensity = 'Normal'; let color = 'text-green-600';
    if (absDev >= 10) { intensity = 'Severe'; color = 'text-rose-600'; }
    else if (absDev >= 6) { intensity = 'Moderate'; color = 'text-orange-600'; }
    else if (absDev >= 3) { intensity = 'Mild'; color = 'text-amber-600'; }
    const advice = intensity === 'Severe'
      ? 'This cycle varied significantly from your usual length. Consider consulting a clinician, especially if this repeats or you have other concerning symptoms.'
      : intensity === 'Moderate'
        ? 'Some variability is common, but monitor upcoming cycles. If patterns persist or you have other symptoms, consider medical advice.'
        : 'Slight variation is common and usually not concerning. Continue tracking.';
    return { startDays, expected, intervals, last, deviation, direction, intensity, color, advice };
  }, [entries, settings]);

  // Monthly trends helper component (client-only small chart)
  const MonthlyTrends = useCallback(({ entries }) => {
    // group by month-year
    const map = {};
    for (const e of entries) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map[key]) map[key] = { painSum:0, flowSum:0, cnt:0 };
      map[key].painSum += e.pain||0;
      map[key].flowSum += e.blood||0;
      map[key].cnt += 1;
    }
    const labels = Object.keys(map).sort();
    const painData = labels.map(l => Math.round(map[l].painSum / map[l].cnt * 10)/10);
    const flowData = labels.map(l => Math.round(map[l].flowSum / map[l].cnt * 10)/10);
    const data = { labels, datasets:[ { label:'Avg pain', data: painData, borderColor:'#f43f5e' }, { label:'Avg flow', data: flowData, borderColor:'#fb923c' } ] };
    return (<div style={{ height:180 }}><Line data={data} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true }}, scales:{ y:{ suggestedMin:0, suggestedMax:4 }}}} /></div>);
  },[]);

  const YearlyTrends = useCallback(({ entries }) => {
    const map = {};
    for (const e of entries) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}`;
      if (!map[key]) map[key] = { painSum:0, flowSum:0, cnt:0 };
      map[key].painSum += e.pain||0;
      map[key].flowSum += e.blood||0;
      map[key].cnt += 1;
    }
    const labels = Object.keys(map).sort();
    const painData = labels.map(l => Math.round(map[l].painSum / map[l].cnt * 10)/10);
    const flowData = labels.map(l => Math.round(map[l].flowSum / map[l].cnt * 10)/10);
    const data = { labels, datasets:[ { label:'Avg pain', data: painData, borderColor:'#f43f5e' }, { label:'Avg flow', data: flowData, borderColor:'#fb923c' } ] };
    return (<div style={{ height:220 }}><Line data={data} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true }}, scales:{ y:{ suggestedMin:0, suggestedMax:4 }}}} /></div>);
  },[]);

  return (
    <div className="space-y-8">
      {/* Primary big chart full width */}
      <div className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-lg font-semibold">Pain & flow (last 30 days)</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">Daily pattern of pain and menstrual flow</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200" onClick={()=>{ setOpen(true); fetchAIReport(); }}>Open full report</button>
          </div>
        </div>
        <div style={{ height: 480 }} className="mt-4">
          <Line data={lineData} options={{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{ position:'top' }},
            interaction:{ mode:'index', intersect:false },
            scales:{
              x:{ ticks:{ maxRotation:0 }},
              y:{ suggestedMin:0, suggestedMax:4, ticks:{ stepSize:1 } }
            }
          }} />
        </div>
      </div>

      {/* Secondary charts row */}
      {minimal ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            <p className="mb-2 text-sm font-medium">Irregularities</p>
            {irregular?.last ? (
              <div className="space-y-2 text-sm">
                <p>
                  Last cycle: {irregular.last.days} days (expected {irregular.expected}).
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${irregular.color}`}>{irregular.intensity}</span>
                </p>
                {irregular.deviation !== null && (
                  <p>Deviation: {Math.abs(irregular.deviation)} days {irregular.direction}.</p>
                )}
                <p className="text-gray-600 dark:text-gray-300">{irregular.advice}</p>
                {irregular.intensity === 'Severe' && (
                  <ul className="list-disc pl-5 text-[13px] text-rose-600">
                    <li>Seek care if cycles remain highly irregular for 3+ months.</li>
                    <li>Seek urgent care for very heavy bleeding, fainting, fever, or severe pain.</li>
                  </ul>
                )}
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Recent cycle lengths</p>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 list-disc pl-5">
                    {irregular.intervals.slice(-5).reverse().map((it, idx)=> (
                      <li key={idx}>{it.from} → {it.to}: {it.days} days ({Math.abs(it.days - irregular.expected)} off)</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Not enough data to analyze cycle irregularity yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            <p className="mb-2 text-sm font-medium">Mood distribution</p>
            <div style={{ height:300 }}><Pie data={pieData} options={{ plugins:{ legend:{ position:'right' }}}} /></div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            <p className="mb-2 text-sm font-medium">Monthly trends (avg pain & flow)</p>
            <MonthlyTrends entries={entries} />
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            <p className="mb-2 text-sm font-medium">Irregularities</p>
            {irregular?.last ? (
              <div className="space-y-2 text-sm">
                <p>
                  Last cycle: {irregular.last.days} days (expected {irregular.expected}).
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${irregular.color}`}>{irregular.intensity}</span>
                </p>
                {irregular.deviation !== null && (
                  <p>Deviation: {Math.abs(irregular.deviation)} days {irregular.direction}.</p>
                )}
                <p className="text-gray-600 dark:text-gray-300">{irregular.advice}</p>
                {irregular.intensity === 'Severe' && (
                  <ul className="list-disc pl-5 text-[13px] text-rose-600">
                    <li>Seek care if cycles remain highly irregular for 3+ months.</li>
                    <li>Seek urgent care for very heavy bleeding, fainting, fever, or severe pain.</li>
                  </ul>
                )}
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Recent cycle lengths</p>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 list-disc pl-5">
                    {irregular.intervals.slice(-5).reverse().map((it, idx)=> (
                      <li key={idx}>{it.from} → {it.to}: {it.days} days ({Math.abs(it.days - irregular.expected)} off)</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Not enough data to analyze cycle irregularity yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Below charts: MWI gauge + tips + AI report trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
          <p className="text-sm text-gray-600 dark:text-gray-300">Menstrual Wellness Index</p>
          <div className="mx-auto my-4 h-32 w-32 rounded-full" style={{ background: `conic-gradient(#ec4899 ${mwi*3.6}deg, #e5e7eb ${mwi*3.6}deg)` }}>
            <div className="grid h-full w-full place-items-center rounded-full">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white/90 text-3xl font-semibold dark:bg-black/60">{mwi}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Higher is better • last 30 days</p>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
          <p className="mb-2 text-sm font-medium">Personalized tips</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
            {tips.map((t,i)=> <li key={i}>{t}</li>)}
          </ul>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">General guidance, not medical advice.</p>
          <div className="mt-3">
            <button className="text-xs px-3 py-1.5 rounded bg-pink-600 text-white" onClick={()=>{ setOpen(true); fetchAIReport(); }}>Open detailed AI report</button>
          </div>
        </div>
      </div>
      {/* Full report modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-6">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-6 dark:bg-black/70 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Full Health Report</h2>
                <p className="text-sm text-gray-600">Comprehensive view of your recent logs, trends, and flagged issues.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm px-3 py-1 rounded bg-gray-100" onClick={()=>{ setOpen(false); }}>Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border p-4 bg-white/50">
                <p className="text-sm text-gray-600">Menstrual Wellness Index (30d)</p>
                <div className="my-4 h-36 w-36 mx-auto" style={{ background: `conic-gradient(#ec4899 ${mwi*3.6}deg, #e5e7eb ${mwi*3.6}deg)` }}>
                  <div className="grid h-full w-full place-items-center rounded-full">
                    <div className="grid h-28 w-28 place-items-center rounded-full bg-white/90 text-3xl font-semibold dark:bg-black/60">{mwi}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Higher is better • last 30 days</p>
              </div>

              <div className="lg:col-span-2 rounded-2xl border p-4">
                <p className="text-sm font-medium">Pain & flow (last 30 days)</p>
                <div style={{ height: 360 }} className="mt-2"><Line data={lineData} options={{ responsive:true, maintainAspectRatio:false }} /></div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Monthly trends</p>
                <div className="mt-2"><MonthlyTrends entries={entries} /></div>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Yearly summary</p>
                <div className="mt-2"><YearlyTrends entries={entries} /></div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-4">
              <p className="text-sm font-medium">AI review — Serious issues & personalized tips</p>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{aiReport || 'AI report will appear here once generated.'}</div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-2 rounded bg-pink-600 text-white" onClick={()=>fetchAIReport()}>Refresh AI report</button>
                <button className="px-3 py-2 rounded border" onClick={()=>setAiReport('')}>Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
