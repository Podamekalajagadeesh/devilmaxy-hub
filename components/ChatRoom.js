"use client";
import { useEffect, useState, useRef } from 'react';
import MessageReactions from './MessageReactions';
import { supabase } from '../lib/supabaseClient';

export default function ChatRoom({ user }) {
  const [search, setSearch] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeout = useRef(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef();

  async function uploadMediaWithFallback(path, file) {
    const buckets = ['chat-media', 'avatars'];
    let lastError = null;

    for (const bucket of buckets) {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return { publicUrl: data.publicUrl, bucket };
      }
      lastError = uploadError;
    }

    return { error: lastError };
  }

  // Online status: update presence on mount/unmount and poll online users
  useEffect(() => {
    if (!user) return;
    let interval;
    const updatePresence = async () => {
      await supabase.from('presence').upsert({ user_id: user.id, last_active: new Date().toISOString() });
    };
    updatePresence();
    interval = setInterval(updatePresence, 20000); // update every 20s
    return () => {
      clearInterval(interval);
      supabase.from('presence').delete().eq('user_id', user.id);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedGuild) return;
    const fetchOnline = async () => {
      const { data } = await supabase.rpc('get_online_users', { guild_id: selectedGuild.id });
      setOnlineUsers(data || []);
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 15000);
    return () => clearInterval(interval);
  }, [selectedGuild]);

  // Typing indicator: broadcast typing state
  function handleTyping() {
    if (!selectedRoom) return;
    supabase.from('typing').upsert({ user_id: user.id, room_id: selectedRoom.id, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      supabase.from('typing').upsert({ user_id: user.id, room_id: selectedRoom.id, typing: false });
    }, 2000);
  }

  useEffect(() => {
    if (!selectedRoom) return;
    let ignore = false;
    const fetchTyping = async () => {
      const { data } = await supabase.from('typing').select('user_id').eq('room_id', selectedRoom.id).eq('typing', true);
      if (!ignore) setTypingUsers((data || []).filter(u => u.user_id !== user.id));
    };
    fetchTyping();
    const interval = setInterval(fetchTyping, 1500);
    return () => { ignore = true; clearInterval(interval); };
  }, [selectedRoom, user]);

  // Fetch user's guilds
  useEffect(() => {
    if (!user) return;
    supabase
      .from('guild_members')
      .select('guilds(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setGuilds(data.map(gm => gm.guilds));
      });
  }, [user]);

  // Fetch rooms for selected guild
  useEffect(() => {
    if (!selectedGuild) return;
    supabase
      .from('rooms')
      .select('*')
      .eq('guild_id', selectedGuild.id)
      .then(({ data }) => setRooms(data || []));
  }, [selectedGuild]);

  // Fetch messages for selected room and subscribe to real-time updates
  useEffect(() => {
    if (!selectedRoom) return;
    let ignore = false;
    const fetchMessages = () => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .order('inserted_at', { ascending: true });
      if (search) {
        query = query.ilike('content', `%${search}%`);
      }
      query.then(({ data }) => { if (!ignore) setMessages(data || []); });
    };
    fetchMessages();

    // Request notification permission
    if (typeof window !== 'undefined' && window.Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Real-time subscription
    const channel = supabase
      .channel('room-messages-' + selectedRoom.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        fetchMessages();
        // Browser notification for new message or mention
        if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
          const msg = payload.new;
          if (msg && msg.user_id !== user.id) {
            if (msg.content.includes('@' + user.ff_id) || msg.content.includes('@' + user.display_name)) {
              new Notification('Mentioned by ' + msg.display_name, { body: msg.content });
            } else {
              new Notification('New message in ' + selectedRoom.name, { body: msg.display_name + ': ' + msg.content });
            }
          }
        }
      })
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, search]);

  // Create a new room
  async function createRoom(e) {
    e.preventDefault();
    setError('');
    if (!roomName || !selectedGuild) return;
    const { data, error: err } = await supabase
      .from('rooms')
      .insert([{ name: roomName, guild_id: selectedGuild.id }])
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setRooms([...rooms, data]);
    setRoomName('');
  }

  // Send a message
  async function sendMessage(e) {
    e.preventDefault();
    if (!message && !fileInput.current?.files[0]) return;
    let fileUrl = '';
    if (fileInput.current?.files[0]) {
      setUploading(true);
      const file = fileInput.current.files[0];
      const path = `${selectedRoom.id}/${Date.now()}-${file.name}`;
      const { publicUrl, error: uploadError } = await uploadMediaWithFallback(path, file);
      setUploading(false);
      if (uploadError) {
        if ((uploadError.message || '').toLowerCase().includes('bucket')) {
          setError('Upload failed: Storage bucket not found. Create a public bucket named chat-media or avatars in Supabase Storage.');
        } else {
          setError('Upload failed: ' + uploadError.message);
        }
        return;
      }
      fileUrl = publicUrl;
    }
    await supabase.from('messages').insert([
      { content: message, user_id: user.id, display_name: user.ff_id || user.display_name, room_id: selectedRoom.id, media_url: fileUrl }
    ]);
    setMessage('');
    if (fileInput.current) fileInput.current.value = '';
    // Refresh messages
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', selectedRoom.id)
      .order('inserted_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));
  }

  return (
    <div className="glass-card mx-auto mb-4 max-w-6xl p-5 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Guild Chat Rooms</div>
        <h2 className="mt-2 text-xl font-semibold">Live rooms and media</h2>
      </div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <select className="glass-select max-w-xs" value={selectedGuild?.id || ''} onChange={e => {
          const g = guilds.find(g => g.id === e.target.value);
          setSelectedGuild(g);
          setSelectedRoom(null);
        }}>
          <option value="">Select Guild</option>
          {guilds.map(guild => (
            <option key={guild.id} value={guild.id}>{guild.name}</option>
          ))}
        </select>
        {selectedGuild && (
          <form className="flex flex-1 flex-col gap-2 sm:flex-row" onSubmit={createRoom}>
            <input
              className="glass-input flex-1"
              type="text"
              placeholder="New Room Name"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
            />
            <button className="glass-button px-4 py-3 sm:w-auto" type="submit">Create Room</button>
          </form>
        )}
      </div>
      {selectedGuild && (
        <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
          <div className="glass-panel p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100/80">Rooms</h3>
            <ul className="flex flex-col gap-2">
              {rooms.map(room => (
                <li key={room.id}>
                  <button className={`glass-tab w-full justify-start ${selectedRoom?.id === room.id ? 'glass-tab-active' : ''}`} onClick={() => setSelectedRoom(room)}>{room.name}</button>
                </li>
              ))}
              {rooms.length === 0 && <li className="text-sm glass-muted">No rooms yet.</li>}
            </ul>
          </div>
          <div className="glass-panel p-4">
            {selectedRoom && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100/80">Room: {selectedRoom.name}</h3>
                <input
                  className="glass-input mb-3"
                  type="text"
                  placeholder="Search messages..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="mb-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
                  Online: {onlineUsers.map(u => '@' + (u.ff_id || u.display_name)).join(', ') || 'None'}
                </div>
                <div className="mb-2 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs text-sky-100">
                  {typingUsers.length > 0 && `${typingUsers.map(u => '@' + (u.ff_id || u.display_name)).join(', ')} typing...`}
                </div>
                <div className="glass-scrollbar glass-card-soft mb-3 h-96 overflow-y-scroll p-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <span className="font-semibold">{msg.display_name}:</span> {msg.content}
                      {msg.media_url && (
                        <div className="mt-1">
                          {msg.media_url.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) ? (
                            <img src={msg.media_url} alt="media" className="max-w-xs max-h-40 mt-1" />
                          ) : msg.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={msg.media_url} controls className="max-w-xs max-h-40 mt-1" />
                          ) : (
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline">Download File</a>
                          )}
                        </div>
                      )}
                      <MessageReactions messageId={msg.id} user={user} />
                    </div>
                  ))}
                  {messages.length === 0 && <div className="text-sm glass-muted">No messages yet.</div>}
                </div>
                <form className="flex flex-col gap-3" onSubmit={sendMessage}>
                  <input
                    ref={fileInput}
                    className="glass-input text-sm file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.24em] file:text-cyan-100"
                    type="file"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="glass-input flex-1"
                    value={message}
                    onChange={e => { setMessage(e.target.value); handleTyping(); }}
                    placeholder="Type a message..."
                  />
                    <button className="glass-button px-4 py-3 sm:w-auto" type="submit" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-sm text-rose-200">{error}</div>}
    </div>
  );
}
