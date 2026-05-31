/**
 * Shell icon set — ported from the Claude Design handoff bundle.
 *
 * Single-source SVG strings rather than per-icon Vue components so any
 * `.vue` or `.ts` consumer can drop them in via `v-html` or by spreading
 * into a `<svg>` element.
 *
 * All icons are 16x16 viewport, single-stroke, currentColor-aware so the
 * caller controls the rendered colour and size.
 */

export type IconKey =
  | "search"
  | "cmd"
  | "bell"
  | "plus"
  | "branch"
  | "commit"
  | "pr"
  | "issue"
  | "file"
  | "folder"
  | "chev"
  | "chevD"
  | "check"
  | "x"
  | "dot3"
  | "spark"
  | "star"
  | "eye"
  | "fork"
  | "play"
  | "pause"
  | "retry"
  | "rocket"
  | "tag"
  | "msg"
  | "ai"
  | "inbox"
  | "globe"
  | "lock"
  | "bolt"
  | "clock"
  | "settings"
  | "terminal"
  | "filter"
  | "user"
  | "copy"
  | "ds";

export const Ic: Record<IconKey, string> = {
  search:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>',
  cmd:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 4.5a1.5 1.5 0 1 0 1.5 1.5V4.5h0H5zm6 0v1.5a1.5 1.5 0 1 0-1.5-1.5h1.5zm0 7a1.5 1.5 0 1 0-1.5-1.5h1.5v1.5zm-6 0V10h1.5a1.5 1.5 0 1 1-1.5 1.5z"/><path d="M6.5 6h3v4h-3z"/></svg>',
  bell:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 11V7a4 4 0 1 1 8 0v4l1 1.5H3L4 11zM6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>',
  plus:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 3v10M3 8h10"/></svg>',
  branch:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="6" r="1.5"/><path d="M4 5.5v5M4 8c4 0 6-.5 6-2.5"/></svg>',
  commit:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.5"/><path d="M1.5 8H5m6 0h3.5"/></svg>',
  pr:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M4 5.5v5M12 10.5v-4a2 2 0 0 0-2-2H7.5m1.5-1.5L7.5 4.5l1.5 1.5"/></svg>',
  issue:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></svg>',
  file:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 2.5h6L12.5 5.5v8h-9z"/><path d="M9.5 2.5v3h3"/></svg>',
  folder:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 4.5h4l1.5 1.5h5.5v7h-11z"/></svg>',
  chev:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 4l4 4-4 4"/></svg>',
  chevD:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 6l4 4 4-4"/></svg>',
  check:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3.5 8.5l3 3 6-6.5"/></svg>',
  x:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  dot3:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="3" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="13" cy="8" r="1.2"/></svg>',
  spark:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.5l1.4 4.6 4.6 1.4-4.6 1.4L8 13.5 6.6 8.9 2 7.5l4.6-1.4z"/></svg>',
  star:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2l1.8 3.7 4.2.6-3 3 .7 4.2L8 11.6l-3.7 1.9.7-4.2-3-3 4.2-.6z"/></svg>',
  eye:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.7"/></svg>',
  fork:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="3.5" r="1.3"/><circle cx="12" cy="3.5" r="1.3"/><circle cx="8" cy="12.5" r="1.3"/><path d="M4 4.8v2c0 1 .8 1.8 1.8 1.8h4.4c1 0 1.8-.8 1.8-1.8v-2M8 8.6v2.6"/></svg>',
  play:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M5 3.5l7 4.5-7 4.5z"/></svg>',
  pause:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><rect x="4" y="3.5" width="3" height="9" rx="1"/><rect x="9" y="3.5" width="3" height="9" rx="1"/></svg>',
  retry:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5V5h-2.5"/></svg>',
  rocket:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 13l2-2m6-6.5c3 1.5 1.5 5.5 1.5 5.5s-4 1.5-5.5-1.5l-1.5-1.5c-1.5-1.5 0-5.5 0-5.5s4-1.5 5.5 1.5zM6.5 10.5l-3 .5.5-3"/></svg>',
  tag:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 7l6.5-4.5 4.5 4.5L9 13.5z"/><circle cx="6" cy="6" r="1"/></svg>',
  msg:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 3.5h11v8H8l-3 2.5V11.5H2.5z"/></svg>',
  ai:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.5l1.5 3.5L13 6.5l-3.5 1.5L8 11.5 6.5 8 3 6.5l3.5-1.5zM12 11l.7 1.5 1.5.7-1.5.7L12 15.5l-.7-1.5-1.5-.7 1.5-.7z"/></svg>',
  inbox:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 9.5l1.5-6h9L14 9.5v3.5H2zM2 9.5h3l1 1.5h4l1-1.5h3"/></svg>',
  globe:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>',
  lock:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
  bolt:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5L3.5 9h4l-1 5.5L13 6.5h-4z"/></svg>',
  clock:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg>',
  settings:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M3.5 8h-2M14.5 8h-2M4.4 4.4L3 3M13 13l-1.4-1.4M11.6 4.4L13 3M3 13l1.4-1.4"/></svg>',
  terminal:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M4 6.5l2 1.5-2 1.5M7.5 10h4"/></svg>',
  filter:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 4h11l-4 5v4l-3-1.5V9z"/></svg>',
  ds:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 4l5.5-2 5.5 2-5.5 2zM2.5 8l5.5 2 5.5-2M2.5 12l5.5 2 5.5-2"/></svg>',
  user:
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4"/></svg>',
  copy:
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 11V4a1 1 0 0 1 1-1h7"/></svg>',
};
