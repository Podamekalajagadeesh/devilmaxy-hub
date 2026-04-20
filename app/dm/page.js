"use client";
import DirectMessages from '../../components/DirectMessages';
import Auth from '../../components/Auth';
import { useUser } from '../../components/UserContext';

export default function DMPage() {
  const { user, setUser } = useUser();
  if (!user) return <Auth onAuth={setUser} />;
  return <DirectMessages user={user} />;
}
