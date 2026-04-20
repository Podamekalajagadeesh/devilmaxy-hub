"use client";
import AdminTools from '../../components/AdminTools';
import Auth from '../../components/Auth';
import { useUser } from '../../components/UserContext';

export default function AdminPage() {
  const { user, setUser } = useUser();
  if (!user) return <Auth onAuth={setUser} />;
  return <AdminTools user={user} />;
}
