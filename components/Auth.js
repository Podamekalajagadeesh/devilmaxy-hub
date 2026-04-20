"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth({ onAuth }) {
  const [registerMode, setRegisterMode] = useState(false);
  const [ffId, setFfId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function register(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!ffId || !password || !displayName) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('users')
      .insert([{ ff_id: ffId, password, display_name: displayName }])
      .select()
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (onAuth) onAuth(data);
  }

  async function login(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!ffId || !password) {
      setError('Both fields are required.');
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('ff_id', ffId)
      .eq('password', password)
      .single();
    setLoading(false);
    if (err || !data) {
      setError('Invalid Free Fire ID or password.');
      return;
    }
    if (onAuth) onAuth(data);
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-2 py-6">
      <div className="glass-card w-full max-w-md p-6 lg:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-cyan-100/75">
            Secure glass access
          </div>
          <h1 className="text-2xl font-semibold">{registerMode ? 'Register' : 'Login'} to Chat</h1>
          <p className="mt-2 text-sm glass-muted">Use your FF ID as your username, plus password and name.</p>
        </div>
        <div className="mb-5 flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            className={`glass-tab flex-1 ${!registerMode ? 'glass-tab-active' : ''}`}
            onClick={() => {
              setRegisterMode(false);
              setError('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`glass-tab flex-1 ${registerMode ? 'glass-tab-active' : ''}`}
            onClick={() => {
              setRegisterMode(true);
              setError('');
            }}
          >
            Register
          </button>
        </div>
        <form className="flex flex-col gap-3" onSubmit={registerMode ? register : login}>
          <input
            className="glass-input"
          type="text"
          placeholder="FF ID (username)"
          value={ffId}
          onChange={e => setFfId(e.target.value)}
        />
          <input
            className="glass-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {registerMode && (
          <input
            className="glass-input"
            type="text"
            placeholder="Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        )}
        {error && <div className="text-sm text-rose-200">{error}</div>}
        <button className="glass-button mt-2" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : (registerMode ? 'Register' : 'Login')}
        </button>
        </form>
        <button
          className="mt-4 w-full text-sm text-cyan-100/80 transition hover:text-cyan-50"
          onClick={() => {
            setRegisterMode(!registerMode);
            setError('');
          }}
        >
          {registerMode ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
