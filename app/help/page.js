"use client";
import CommunityChat from '../../components/CommunityChat';

export default function HelpPage() {
  return (
    <div className="space-y-10">
      <section className="section">
        <div className="rounded-3xl p-8 bg-gradient-to-r from-pink-500/10 via-rose-300/10 to-orange-300/10 border border-rose-100/60">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl md:text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-500">Community support & discussion</h2>
            <p className="text-gray-700 md:text-lg">Ask questions, share coping strategies, and encourage others. Please avoid sharing personal medical details.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="grid-12">
          <div className="col-span-12 md:col-span-8 mx-auto">
            <CommunityChat />
          </div>
        </div>
      </section>
    </div>
  );
}
