"use client";
import { useEffect, useMemo, useState, useCallback } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function GraphsPage(){
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const r = await fetch('/api/entries');
        if (!r.ok) throw new Error('entries fetch failed');
        const d = await r.json();
        if (alive) setEntries(d.entries || []);
      }catch{/* ignore */} finally{ if (alive) setLoading(false); }
    })();
    return ()=>{ alive = false; };
  },[]);

  const recent = useMemo(()=>{
    const sorted = [...entries].sort((a,b)=> new Date(a.date)-new Date(b.date));
    const cutoff = Date.now() - 1000*60*60*24*30;
    return sorted.filter(e=> new Date(e.date).getTime() >= cutoff);
  },[entries]);

  const lineData = useMemo(()=>{
    const labels = recent.map(e=> format(new Date(e.date), 'MM-dd'));
    return { labels, datasets:[
      { label:'Pain', data: recent.map(e=> e.pain||0), borderColor:'#f43f5e', backgroundColor:'#f43f5e33', tension:.35 },
      { label:'Flow', data: recent.map(e=> e.blood||0), borderColor:'#fb923c', backgroundColor:'#fb923c33', tension:.35 },
    ]};
  },[recent]);

  const pieData = useMemo(()=>{
    const counts = [0,0,0,0,0];
    for (const e of recent) counts[e.mood||0]++;
    return {
      labels: ['None','😀','🙂','😕','😫'],
      datasets: [{ data: counts, backgroundColor:['#e5e7eb','#22c55e','#60a5fa','#f59e0b','#ef4444'] }]
    };
  },[recent]);

  const MonthlyTrends = useCallback(({ entries }) => {
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
    return (<div style={{ height:220 }}><Line data={data} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true }}, scales:{ y:{ suggestedMin:0, suggestedMax:4 }}}} /></div>);
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
    return (<div style={{ height:260 }}><Line data={data} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true }}, scales:{ y:{ suggestedMin:0, suggestedMax:4 }}}} /></div>);
  },[]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">All graphs</h1>
            <p className="text-sm text-gray-600">Visual overview of your recent logs</p>
          </div>
        </div>
        <div className="mt-4" style={{ height:520 }}>
          <Line data={lineData} options={{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{ position:'top' }},
            interaction:{ mode:'index', intersect:false },
            scales:{ x:{ ticks:{ maxRotation:0 }}, y:{ suggestedMin:0, suggestedMax:4, ticks:{ stepSize:1 }}}
          }} />
        </div>
      </div>
      {/* Side-by-side: Mood & Irregularities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
          <p className="mb-2 text-sm font-medium">Mood distribution</p>
          <div style={{ height:360 }}><Pie data={pieData} options={{ plugins:{ legend:{ position:'right' }}}} /></div>
        </div>
        <IrregularitiesPanel entries={entries} />
      </div>

      {/* Full-width Monthly trends */}
      <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Monthly trends (average pain & flow)</p>
          <span className="text-[11px] text-gray-500">Aggregated by month</span>
        </div>
        <MonthlyTrends entries={entries} />
      </div>

      {/* Full-width Yearly summary */}
      <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Yearly summary (average pain & flow)</p>
          <span className="text-[11px] text-gray-500">Year over year</span>
        </div>
        <YearlyTrends entries={entries} />
      </div>
    </div>
  );
}

function IrregularitiesPanel({ entries }){
  const [expected, setExpected] = useState(30);
  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const r = await fetch('/api/entries');
        const d = await r.json();
        if (alive) setExpected(d?.settings?.cycleDuration || 30);
      }catch{}
    })();
    return ()=>{ alive=false };
  },[]);

  const irregular = useMemo(()=>{
    if (!entries?.length) return null;
    const byDay = new Map();
    for (const e of entries) {
      const ds = new Date(e.date).toISOString().slice(0,10);
      byDay.set(ds, Math.max(byDay.get(ds)||0, e.blood||0));
    }
    const bleedDays = new Set([...byDay.entries()].filter(([,v])=> v>0).map(([k])=>k));
    const prevDay = (ds)=>{ const d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); };
    const startDays = [...bleedDays].filter(ds => !bleedDays.has(prevDay(ds))).sort();
    if (startDays.length < 2) return { startDays, expected, intervals: [], last: null };
    const intervals = [];
    for (let i=1;i<startDays.length;i++){
      const a = new Date(startDays[i-1]+'T00:00:00');
      const b = new Date(startDays[i]+'T00:00:00');
      const diff = Math.round((b-a)/(1000*60*60*24));
      intervals.push({ from:startDays[i-1], to:startDays[i], days:diff });
    }
    const last = intervals[intervals.length-1];
    let deviation = null, direction = 'on-time';
    if (last){
      deviation = last.days - expected;
      if (deviation > 0) direction = 'late'; else if (deviation < 0) direction = 'early';
    }
    const absDev = Math.abs(deviation ?? 0);
    let intensity = 'Normal', color = 'text-green-600';
    if (absDev >= 10) { intensity='Severe'; color='text-rose-600'; }
    else if (absDev >= 6) { intensity='Moderate'; color='text-orange-600'; }
    else if (absDev >= 3) { intensity='Mild'; color='text-amber-600'; }
    const advice = intensity === 'Severe' ? 'This cycle varied significantly; consider consulting a clinician.'
      : intensity === 'Moderate' ? 'Monitor upcoming cycles and consider medical advice if persistent.'
      : 'Slight variation is common. Continue tracking.';
    return { startDays, expected, intervals, last, deviation, direction, intensity, color, advice };
  },[entries, expected]);

  return (
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
          <p className="text-gray-600">{irregular.advice}</p>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Recent cycle lengths</p>
            <ul className="text-xs text-gray-700 list-disc pl-5">
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
  );
}
