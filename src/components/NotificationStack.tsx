import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/context/SessionContext";
import "../styles/NotificationStack.css";

/* RESET NOTS

Object.keys(localStorage)
  .filter(k => k.startsWith("notif_dismissed_"))
  .forEach(k => localStorage.removeItem(k));

*/

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotifyOptions {
  id: string;
  title: string;
  message?: string;
  type?: NotificationType;
  duration?: number;
  action?: { label: string; href?: string; onClick?: () => void };
  allowDismissForever?: boolean;
  theme?: string;
}

interface NotificationInternal extends NotifyOptions {
  createdAt: number;
  type: NotificationType;
  allowDismissForever: boolean;
}

const DISMISSED_PREFIX = "notif_dismissed_";

function isDismissed(id: string): boolean {
  try {
    return localStorage.getItem(DISMISSED_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function markDismissed(id: string) {
  try {
    localStorage.setItem(DISMISSED_PREFIX + id, "1");
  } catch {
    /* noop */
  }
}

type Listener = (items: NotificationInternal[]) => void;
const listeners = new Set<Listener>();
let queue: NotificationInternal[] = [];

function emit() {
  const snapshot = [...queue];
  listeners.forEach((fn) => fn(snapshot));
}

export function notify(opts: NotifyOptions): string | null {
  if (isDismissed(opts.id)) return null;
  if (queue.some((n) => n.id === opts.id)) return null;

  const item: NotificationInternal = {
    ...opts,
    type: opts.type ?? "info",
    allowDismissForever: opts.allowDismissForever ?? true,
    createdAt: Date.now(),
  };
  queue = [...queue, item];
  emit();
  return opts.id;
}

export function dismissNotification(id: string) {
  queue = queue.filter((n) => n.id !== id);
  emit();
}

export function clearAllNotifications() {
  queue = [];
  emit();
}

interface ToastProps {
  item: NotificationInternal;
  onClose: () => void;
  onDismissForever: () => void;
}

const Toast: React.FC<ToastProps> = ({ item, onClose, onDismissForever }) => {
  const { homeSession } = useSession();
  const theme = item.theme || homeSession.dominantTheme || "#AFAFAF";
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  const closeWith = (beforeClose?: () => void) => {
    beforeClose?.();
    setLeaving(true);
    setTimeout(() => onCloseRef.current(), 260);
  };

  useEffect(() => {
    const duration = item.duration ?? 8000;
    if (duration <= 0) return;
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onCloseRef.current(), 260);
    }, duration);
    return () => clearTimeout(t);
  }, [item.duration]);

  const handleAction = () => {
    if (item.action?.href) {
      window.open(item.action.href, "_blank", "noopener,noreferrer");
    }
    item.action?.onClick?.();
    closeWith();
  };

  return (
    <div
      className={`notif-toast ${
        mounted && !leaving ? "is-visible" : ""
      } ${leaving ? "is-leaving" : ""}`}
      style={{ "--dominant-theme": theme } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      {item.allowDismissForever && (
        <button
          className="notif-toast_close"
          onClick={() => closeWith(onDismissForever)}
          aria-label="Don't show again"
          title="Don't show again"
        >
          ✕
        </button>
      )}

      <div className="notif-toast_title">{item.title}</div>

      {item.message && (
        <div className="notif-toast_message">{item.message}</div>
      )}

      {item.action && (
        <button className="notif-toast_action" onClick={handleAction}>
          {item.action.label}
        </button>
      )}
    </div>
  );
};

const NotificationStack: React.FC = () => {
  const [items, setItems] = useState<NotificationInternal[]>([]);

  useEffect(() => {
    const listener: Listener = (snapshot) => setItems(snapshot);
    listeners.add(listener);
    setItems([...queue]);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (items.length === 0) return null;

  return createPortal(
    <div className="notif-stack">
      {items.map((item) => (
        <Toast
          key={item.id}
          item={item}
          onClose={() => dismissNotification(item.id)}
          onDismissForever={() => markDismissed(item.id)}
        />
      ))}
    </div>,
    document.body,
  );
};

export default NotificationStack;
