"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Guilds({ user }) {
  const [guilds, setGuilds] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch guilds the user is a member of
  useEffect(() => {
    if (!user) return;
    supabase
      .from('guild_members')
      .select('guilds(*), is_moderator')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setGuilds(data.map(gm => ({ ...gm.guilds, is_moderator: gm.is_moderator })));
        }
      });
  }, [user]);

  // Create a new guild
  async function createGuild(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!name) {
      setError('Guild name required');
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('guilds')
      .insert([{ name, description: desc, owner_id: user.id }])
      .select()
      .single();
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    // Add user as member
    await supabase.from('guild_members').insert([{ user_id: user.id, guild_id: data.id, is_moderator: true }]);
    setGuilds([...guilds, { ...data, is_moderator: true }]);
    setName('');
    setDesc('');
    setLoading(false);
  }

  return (
    <div className="glass-card mx-auto mb-4 max-w-xl p-5 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Guilds</div>
        <h2 className="mt-2 text-xl font-semibold">Your guilds</h2>
      </div>
      <ul className="glass-panel glass-scrollbar mb-4 max-h-72 space-y-3 overflow-y-auto p-4">
        {guilds.map(guild => (
          <li key={guild.id} className="glass-card-soft p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{guild.name}</span>
              {guild.is_moderator && <span className="rounded-full border border-cyan-200/30 bg-cyan-300/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.22em] text-cyan-100/80">Mod</span>}
            </div>
            <div className="mt-1 text-sm glass-muted">{guild.description}</div>
          </li>
        ))}
        {guilds.length === 0 && <li className="text-sm glass-muted">No guilds joined yet.</li>}
      </ul>
      <form className="flex flex-col gap-3" onSubmit={createGuild}>
        <input
          className="glass-input"
          type="text"
          placeholder="New Guild Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="glass-input"
          type="text"
          placeholder="Description (optional)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        {error && <div className="text-sm text-rose-200">{error}</div>}
        <button className="glass-button" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Guild'}
        </button>
      </form>
    </div>
  );
}
