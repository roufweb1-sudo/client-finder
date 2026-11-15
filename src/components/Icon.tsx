import type { SVGProps } from "react";

/**
 * The one icon set for the whole site: simple line icons drawn in our own style.
 * We use these instead of emojis so every screen looks like one brand.
 */
export type IconName =
  | "crown"
  | "logout"
  | "search"
  | "spark"
  | "phone"
  | "star"
  | "check"
  | "menu"
  | "close"
  | "arrow"
  | "refresh"
  | "shield"
  | "bolt"
  | "users"
  | "chart"
  | "doc"
  | "chat"
  | "mail"
  | "pin"
  | "lock"
  | "clock"
  | "download"
  | "flame"
  | "globe"
  | "card"
  | "sliders"
  | "link";

const PATHS: Record<IconName, React.ReactNode> = {
  crown: <path d="M3 6l4.5 4L12 4l4.5 6L21 6l-2 12H5L3 6zM5 21h14" />,
  logout: <path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h6m-2-8h12m-4-4 4 4-4 4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </>
  ),
  spark: (
    <>
      <path d="M11 3.5 12.9 8.6 18 10.5l-5.1 1.9L11 17.5 9.1 12.4 4 10.5l5.1-1.9z" />
      <path d="M18 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />,
  star: <path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  refresh: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9" />
      <path d="M20 4v5h-5" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 15" />
      <path d="M4 20v-5h5" />
    </>
  ),
  shield: <path d="M12 3.2 19 6v5.2c0 4.3-2.9 7.8-7 9.6-4.1-1.8-7-5.3-7-9.6V6z" />,
  bolt: <path d="M13.5 3 6 13.2h4.8L10 21l7.8-10.4H13z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2" />
      <path d="M17.5 14.4a5.5 5.5 0 0 1 3 5.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V7" />
      <path d="M17 20v-9" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3.5H7.5a1.5 1.5 0 0 0-1.5 1.5v14a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 13h6" />
      <path d="M9 16.5h4" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12.5c0 3.9-3.6 7-8 7a9 9 0 0 1-2.7-.4L4.5 20.5l1.2-3.4A6.7 6.7 0 0 1 4 12.5c0-3.9 3.6-7 8-7s8 3.1 8 7z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m8 10.5 4 4 4-4" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  flame: <path d="M12 3s5.5 4.2 5.5 9.2A5.5 5.5 0 0 1 12 21a5.5 5.5 0 0 1-5.5-5.5c0-2 1-3.4 1-3.4s.6 1.4 2 1.9c0-3.4 1.5-6 4.5-11z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M7 14.5h3" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
};

export default function Icon({ name, className = "h-4 w-4", strokeWidth = 1.7, ...rest }: { name: IconName; className?: string; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
