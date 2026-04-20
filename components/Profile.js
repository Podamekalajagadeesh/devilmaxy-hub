"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Profile({ user, onUpdate }) {
  const [ffId, setFfId] = useState(user.ff_id || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function uploadAvatarWithFallback(path, file) {
    const buckets = ['chat-media', 'avatars'];
    let lastError = null;

    for (const bucket of buckets) {
      const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (!uploadErr) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return { publicUrl: data.publicUrl, bucket };
      }
      lastError = uploadErr;
    }

    return { error: lastError };
  }

  async function updateProfile(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!ffId || !displayName) {
      setError('FF ID and Name are required.');
      setLoading(false);
      return;
    }

    let resolvedAvatarUrl = avatarUrl;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}-${Date.now()}.${fileExt}`;
      const { publicUrl, error: uploadErr } = await uploadAvatarWithFallback(path, avatarFile);
      if (uploadErr) {
        if ((uploadErr.message || '').toLowerCase().includes('bucket')) {
          setError('Profile image upload failed: Storage bucket not found. Create a public bucket named chat-media or avatars in Supabase Storage.');
        } else {
          setError('Profile image upload failed: ' + uploadErr.message);
        }
        setLoading(false);
        return;
      }
      resolvedAvatarUrl = publicUrl;
    }

    const updates = {
      ff_id: ffId.trim(),
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: resolvedAvatarUrl,
    };
    if (password) updates.password = password;

    let { error: err } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (err && err.message?.toLowerCase().includes('bio')) {
      const fallback = {
        ff_id: updates.ff_id,
        display_name: updates.display_name,
        avatar_url: updates.avatar_url,
      };
      if (password) fallback.password = password;
      const retry = await supabase.from('users').update(fallback).eq('id', user.id);
      err = retry.error;
      if (!err) {
        setSuccess('Profile updated. Add a bio column in your users table to enable bio saving.');
        if (onUpdate) onUpdate({ ...user, ...fallback, bio });
        setPassword('');
        setAvatarFile(null);
      }
    }

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Profile updated!');
      if (onUpdate) onUpdate({ ...user, ...updates });
      setPassword('');
      setAvatarFile(null);
    }
  }

  return (
    <div className="glass-card mx-auto mb-4 max-w-xl p-5 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Profile</div>
        <h2 className="mt-2 text-xl font-semibold">Update account</h2>
      </div>
      <form className="flex flex-col gap-3" onSubmit={updateProfile}>
        <div className="glass-card-soft p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-100/70">Profile picture</div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <img
              src={avatarUrl || '/next.svg'}
              alt="Profile"
              className="h-20 w-20 rounded-full border border-white/20 object-cover"
            />
            <div className="w-full space-y-2">
              <input
                className="glass-input text-sm file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cyan-100"
                type="file"
                accept="image/*"
                onChange={e => setAvatarFile(e.target.files?.[0] || null)}
              />
              <input
                className="glass-input"
                type="url"
                placeholder="Or paste image URL"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
        <input
          className="glass-input"
          type="text"
          placeholder="FF ID (your username)"
          value={ffId}
          onChange={e => setFfId(e.target.value)}
        />
        <input
          className="glass-input"
          type="text"
          placeholder="Name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
        <textarea
          className="glass-textarea min-h-28"
          placeholder="Bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
        <input
          className="glass-input"
          type="password"
          placeholder="New Password (optional)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-sm text-rose-200">{error}</div>}
        {success && <div className="text-sm text-emerald-200">{success}</div>}
        <button className="glass-button" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
