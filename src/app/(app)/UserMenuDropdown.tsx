"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useClickOutside } from "@/hooks/useClickOutside";
import LogoutButton from "./LogoutButton";

/**
 * humanOS — UserMenuDropdown (Client Component)
 *
 * Sağ üst köşedeki kullanıcı menüsünün etkileşim katmanı.
 * Server Component (UserMenu.tsx) bu component'i prop'larla besler.
 *
 * Yapı:
 * - Trigger butonu: avatar (initial) + isim + chevron
 * - Dropdown: isim + email başlık, Profil linki, Çıkış
 *
 * State:
 * - isOpen: dropdown açık mı?
 * - menuRef: click-outside için DOM ref
 *
 * UX:
 * - Tıklayınca aç/kapa
 * - Dışına tıklayınca kapan
 * - Profil link tıklanınca kapan (link Next.js Link, refresh yok)
 * - Logout başlatılınca kapan
 *
 * Mobile:
 * - Avatar her zaman görünür
 * - İsim sm: breakpoint üstünde görünür (yer kazanma)
 */

type UserMenuDropdownProps = {
  initial: string;
  displayName: string;
  email: string;
};

export default function UserMenuDropdown({
  initial,
  displayName,
  email,
}: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dropdown dışına tıklayınca kapat
  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-humanos-surface transition-colors"
      >
        {/* Avatar — Initial */}
        <div className="w-8 h-8 rounded-full bg-humanos-accent/15 border border-humanos-accent/30 flex items-center justify-center">
          <span className="text-xs font-semibold text-humanos-accent">
            {initial}
          </span>
        </div>

        {/* İsim — sm breakpoint üstünde */}
        <span className="text-sm text-humanos-text-muted hidden sm:inline-block max-w-[160px] truncate">
          {displayName}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-humanos-text-subtle transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menüsü */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right bg-humanos-surface border border-humanos-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header — İsim + Email */}
          <div className="px-4 py-3 border-b border-humanos-border">
            <p className="text-sm font-medium text-humanos-text truncate">
              {displayName}
            </p>
            {displayName !== email && (
              <p className="text-xs text-humanos-text-muted truncate mt-0.5">
                {email}
              </p>
            )}
          </div>

          {/* Profile Link */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-humanos-text hover:bg-humanos-bg/50 transition-colors"
          >
            <svg
              className="w-4 h-4 text-humanos-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Profil</span>
          </Link>

          {/* Divider */}
          <div className="border-t border-humanos-border" />

          {/* Logout — menu-item variant */}
          <div className="p-1">
            <LogoutButton variant="menu-item" />
          </div>
        </div>
      )}
    </div>
  );
}
