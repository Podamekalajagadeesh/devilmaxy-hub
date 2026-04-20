"use client";
import Guilds from '../../components/Guilds';
import Auth from '../../components/Auth';
import { useUser } from '../../components/UserContext';

export default function GuildsPage() {
  const { user, setUser } = useUser();
  if (!user) return <Auth onAuth={setUser} />;
  return <Guilds user={user} />;
}
