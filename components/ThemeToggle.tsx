"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Light/dark toggle. Persists the choice to localStorage; when unset the app
// follows the OS preference (handled by the CSS media query in globals.css).
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setDark(stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  if (dark === null) return null; // avoid a hydration/flash mismatch until known
  return (
    <button onClick={toggle} aria-label={dark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"} className={className}>
      {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      <span>{dark ? "โหมดสว่าง" : "โหมดมืด"}</span>
    </button>
  );
}
