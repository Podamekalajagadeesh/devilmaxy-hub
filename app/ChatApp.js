"use client";
import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';

export default function ChatApp() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null); // { id, ff_id, display_name }
  const [registerMode, setRegisterMode] = useState(false);
  const [ffId, setFfId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [msgError, setMsgError] = useState('');

  // Register new user
  async function register(e) {
    e.preventDefault();
    setError('');
    if (!ffId || !password || !displayName) {
      setError('All fields are required.');
      return;
    }
    const { data, error: err } = await supabase
      .from('users')
      .insert([{ ff_id: ffId, password, display_name: displayName }])
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setUser(data);
  }

  // Login existing user
  async function login(e) {
    e.preventDefault();
    setError('');
    if (!ffId || !password) {
      setError('Both fields are required.');
      return;
    }
    const { data, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('ff_id', ffId)
      .eq('password', password)
      .single();
    if (err || !data) {
      setError('Invalid Free Fire ID or password.');
      return;
    }
    setUser(data);
  }

  // Send a message
  async function sendMessage(e) {
    e.preventDefault();
    setMsgError('');
    if (!message) return;
    const { error: err } = await supabase.from('messages').insert([
      { content: message, user_id: user.id, display_name: user.display_name }
    ]);
    if (err) {
      setMsgError('Failed to send message: ' + err.message);
      return;
    }
    setMessage('');
  }

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((msgs) => [...msgs, payload.new]);
      })
      .subscribe();
    // Fetch initial messages with error handling
    supabase.from('messages').select('*').then(({ data, error: err }) => {
      if (err) {
        setMsgError('Failed to fetch messages: ' + err.message);
      } else {
        setMessages(data || []);
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">{registerMode ? 'Register' : 'Login'} to Chat</h1>
        <form className="flex flex-col gap-2 w-80" onSubmit={registerMode ? register : login}>
          <input
            className="border p-2"
            type="text"
            placeholder="Free Fire ID"
            value={ffId}
            onChange={e => setFfId(e.target.value)}
          />
          <input
            className="border p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {registerMode && (
            <input
              className="border p-2"
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">
            {registerMode ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          className="mt-2 text-blue-500 underline"
          onClick={() => {
            setRegisterMode(!registerMode);
            setError('');
          }}
        >
          {registerMode ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Guild Chat</h1>
      <div className="w-full max-w-md border rounded p-4 mb-4 h-96 overflow-y-scroll bg-white">
        {msgError && <div className="text-red-500 text-sm mb-2">{msgError}</div>}
        {messages.length === 0 && !msgError && (
          <div className="text-zinc-400 text-center">No messages yet.</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <span className="font-semibold">{msg.display_name}:</span> {msg.content}
          </div>
        ))}
      </div>
      <form className="flex w-full max-w-md" onSubmit={sendMessage}>
        <input className="flex-1 border p-2 rounded-l" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-r" type="submit">Send</button>
      </form>
    </div>
  );
}
