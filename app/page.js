"use client";
import CalendarWidget from '../components/CalendarWidget';
import EntryForm from '../components/EntryForm';
import PainAdvisorAI from '../components/PainAdvisorAI';
import WellnessInsights from '../components/WellnessInsights';
import { useState } from 'react';

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  return (
    <div className="space-y-10">
      {/* Hero + Calendar */}
      <section className="section">
        <div className="rounded-3xl p-8 bg-gradient-to-r from-pink-500/10 via-rose-300/10 to-orange-300/10 border border-rose-100/50">
          <div className="grid gap-6 md:grid-cols-12 items-start">
            <div className="md:col-span-5 space-y-3">
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-500">Your cycle at a glance</h1>
              <p className="text-gray-700 md:text-lg">Central calendar, quick logging, AI guidance & rich insights — aligned for clarity.</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="/add" className="text-sm px-4 py-2 rounded-full text-white bg-gradient-to-r from-pink-500 to-orange-400 shadow hover:shadow-md">Log today</a>
                <a href="/help" className="text-sm px-4 py-2 rounded-full bg-white/70 border border-pink-100 hover:bg-white">Community</a>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="card p-4">
                <CalendarWidget key={refreshKey} onSelectDate={(d)=>{ setSelectedDate(d); const el=document.getElementById('quick-log'); el && el.scrollIntoView({ behavior:'smooth', block:'start'}); }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid: stack Pain Advisor under Quick log; widen Insights */}
      <section className="section">
        <div className="grid-12 gap-6 lg:min-h-[680px]">
          {/* Left stack (Quick log + Pain Advisor) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div id="quick-log" className="card flex flex-col flex-1">
              <h3 className="font-medium mb-4 text-lg">Quick log</h3>
              <div className="flex-1">
                <EntryForm selectedDate={selectedDate} onSaved={()=>{ setRefreshKey(x=>x+1); setSelectedDate(null); }} />
              </div>
            </div>
            <div className="card flex flex-col flex-1">
              <h3 className="font-medium mb-4 text-lg">Pain Advisor</h3>
              <div className="flex-1">
                <PainAdvisorAI />
              </div>
            </div>
          </div>
          {/* Insights (wider) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            <div className="card h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-lg">Insights (wide)</h3>
                <span className="text-[11px] text-gray-500">Charts prioritized</span>
              </div>
              <div className="flex-1">
                <WellnessInsights minimal />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
