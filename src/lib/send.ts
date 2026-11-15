/** Links that hand a finished message over to WhatsApp or to the user's own mail app. */

export function waLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Opens the Gmail compose window in a browser tab, already filled in. */
export function gmailLink(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

/** Opens whatever mail app the device has set as default (Outlook, Apple Mail, Gmail on Android). */
export function mailtoLink(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(to)}?${q.toString()}`;
}

export function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
