<<<<<<< HEAD
import ChatApp from "../components/ChatApp";

export default function HomePage() {
  return <ChatApp />;
=======
import Image from "next/image";
=======
"use client";

import Auth from '../components/Auth';
import Link from 'next/link';
import { useUser } from '../components/UserContext';
>>>>>>> c59a53a (Update project files)

export default function Home() {
  const { user, setUser } = useUser();

  if (!user) {
    return <Auth onAuth={setUser} />;
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-2 py-6 lg:px-10">
      <div className="glass-card w-full max-w-3xl p-6 lg:p-10 text-center">
        <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-200/30 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-100/80">
          Glass theme dashboard
        </div>
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">Welcome to Devilmaxy Hub</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 glass-muted lg:text-base">
          Jump into chat, guilds, profiles, direct messages, and moderation tools from one translucent control center.
        </p>
        <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="glass-tab justify-center py-4" href="/profile">Profile</Link>
          <Link className="glass-tab justify-center py-4" href="/guilds">Guilds</Link>
          <Link className="glass-tab justify-center py-4" href="/chat">Chat Room</Link>
          <Link className="glass-tab justify-center py-4" href="/dm">Direct Messages</Link>
          <Link className="glass-tab justify-center py-4 sm:col-span-2 lg:col-span-1" href="/admin">Admin Tools</Link>
        </nav>
        <button className="glass-button mt-8 px-5 py-3" onClick={() => setUser(null)}>
          Logout
        </button>
      </div>
    </div>
  );
>>>>>>> ee991a1 (Initial commit from Create Next App)
}
