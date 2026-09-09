"use client";

import { useEffect, useState } from "react";

const tools = [
  { label: "• List", insert: "• " },
  { label: "1. List", insert: "1. " },
  { label: "✓", insert: "✓ " },
  { label: "₹", insert: "₹" },
  { label: "→", insert: "→ " },
  { label: "★", insert: "★ " },
  { label: "⚠", insert: "⚠ " },
  { label: "—", insert: " — " },
];

export default function AdminWritingToolbar() {
  const [target, setTarget] = useState<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      const element = event.target;
      if (element instanceof HTMLTextAreaElement && element.closest(".admin-layout-content")) {
        setTarget(element);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  function insertText(text: string) {
    if (!target) return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const next = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(target, next);
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
    requestAnimationFrame(() => target.setSelectionRange(start + text.length, start + text.length));
  }

  if (!target) return null;

  return (
    <div className="admin-writing-toolbar" aria-label="Text entry tools">
      <span>Text tools</span>
      {tools.map((tool) => (
        <button key={tool.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertText(tool.insert)} title={`Insert ${tool.label}`}>
          {tool.label}
        </button>
      ))}
      <button type="button" className="close" onMouseDown={(e) => e.preventDefault()} onClick={() => setTarget(null)} title="Hide text tools">×</button>
      <style jsx>{`
        .admin-writing-toolbar{position:fixed;right:18px;bottom:18px;z-index:90;display:flex;align-items:center;gap:5px;max-width:calc(100vw - 36px);padding:7px;border:1px solid #dbe3ee;border-radius:12px;background:rgba(255,255,255,.98);box-shadow:0 12px 32px rgba(15,39,71,.16);overflow-x:auto;backdrop-filter:blur(10px)}
        span{flex:0 0 auto;padding:0 5px;color:#64748b;font-size:11px;font-weight:850}button{flex:0 0 auto;min-width:34px;min-height:32px;padding:5px 8px;border:1px solid #dbe3ee;border-radius:8px;background:#f8fafc;color:#17365f;font-size:12px;font-weight:850;cursor:pointer}button:hover{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}.close{color:#b42318;background:#fff}
        @media(max-width:900px){.admin-writing-toolbar{left:7px;right:7px;bottom:7px;max-width:none;border-radius:10px;padding:5px;gap:4px;overscroll-behavior-x:contain;scrollbar-width:thin}span{display:none}button{min-width:36px;min-height:38px;padding:5px 7px;font-size:12px}.close{position:sticky;right:0}}
      `}</style>
    </div>
  );
}
