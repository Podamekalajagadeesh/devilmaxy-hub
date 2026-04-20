"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DirectMessages({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch all users except self
  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('id, display_name, ff_id')
      .neq('id', user.id)
      .then(({ data }) => setUsers(data || []));
  }, [user]);

  // Fetch DMs with selected user and subscribe to real-time updates
  useEffect(() => {
    if (!selectedUser) return;
    let ignore = false;
    supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
      .order('inserted_at', { ascending: true })
      .then(({ data }) => { if (!ignore) setMessages(data || []); });

    // Real-time subscription
    const channel = supabase
      .channel('dm-' + user.id + '-' + selectedUser.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `or=(and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id}))` }, (payload) => {
        supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order('inserted_at', { ascending: true })
          .then(({ data }) => { if (!ignore) setMessages(data || []); });
      })
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [selectedUser, user]);

  // Send a DM
  async function sendDM(e) {
    e.preventDefault();
    setError('');
    if (!message || !selectedUser) return;
    const { error: err } = await supabase.from('direct_messages').insert([
      { content: message, sender_id: user.id, receiver_id: selectedUser.id }
    ]);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('');
    // Refresh messages
    supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
      .order('inserted_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));
  }

  return (
    <div className="glass-card mx-auto mb-4 max-w-4xl p-5 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Direct Messages</div>
        <h2 className="mt-2 text-xl font-semibold">Private conversations</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <div className="glass-panel p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100/80">Users</h3>
          <ul className="flex flex-col gap-2">
            {users.map(u => (
              <li key={u.id}>
                <button className={`glass-tab w-full justify-start ${selectedUser?.id === u.id ? 'glass-tab-active' : ''}`} onClick={() => setSelectedUser(u)}>
                  @{u.ff_id} {u.display_name ? `(${u.display_name})` : ''}
                </button>
              </li>
            ))}
            {users.length === 0 && <li className="text-sm glass-muted">No other users yet.</li>}
          </ul>
        </div>
        <div className="glass-panel p-4">
          {selectedUser && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100/80">Chat with @{selectedUser.ff_id}</h3>
              <div className="glass-scrollbar glass-card-soft mb-3 h-80 overflow-y-scroll p-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className={`font-semibold ${msg.sender_id === user.id ? 'text-cyan-200' : 'text-emerald-200'}`}>
                      {msg.sender_id === user.id ? 'You' : '@' + selectedUser.ff_id}:
                    </span> {msg.content}
                  </div>
                ))}
                {messages.length === 0 && <div className="text-sm glass-muted">No messages yet.</div>}
              </div>
              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={sendDM}>
                <input
                  className="glass-input flex-1"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="glass-button px-4 py-3 sm:w-auto" type="submit">Send</button>
              </form>
              {error && <div className="mt-2 text-sm text-rose-200">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
