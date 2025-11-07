"use client";
import EntryForm from '../../components/EntryForm';

export default function AddPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Log symptoms</h2>
      <div className="card">
        <EntryForm />
      </div>
    </div>
  );
}
