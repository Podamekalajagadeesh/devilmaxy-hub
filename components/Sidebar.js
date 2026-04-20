import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="glass-shell hidden w-72 shrink-0 flex-col p-5 text-white lg:flex">
      <div className="glass-card-soft p-4">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Devilmaxy</div>
        <h2 className="mt-2 text-2xl font-semibold">Hub</h2>
        <p className="mt-2 text-sm glass-muted">Glass navigation for the full social workspace.</p>
      </div>
      <nav className="mt-5 flex flex-1 flex-col gap-2">
        <Link className="glass-tab justify-start" href="/profile">Profile</Link>
        <Link className="glass-tab justify-start" href="/guilds">Guilds</Link>
        <Link className="glass-tab justify-start" href="/chat">Chat Room</Link>
        <Link className="glass-tab justify-start" href="/dm">Direct Messages</Link>
        <Link className="glass-tab justify-start" href="/admin">Admin Tools</Link>
        <div className="mt-auto pt-4">
          <Link className="glass-tab justify-start text-rose-200" href="/">Logout</Link>
        </div>
      </nav>
    </aside>
  );
}
