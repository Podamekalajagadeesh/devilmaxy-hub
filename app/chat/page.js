"use client";
import ChatRoom from '../../components/ChatRoom';
import Auth from '../../components/Auth';
import { useUser } from '../../components/UserContext';

export default function ChatPage() {
  const { user, setUser } = useUser();
  if (!user) return <Auth onAuth={setUser} />;
  return <ChatRoom user={user} />;
}
