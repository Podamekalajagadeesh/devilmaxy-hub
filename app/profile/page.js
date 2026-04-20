"use client";
import Profile from '../../components/Profile';
import Auth from '../../components/Auth';
import { useUser } from '../../components/UserContext';

export default function ProfilePage() {
  const { user, setUser } = useUser();
  if (!user) return <Auth onAuth={setUser} />;
  return <Profile user={user} onUpdate={setUser} />;
}
