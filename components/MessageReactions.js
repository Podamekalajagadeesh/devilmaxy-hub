"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MessageReactions({ messageId, user }) {
  const [reactions, setReactions] = useState([]);
  const emojis = ['👍', '😂', '🔥', '❤️', '😮'];

  useEffect(() => {
    if (!messageId) return;
    supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .then(({ data }) => setReactions(data || []));
    // Real-time updates
    const channel = supabase
      .channel('reactions-' + messageId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions', filter: `message_id=eq.${messageId}` }, () => {
        supabase
          .from('message_reactions')
          .select('*')
          .eq('message_id', messageId)
          .then(({ data }) => setReactions(data || []));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [messageId]);

  async function react(emoji) {
    // Upsert reaction for this user/message/emoji
    await supabase.from('message_reactions').upsert({
      message_id: messageId,
      user_id: user.id,
      emoji,
      reacted_at: new Date().toISOString()
    }, { onConflict: ['message_id', 'user_id', 'emoji'] });
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {emojis.map(e => (
        <button key={e} type="button" className="glass-button-secondary rounded-full px-3 py-1 text-sm" onClick={() => react(e)}>
          <span>{e}</span>
          {reactions.filter(r => r.emoji === e).length > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
              {reactions.filter(r => r.emoji === e).length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
