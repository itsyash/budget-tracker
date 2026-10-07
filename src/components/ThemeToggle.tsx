"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button onClick={toggle} className="btn btn-ghost w-full justify-start" aria-label="Toggle theme">
      {mounted && dark ? <Moon size={16} /> : <Sun size={16} />}
      <span>{mounted ? (dark ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
