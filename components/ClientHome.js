"use client";
import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

function classForDay(date, entries, startDate, cycleDuration, periodDuration) {
  const key = format(date, 'yyyy-MM-dd');
  const found = entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === key);
  if (found && found.blood > 0) return `blood-${found.blood}`;
  if (!startDate) return null;
  const days = differenceInCalendarDays(date, startDate);
  if (days < 0) return null;
  const mod = days % cycleDuration;
  if (mod < periodDuration) return 'predict-1';
  return 'predict-0';
}

export default function ClientHome() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycleDuration, setCycleDuration] = useState(30);
  const [periodDuration, setPeriodDuration] = useState(5);

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => setUser(d.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/entries').then(r => r.json()).then(d => {
      if (Array.isArray(d.entries)) setEntries(d.entries);
    });
  }, [user]);

  const startDate = useMemo(() => {
    // choose the most recent start of a period from entries
    const bloodDays = entries.filter(e => (e.blood ?? 0) > 0)
      .map(e => new Date(e.date))
      .sort((a,b)=>b-a);
    return bloodDays[0] || null;
  }, [entries]);

  async function saveEntry(values) {
    const res = await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(values) });
    const d = await res.json();
    if (d.entry) {
      // refresh
      const list = await fetch('/api/entries').then(r=>r.json());
      setEntries(list.entries || []);
    }
  }

  if (!user) {
    return (
      <div className="container">
        <div className="nav">
          <a href="/login">Login</a>
          <a href="/signup">Sign up</a>
        </div>
        <h2>Welcome to Pink Diary</h2>
        <p>Please log in to continue.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav">
        <a href="/">Home</a>
        <a href="/add">Log symptoms</a>
        <a href="/help">Help</a>
        <span style={{ marginLeft: 'auto' }}>Hi, {user.email}</span>
        <form onSubmit={async (e)=>{e.preventDefault(); await fetch('/api/auth/logout', { method: 'POST' }); location.href='/login'; }}>
          <button type="submit">Logout</button>
        </form>
      </div>
      <div className="card">
        <Calendar
          value={currentDate}
          onClickDay={(d)=>setCurrentDate(d)}
          tileClassName={({ date, view }) => {
            if (view !== 'month') return null;
            const cls = classForDay(date, entries, startDate, cycleDuration, periodDuration);
            return cls;
          }}
        />
        <div className="calendarLegend">
          <span className="dot red"></span> Period
          <span className="dot pink"></span> Predicted
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Quick log for {format(currentDate, 'yyyy-MM-dd')}</h3>
        <form onSubmit={(e)=>{ e.preventDefault(); const f = new FormData(e.currentTarget); saveEntry({ date: format(currentDate,'yyyy-MM-dd'), blood: Number(f.get('blood')), mood: Number(f.get('mood')), pain: Number(f.get('pain')), sex: Number(f.get('sex')) }); }}>
          <div className="row">
            <label>Flow</label>
            <select name="blood" defaultValue="0">
              <option value="0">None</option>
              <option value="1">Light</option>
              <option value="2">Medium</option>
              <option value="3">Heavy</option>
              <option value="4">Very Heavy</option>
            </select>
            <label>Mood</label>
            <select name="mood" defaultValue="0">
              <option value="0">None</option>
              <option value="1">😀</option>
              <option value="2">🙂</option>
              <option value="3">😕</option>
              <option value="4">😫</option>
            </select>
            <label>Pain</label>
            <select name="pain" defaultValue="0">
              <option value="0">None</option>
              <option value="1">Mild</option>
              <option value="2">Moderate</option>
              <option value="3">Severe</option>
              <option value="4">Unbearable</option>
            </select>
            <label>Sex</label>
            <select name="sex" defaultValue="0">
              <option value="0">No</option>
              <option value="1">Yes</option>
              <option value="2">Protected</option>
            </select>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
