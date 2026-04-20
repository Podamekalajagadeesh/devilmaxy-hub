"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/profile', label: 'Profile' },
  { href: '/guilds', label: 'Guilds' },
  { href: '/chat', label: 'Chat' },
  { href: '/dm', label: 'DMs' },
  { href: '/admin', label: 'Admin' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-panel fixed inset-x-3 bottom-3 z-30 flex items-center gap-2 overflow-x-auto p-2 lg:hidden">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`glass-tab min-w-[78px] px-3 py-2 text-center text-sm ${active ? 'glass-tab-active' : ''}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
