"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminTools({ user }) {
  const [targetUserId, setTargetUserId] = useState('');
  const [targetMessageId, setTargetMessageId] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  async function handleModeration(e) {
    e.preventDefault();
    setResult('');
    if (action === 'delete_message' && targetMessageId) {
      const { error } = await supabase.from('messages').delete().eq('id', targetMessageId);
      setResult(error ? error.message : 'Message deleted');
    } else if (action === 'ban_user' && targetUserId) {
      const { error } = await supabase.from('guild_members').update({ banned: true }).eq('user_id', targetUserId);
      setResult(error ? error.message : 'User banned');
    } else if (action === 'mute_user' && targetUserId) {
      const { error } = await supabase.from('guild_members').update({ muted: true }).eq('user_id', targetUserId);
      setResult(error ? error.message : 'User muted');
    } else {
      setResult('Invalid action or missing target');
    }
  }

  return (
    <div className="glass-card mx-auto mb-4 max-w-xl p-5 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Admin / Moderation</div>
        <h2 className="mt-2 text-xl font-semibold">Control panel</h2>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleModeration}>
        <select className="glass-select" value={action} onChange={e => setAction(e.target.value)}>
          <option value="">Select Action</option>
          <option value="delete_message">Delete Message</option>
          <option value="ban_user">Ban User</option>
          <option value="mute_user">Mute User</option>
        </select>
        {(action === 'ban_user' || action === 'mute_user') && (
          <input className="glass-input" type="text" placeholder="Target User ID" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} />
        )}
        {action === 'delete_message' && (
          <input className="glass-input" type="text" placeholder="Target Message ID" value={targetMessageId} onChange={e => setTargetMessageId(e.target.value)} />
        )}
        <button className="glass-button bg-gradient-to-r from-rose-500 to-red-600" type="submit">Execute</button>
        {result && <div className="text-sm text-emerald-200">{result}</div>}
      </form>
    </div>
  );
}
