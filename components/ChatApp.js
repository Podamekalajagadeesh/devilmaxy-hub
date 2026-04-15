"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const ROOMS = [
  { id: "welcome", name: "welcome" },
  { id: "announcements", name: "announcements" },
  { id: "guild-chat", name: "guild-chat" },
  { id: "squad-finder", name: "squad-finder" },
  { id: "clips", name: "clips" }
];

const MAX_LENGTH = 400;

function formatTime(time) {
  return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [activeRoom, setActiveRoom] = useState(ROOMS[0].id);
  const [pendingText, setPendingText] = useState("");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const messagesEndRef = useRef(null);
  const roomChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const canUseApp = Boolean(supabase);

  const typingLabel = useMemo(() => {
    const filtered = typingUsers.filter((name) => name !== username);
    if (filtered.length === 0) {
      return "";
    }
    if (filtered.length === 1) {
      return `${filtered[0]} is typing...`;
    }
    return `${filtered.length} guild mates are typing...`;
  }, [typingUsers, username]);

  useEffect(() => {
    if (!canUseApp) {
      return;
    }

    const savedName = window.localStorage.getItem("devilmaxy-username") || "";
    if (savedName) {
      setUsername(savedName);
    }
  }, [canUseApp]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!joined || !canUseApp) {
      return;
    }

    let ignore = false;

    async function loadHistory() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, room_id, username, text, created_at")
        .eq("room_id", activeRoom)
        .order("created_at", { ascending: true })
        .limit(200);

      if (ignore) {
        return;
      }

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setMessages(
        (data || []).map((item) => ({
          id: item.id,
          roomId: item.room_id,
          username: item.username,
          text: item.text,
          createdAt: item.created_at,
          system: item.username === "System"
        }))
      );
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [activeRoom, joined, canUseApp]);

  useEffect(() => {
    if (!joined || !canUseApp) {
      return;
    }

    const roomChannelName = `room-${activeRoom}`;

    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }

    const channel = supabase.channel(roomChannelName, {
      config: {
        presence: {
          key: `${username}-${Math.random().toString(16).slice(2)}`
        }
      }
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${activeRoom}`
      },
      (payload) => {
        const msg = payload.new;
        setMessages((current) => [
          ...current,
          {
            id: msg.id,
            roomId: msg.room_id,
            username: msg.username,
            text: msg.text,
            createdAt: msg.created_at,
            system: msg.username === "System"
          }
        ]);
      }
    );

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const onlineNames = [];
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry?.username && !onlineNames.includes(entry.username)) {
            onlineNames.push(entry.username);
          }
        });
      });
      onlineNames.sort((a, b) => a.localeCompare(b));
      setMembers(onlineNames);
    });

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload?.username || payload.username === username) {
        return;
      }

      setTypingUsers((current) => {
        if (current.includes(payload.username)) {
          return current;
        }
        return [...current, payload.username];
      });

      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        setTypingUsers((current) => current.filter((name) => name !== payload.username));
      }, 1600);
    });

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") {
        return;
      }

      await channel.track({ username, roomId: activeRoom, joinedAt: new Date().toISOString() });

      await supabase.from("messages").insert({
        room_id: activeRoom,
        username: "System",
        text: `${username} joined #${activeRoom}`
      });
    });

    roomChannelRef.current = channel;

    return () => {
      if (roomChannelRef.current) {
        supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
    };
  }, [activeRoom, joined, username, canUseApp]);

  async function joinChat(event) {
    event.preventDefault();
    const finalName = username.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!finalName) {
      return;
    }

    setUsername(finalName);
    setErrorMsg("");
    window.localStorage.setItem("devilmaxy-username", finalName);
    setJoined(true);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!pendingText.trim() || isSending) {
      return;
    }

    setIsSending(true);
    const text = pendingText.trim().slice(0, MAX_LENGTH);

    const { error } = await supabase.from("messages").insert({
      room_id: activeRoom,
      username,
      text
    });

    if (error) {
      setErrorMsg(error.message);
    }

    setPendingText("");
    setIsSending(false);
  }

  function emitTyping() {
    if (!roomChannelRef.current) {
      return;
    }

    roomChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        username,
        roomId: activeRoom
      }
    });
  }

  if (!canUseApp) {
    return (
      <main className="app-shell">
        <section className="join-card">
          <p className="eyebrow">Setup Needed</p>
          <h1>Missing Supabase Keys</h1>
          <p className="sub-copy">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local
            file.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="bg-shape shape-1" aria-hidden="true" />
      <div className="bg-shape shape-2" aria-hidden="true" />

      {!joined && (
        <section className="join-card">
          <p className="eyebrow">Subscriber + Guild Room</p>
          <h1>DevilMaxy HQ Chat</h1>
          <p className="sub-copy">
            Discord-style hub for your subscribers and Free Fire guild mates. Fully deployable on
            Vercel with free-tier services.
          </p>

          <form onSubmit={joinChat}>
            <label htmlFor="username">Nickname</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ex: DragonSniper"
              maxLength={24}
              required
            />

            <label htmlFor="room">Start Channel</label>
            <select
              id="room"
              value={activeRoom}
              onChange={(event) => setActiveRoom(event.target.value)}
            >
              {ROOMS.map((room) => (
                <option key={room.id} value={room.id}>
                  # {room.name}
                </option>
              ))}
            </select>

            <button type="submit">Enter Chat</button>
          </form>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </section>
      )}

      {joined && (
        <section className="chat-layout" aria-live="polite">
          <aside className="server-rail">
            <div className="brand-dot">DM</div>
            <div className="rail-pill active" />
            <div className="rail-pill" />
            <div className="rail-pill" />
          </aside>

          <aside className="channel-panel">
            <h2>Guild Channels</h2>
            <ul>
              {ROOMS.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className={`channel-btn ${activeRoom === room.id ? "active" : ""}`}
                    onClick={() => setActiveRoom(room.id)}
                  >
                    # {room.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="chat-panel">
            <header className="chat-header">
              <h3># {activeRoom}</h3>
              <p>{typingLabel}</p>
            </header>

            <div className="messages">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`message ${message.system ? "system" : ""}`}
                >
                  <div className="message-head">
                    <span className="message-user">{message.username}</span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={sendMessage}>
              <input
                value={pendingText}
                onChange={(event) => {
                  setPendingText(event.target.value);
                  emitTyping();
                }}
                placeholder="Message channel..."
                maxLength={MAX_LENGTH}
              />
              <button type="submit" disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
            {errorMsg && <p className="error in-chat">{errorMsg}</p>}
          </section>

          <aside className="members-panel">
            <h2>Online</h2>
            <ul>
              {members.map((name) => (
                <li key={name} className="member-item">
                  {name}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      )}
    </main>
  );
}
