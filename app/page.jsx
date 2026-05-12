"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design Tokens — Midnight Sakura Dark Mode ────────────────────────────────
const C = {
  bg:          "#020617",                       // slate-950
  glass:       "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.08)",
  shadow:      "0 8px 40px rgba(0,0,0,0.45)",
  textPrimary:   "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted:     "#475569",
  accent:     "#dda0dd",
  accentDark: "#c084c0",
  accentGlow: "rgba(221,160,221,0.18)",
};

// ─── Typography Scale ─────────────────────────────────────────────────────────
const T = {
  label:  { fontSize: 9.5,  letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500  },
  body:   { fontSize: 12,   letterSpacing: "0.01em",  fontWeight: 400 },
  bodySm: { fontSize: 11,   letterSpacing: "0.03em",  fontWeight: 300 },
  mono:   { fontSize: 10,   letterSpacing: "0.04em",  fontVariantNumeric: "tabular-nums" },
  header: { fontSize: 24,   letterSpacing: "-0.02em", fontWeight: 500  },
  num:    { fontSize: 36,   letterSpacing: "-0.04em", fontWeight: 500, lineHeight: 1 },
};

// ─── Data Layer ───────────────────────────────────────────────────────────────
const SEED_TASKS = [
  { id: 1, label: "Finish Sakura dark mode pivot",  done: false },
  { id: 2, label: "Wire Spotify API token refresh", done: false },
  { id: 3, label: "Ship Phase 1 to staging",        done: false },
];

const EVENTS = [
  { time: "09:00", label: "Design sync",          tag: "Team",     dot: "#dda0dd" },
  { time: "11:30", label: "Component review",     tag: "Dev",      dot: "#93c5fd" },
  { time: "14:00", label: "Phase 2 planning",     tag: "Planning", dot: "#86efac" },
  { time: "16:30", label: "Wrap-up & ship notes", tag: "Solo",     dot: "#fca5a5" },
];

// Mock nowPlaying — shape mirrors the Spotify Web API adapter.
// Replace with real API state once the token flow is wired.
const [nowPlaying, setNowPlaying] = useState({
  isPlaying: false,
  songTitle: "Not Playing",
  artist: "Waiting for Spotify...",
  albumArtUrl: null,
  progress: 0
});

const SUGGESTIONS = [
  { icon: "plus",  label: "Add a new task",         hint: "task",    category: "Create" },
  { icon: "cal",   label: "Schedule a meeting",     hint: "event",   category: "Create" },
  { icon: "star",  label: "Set today's focus",      hint: "focus",   category: "Quick"  },
  { icon: "clock", label: "Start Pomodoro session", hint: "timer",   category: "Quick"  },
  { icon: "music", label: "Open Spotify controls",  hint: "spotify", category: "Go to"  },
  { icon: "stats", label: "View weekly stats",      hint: "stats",   category: "Go to"  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
};
const tileVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const sidebarVariants = {
  hidden: { x: -64, opacity: 0 },
  show:   { x: 0,   opacity: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const overlayVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.18 } },
  exit:   { opacity: 0, transition: { duration: 0.16 } },
};
const cmdBarVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, scale: 0.97, y: -8,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

// ─── SVG Icon System ──────────────────────────────────────────────────────────
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const MusicIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden="true">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);
const SearchIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const CheckIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const PlusIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const TasksIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const SUGGESTION_ICONS = {
  plus: PlusIcon, cal: CalIcon, star: StarIcon,
  clock: ClockIcon, music: MusicIcon, stats: StatsIcon,
};

// ─── Sakura Branch — tuned for dark background ────────────────────────────────
function SakuraBranch() {
  const clusters = [
    [185,118,["#c87fa0","#b06e8a"],[0,72,144,216,288]],
    [210,102,["#d4a0b8","#c87fa0"],[20,92,164,236,308]],
    [222,132,["#b06e8a","#c87fa0","#d4a0b8"],[10,82,154,226,298]],
    [230,260,["#c87fa0","#b06e8a"],[5,77,149,221,293]],
    [178,278,["#d4a0b8","#c87fa0"],[15,87,159,231,303]],
    [202,292,["#c87fa0","#b06e8a","#d4a0b8"],[30,102,174,246,318]],
    [112,392,["#d4a0b8","#c87fa0"],[0,72,144,216,288]],
    [142,377,["#c87fa0","#b06e8a"],[18,90,162,234,306]],
    [87, 412,["#b06e8a","#c87fa0","#d4a0b8"],[8,80,152,224,296]],
  ];
  return (
    <svg viewBox="0 0 520 900" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMaxYMin meet" aria-hidden="true"
      style={{ width:"100%", height:"100%", opacity: 0.22 }}>
      <path d="M420 0 C400 80,360 160,320 220 C280 280,240 300,200 360 C160 420,140 490,130 560 C120 630,125 700,140 780"
        stroke="#7a4a5e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M370 100 C340 85,300 70,270 80 C240 90,210 110,190 130"
        stroke="#7a4a5e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M295 235 C265 245,230 260,205 280 C180 300,165 320,155 345"
        stroke="#7a4a5e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M220 370 C190 365,155 370,130 385 C105 400,90 425,85 455"
        stroke="#7a4a5e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M155 500 C125 510,95 525,75 550"
        stroke="#7a4a5e" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <g opacity="0.75">
        {clusters.map(([cx,cy,fills,rots], ci) => (
          <g key={ci}>
            {rots.map((r,i) => (
              <ellipse key={i} cx={cx} cy={cy-6.5} rx="4" ry="6"
                fill={fills[i % fills.length]}
                transform={`rotate(${r} ${cx} ${cy})`}/>
            ))}
            <circle cx={cx} cy={cy} r="2" fill="rgba(255,220,235,0.6)"/>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Shared Primitives ────────────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span style={{
      ...T.label, color: C.accentDark,
      background: "rgba(221,160,221,0.12)",
      border: "0.5px solid rgba(221,160,221,0.2)",
      borderRadius: 6, padding: "3px 8px", alignSelf: "flex-start",
    }}>{children}</span>
  );
}

function GlassTile({ style, children }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={tileVariants}
      onHoverStart={() => setHov(true)}
      onHoverEnd={()   => setHov(false)}
      style={{
        ...style,
        background: hov ? "rgba(255,255,255,0.08)" : C.glass,
        border: `0.5px solid ${hov ? "rgba(221,160,221,0.2)" : C.glassBorder}`,
        borderRadius: 20,
        boxShadow: hov
          ? `0 20px 60px rgba(0,0,0,0.6), inset 0 0.5px 0 rgba(255,255,255,0.1)`
          : `${C.shadow}, inset 0 0.5px 0 rgba(255,255,255,0.06)`,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
      }}>
      {/* Top-edge glass highlight */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        pointerEvents: "none",
      }}/>
      {children}
    </motion.div>
  );
}

// ─── Hero Tile ────────────────────────────────────────────────────────────────
// tasks and onToggle come from root state — single source of truth.
function HeroTile({ tasks, onToggle }) {
  const dateLabel  = new Date().toLocaleDateString("en-CA", { weekday:"short", month:"short", day:"numeric" });
  const doneCount  = tasks.filter(t => t.done).length;

  return (
    <GlassTile style={{ gridColumn:"1 / 5", gridRow:"1 / 3", padding:"26px 24px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <Chip>Today's Tasks</Chip>
        <div style={{ textAlign:"right" }}>
          <span style={{ ...T.mono, color:C.textMuted }}>{dateLabel}</span>
          <p style={{ ...T.label, fontSize:9, color:C.textMuted, marginTop:2 }}>
            {doneCount}/{tasks.length} done
          </p>
        </div>
      </div>

      {/* Scrollable task list */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, overflowY:"auto", paddingRight:2 }}>
        <AnimatePresence initial={false}>
          {tasks.length === 0 && (
            <motion.div key="empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:10, color:C.textMuted, padding:"24px 0" }}>
              <PlusIcon size={20}/>
              <p style={{ ...T.bodySm, color:C.textMuted, textAlign:"center", lineHeight:1.6 }}>
                No tasks yet.<br/>Press ⌘K to add one.
              </p>
            </motion.div>
          )}
          {tasks.map(task => (
            <motion.div key={task.id} layout
              initial={{ opacity:0, x:-12, scale:0.97 }}
              animate={{ opacity:1, x:0,   scale:1    }}
              exit={{    opacity:0, x:12,   scale:0.97 }}
              transition={{ duration:0.28, ease:[0.16,1,0.3,1] }}
              onClick={() => onToggle(task.id)}
              style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"10px 12px", borderRadius:12, cursor:"pointer",
                background: task.done ? "rgba(221,160,221,0.06)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${task.done ? "rgba(221,160,221,0.15)" : "rgba(255,255,255,0.06)"}`,
                transition:"background 0.2s ease, border-color 0.2s ease",
              }}>
              {/* Checkbox */}
              <motion.div
                animate={{
                  background: task.done ? C.accent : "transparent",
                  borderColor: task.done ? C.accent : "rgba(148,163,184,0.35)",
                }}
                transition={{ duration:0.2 }}
                style={{
                  width:18, height:18, borderRadius:5, flexShrink:0,
                  border:"1.5px solid rgba(148,163,184,0.35)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
              </motion.div>
              {/* Label */}
              <span style={{
                ...T.body, fontSize:13, flex:1,
                color: task.done ? C.textMuted : C.textPrimary,
                textDecoration: task.done ? "line-through" : "none",
                transition:"color 0.2s ease",
              }}>
                {task.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div style={{ paddingTop:12, marginTop:8, borderTop:`0.5px solid ${C.glassBorder}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", gap:3 }}>
          {["⌘","K"].map(k => (
            <kbd key={k} style={{
              fontSize:10, color:C.textMuted, background:"rgba(255,255,255,0.06)",
              border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:4,
              padding:"1px 5px", fontFamily:"inherit",
            }}>{k}</kbd>
          ))}
        </div>
        <span style={{ ...T.bodySm, color:C.textMuted }}>to add a task</span>
      </div>
    </GlassTile>
  );
}

// ─── Horizon Calendar Tile ────────────────────────────────────────────────────
function HorizonTile() {
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return (
    <GlassTile style={{ gridColumn:"5 / 9", gridRow:"1 / 2", padding:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Chip>Horizon</Chip>
        <span style={{ color:C.accentDark, opacity:0.7 }}><CalIcon/></span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", flex:1 }}>
        {EVENTS.map((ev, i) => {
          const [h, m] = ev.time.split(":").map(Number);
          const evMins    = h * 60 + m;
          const isPast    = evMins < nowMins;
          const isCurrent = !isPast && evMins - nowMins < 90;
          return (
            <div key={i} style={{
              display:"flex", alignItems:"stretch", gap:12, padding:"9px 0",
              borderBottom: i < EVENTS.length-1 ? "0.5px solid rgba(255,255,255,0.06)" : "none",
              opacity: isPast ? 0.3 : 1, transition:"opacity 0.3s",
            }}>
              <span style={{ ...T.mono, color:isPast ? C.textMuted : C.textSecondary, minWidth:34, paddingTop:2 }}>
                {ev.time}
              </span>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:7, height:7, borderRadius:"50%", marginTop:3, flexShrink:0,
                  background: isPast ? "rgba(148,163,184,0.2)" : ev.dot,
                  boxShadow: isCurrent ? `0 0 0 3px ${ev.dot}44, 0 0 8px ${ev.dot}66` : "none",
                  transition:"box-shadow 0.4s",
                }}/>
                {i < EVENTS.length-1 && (
                  <div style={{ width:1, flex:1, background:"rgba(255,255,255,0.07)", marginTop:4 }}/>
                )}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ ...T.body, fontSize:12.5, color:isPast ? C.textMuted : C.textPrimary,
                  fontWeight:isCurrent ? 500 : 400, lineHeight:1.3 }}>
                  {ev.label}
                </p>
                <span style={{ ...T.label, fontSize:9, color:C.textMuted }}>{ev.tag}</span>
              </div>
              {isCurrent && (
                <span style={{
                  fontSize:8.5, color:"#fff", background:C.accent,
                  borderRadius:5, padding:"2px 7px", alignSelf:"flex-start",
                  letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0,
                }}>Now</span>
              )}
            </div>
          );
        })}
      </div>
    </GlassTile>
  );
}

// ─── Spotify Tile ─────────────────────────────────────────────────────────────
// Fully prop-driven. `nowPlaying` shape:
//   { isPlaying: boolean, songTitle: string, artist: string,
//     albumArtUrl: string | null, progress: number (0–100) }
//
// ── Spotify Web API integration points are marked with ★ below ──────────────
function SpotifyTile({ nowPlaying, setNowPlaying }) {
  // Use the real duration from the API, or default to 214s if empty
  const DURATION = nowPlaying.durationMs ? nowPlaying.durationMs / 1000 : 214;

  const [localPlaying, setLocalPlaying] = useState(nowPlaying.isPlaying);
  const [localProgress, setLocalProgress] = useState(nowPlaying.progress);

  // Sync local UI bars with the master data coming from the API
  useEffect(() => {
    setLocalPlaying(nowPlaying.isPlaying);
    setLocalProgress(nowPlaying.progress);
  }, [nowPlaying]);

  // ★ INTEGRATION POINT — This fetches from your "Secret Bridge" every 3 seconds
  useEffect(() => {
    const fetchSpotify = async () => {
      try {
        const res = await fetch('/api/spotify');
        const data = await res.json();
        
        if (data && data.item) {
          setNowPlaying({
            isPlaying: data.is_playing,
            songTitle: data.item.name,
            artist: data.item.artists.map(a => a.name).join(", "),
            albumArtUrl: data.item.album.images[0].url,
            progress: (data.progress_ms / data.item.duration_ms) * 100,
            durationMs: data.item.duration_ms
          });
        } else {
          // If nothing is playing, reset to idle state
          setNowPlaying(prev => ({ ...prev, isPlaying: false }));
        }
      } catch (error) {
        console.error("Spotify check failed. Check your API route and keys.");
      }
    };

    const id = setInterval(fetchSpotify, 3000);
    return () => clearInterval(id);
  }, [setNowPlaying]);
useEffect(() => {
  const updateStatus = async () => {
    try {
      const res = await fetch('/api/spotify'); // Calls your secret bridge
      const data = await res.json();
      
      if (data && data.item) {
        setNowPlaying({
          isPlaying: data.is_playing,
          songTitle: data.item.name,
          artist: data.item.artists[0].name,
          albumArtUrl: data.item.album.images[0].url,
          progress: (data.progress_ms / data.item.duration_ms) * 100
        });
      }
    } catch (err) {
      console.log("Spotify is idle.");
    }
  };

  const interval = setInterval(updateStatus, 3000);
  return () => clearInterval(interval);
}, []);

  // Sync from parent if prop changes (live API update)
  useEffect(() => { setLocalPlaying(nowPlaying.isPlaying);  }, [nowPlaying.isPlaying]);
  useEffect(() => { setLocalProgress(nowPlaying.progress);  }, [nowPlaying.progress]);

  // Optimistic progress ticker
  useEffect(() => {
    if (!localPlaying) return;
    const id = setInterval(() => {
      setLocalProgress(p => p >= 100 ? 0 : parseFloat((p + 0.12).toFixed(2)));
    }, 200);
    return () => clearInterval(id);
  }, [localPlaying]);

  const formatTime = useCallback((pct) => {
    const s = Math.round(DURATION * pct / 100);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, []);

  const totalFormatted = useMemo(() => {
    return `${Math.floor(DURATION / 60)}:${String(DURATION % 60).padStart(2, "0")}`;
  }, []);

  const handleScrub = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = ((e.clientX - rect.left) / rect.width) * 100;
    setLocalProgress(Math.max(0, Math.min(100, parseFloat(pct.toFixed(1)))));
    // ★ also call Spotify seek endpoint here: PUT /me/player/seek?position_ms=...
  }, []);

  const marqueeAnim  = useMemo(() => localPlaying ? { x:[0,-72,0] } : { x:0 }, [localPlaying]);
  const marqueeTrans = useMemo(() =>
    localPlaying ? { duration:8, repeat:Infinity, ease:"linear" } : {}, [localPlaying]);

  return (
    <GlassTile style={{ gridColumn:"9 / 13", gridRow:"1 / 2", padding:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Chip>Now Playing</Chip>
        <span style={{ color:"#1DB954", opacity:0.9 }}><MusicIcon/></span>
      </div>

      {/* Track info */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>
        {/* Album art — renders img when albumArtUrl is set, else placeholder */}
        <div style={{
          width:56, height:56, borderRadius:10, flexShrink:0,
          background:"rgba(221,160,221,0.08)",
          border:"0.5px solid rgba(221,160,221,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          overflow:"hidden",
        }}>
          {nowPlaying.albumArtUrl
            ? <img src={nowPlaying.albumArtUrl} alt="Album art"
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <span style={{ color:"rgba(221,160,221,0.35)" }}><MusicIcon size={22}/></span>
          }
        </div>

        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{ overflow:"hidden", marginBottom:3 }}>
            <motion.p animate={marqueeAnim} transition={marqueeTrans}
              style={{ ...T.body, fontSize:13, fontWeight:500, color:C.textPrimary, whiteSpace:"nowrap" }}>
              {nowPlaying.songTitle}
            </motion.p>
          </div>
          <p style={{ ...T.bodySm, color:C.textSecondary }}>{nowPlaying.artist}</p>
          {/* Live indicator dot */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
            <div style={{
              width:5, height:5, borderRadius:"50%",
              background: localPlaying ? "#1DB954" : C.textMuted,
              boxShadow: localPlaying ? "0 0 6px #1DB95488" : "none",
              transition:"background 0.3s, box-shadow 0.3s",
            }}/>
            <span style={{ ...T.mono, color:C.textMuted }}>
              {localPlaying ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </div>

      {/* Progress + controls */}
      <div style={{ marginTop:"auto", paddingTop:12 }}>
        {/* Scrubber — pure Dusty Rose, no purple drift */}
        <div role="slider" aria-label="Playback progress"
          aria-valuenow={Math.round(localProgress)} aria-valuemin={0} aria-valuemax={100}
          onClick={handleScrub}
          style={{
            position:"relative", height:3,
            background:"rgba(255,255,255,0.08)",
            borderRadius:99, marginBottom:8, cursor:"pointer",
          }}>
          <motion.div
            style={{ height:"100%", borderRadius:99, background:C.accent, originX:0 }}
            animate={{ scaleX: localProgress / 100 }}
            transition={{ duration:0.18, ease:"linear" }}
          />
          <div style={{
            position:"absolute", top:"50%", left:`${localProgress}%`,
            transform:"translate(-50%,-50%)",
            width:9, height:9, borderRadius:"50%",
            background:C.accent,
            border:"1.5px solid rgba(2,6,23,0.8)",
            boxShadow:`0 0 6px ${C.accentGlow}`,
            transition:"left 0.1s linear",
          }}/>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ ...T.mono, color:C.textMuted }}>{formatTime(localProgress)}</span>
          <motion.button whileTap={{ scale:0.88 }}
            onClick={() => setLocalPlaying(p => !p)}
            aria-label={localPlaying ? "Pause" : "Play"}
            style={{
              width:32, height:32, borderRadius:"50%",
              background: localPlaying ? C.accent : "rgba(221,160,221,0.12)",
              border:`0.5px solid ${localPlaying ? C.accent : "rgba(221,160,221,0.25)"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", color: localPlaying ? "#fff" : C.accentDark,
              boxShadow: localPlaying ? `0 0 16px ${C.accentGlow}` : "none",
              transition:"all 0.2s ease",
            }}>
            {localPlaying ? <PauseIcon/> : <PlayIcon/>}
          </motion.button>
          <span style={{ ...T.mono, color:C.textMuted }}>{totalFormatted}</span>
        </div>
      </div>
    </GlassTile>
  );
}

// ─── Overview / Progress Tile — mirrors live task state ───────────────────────
function OverviewTile({ tasks }) {
  const doneCount = tasks.filter(t => t.done).length;
  const pct       = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <GlassTile style={{ gridColumn:"5 / 13", gridRow:"2 / 3", padding:"18px 24px", flexDirection:"row", gap:28 }}>
      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:5, minWidth:120 }}>
        <Chip>Progress</Chip>
        <div style={{ display:"flex", alignItems:"baseline", gap:5, marginTop:8 }}>
          <span style={{ ...T.num, color:C.textPrimary }}>{pct}</span>
          <span style={{ fontSize:14, color:C.textMuted }}>%</span>
        </div>
        <p style={{ ...T.bodySm, color:C.textSecondary }}>{doneCount} of {tasks.length} done</p>
        <div style={{ height:2, background:"rgba(255,255,255,0.07)", borderRadius:99, marginTop:6 }}>
          <motion.div
            animate={{ width:`${pct}%` }}
            transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            style={{
              height:"100%", borderRadius:99,
              background:C.accent,
              boxShadow:`0 0 8px ${C.accentGlow}`,
            }}
          />
        </div>
      </div>

      <div style={{ width:"0.5px", background:C.glassBorder, alignSelf:"stretch" }}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:9, overflowY:"auto" }}>
        <AnimatePresence initial={false}>
          {tasks.length === 0 && (
            <p style={{ ...T.bodySm, color:C.textMuted }}>Add tasks via ⌘K to track progress.</p>
          )}
          {tasks.map(t => (
            <motion.div key={t.id} layout
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:14, height:14, borderRadius:4, flexShrink:0,
                background: t.done ? C.accent : "transparent",
                border:`1.5px solid ${t.done ? C.accent : "rgba(148,163,184,0.25)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background 0.2s, border-color 0.2s",
              }}>
                {t.done && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                ...T.body, color:t.done ? C.textMuted : C.textPrimary,
                textDecoration:t.done ? "line-through" : "none",
              }}>{t.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassTile>
  );
}

// ─── Phase 2 Placeholder ──────────────────────────────────────────────────────
function Phase2Tile({ label, col, row }) {
  return (
    <motion.div variants={tileVariants} style={{
      gridColumn:col, gridRow:row,
      background:"rgba(255,255,255,0.02)",
      border:"0.5px dashed rgba(255,255,255,0.07)",
      borderRadius:20, opacity:0.5,
      display:"flex", flexDirection:"column",
      alignItems:"flex-start", justifyContent:"flex-end",
      padding:"14px 16px",
    }}>
      <span style={{ ...T.label, color:"rgba(192,132,192,0.45)" }}>{label}</span>
      <span style={{ ...T.label, fontSize:9, color:"rgba(71,85,105,0.6)", marginTop:2 }}>Phase 2</span>
    </motion.div>
  );
}

// ─── Ghost Command Bar ────────────────────────────────────────────────────────
// onAddTask(label) lifts a new task into root state.
// Free-text Enter → creates task. Suggestion Enter → selects action (no task created).
function GhostCommandBar({ onClose, onAddTask }) {
  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTIONS;
    return SUGGESTIONS.filter(s =>
      s.label.toLowerCase().includes(q) || s.hint.includes(q)
    );
  }, [query]);

  const categories = useMemo(() =>
    [...new Set(filtered.map(s => s.category))], [filtered]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);
  useEffect(() => { setActiveIdx(0); }, [query]);

  const commitTask = useCallback((label) => {
    setSubmitted(label);
    onAddTask(label);
    setTimeout(onClose, 750);
  }, [onAddTask, onClose]);

  const selectSuggestion = useCallback((label) => {
    setSubmitted(label);
    setTimeout(onClose, 750);
  }, [onClose]);

  const handleKey = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
    if (e.key === "Enter") {
      // If query matches a suggestion, select it; otherwise create a new task
      const chosen = query.trim() ? null : filtered[activeIdx];
      if (chosen)            selectSuggestion(chosen.label);
      else if (query.trim()) commitTask(query.trim());
    }
  }, [filtered, activeIdx, query, commitTask, selectSuggestion]);

  const kbdStyle = {
    fontSize:10, color:C.textMuted,
    background:"rgba(255,255,255,0.06)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderRadius:5, padding:"1px 6px", fontFamily:"inherit",
  };

  return (
    <>
      <motion.div variants={overlayVariants} initial="hidden" animate="show" exit="exit"
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:50,
          background:"rgba(2,6,23,0.72)",
          backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        }}/>

      <motion.div variants={cmdBarVariants} initial="hidden" animate="show" exit="exit"
        style={{
          position:"fixed", top:"22%", left:"50%", transform:"translateX(-50%)",
          zIndex:60, width:"min(560px, 88vw)",
        }}>
        <div style={{
          background:"rgba(15,23,42,0.92)",
          border:"0.5px solid rgba(255,255,255,0.1)",
          borderRadius:20,
          boxShadow:"0 40px 100px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(255,255,255,0.08)",
          overflow:"hidden",
        }}>
          {/* Accent top edge */}
          <div style={{
            height:1,
            background:"linear-gradient(90deg, transparent, rgba(221,160,221,0.3), transparent)",
          }}/>

          {/* Input */}
          <div style={{
            display:"flex", alignItems:"center", gap:12, padding:"16px 18px",
            borderBottom: filtered.length > 0 || query ? "0.5px solid rgba(255,255,255,0.07)" : "none",
          }}>
            <span style={{ color:C.textMuted, flexShrink:0, display:"flex" }}><SearchIcon/></span>
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a task to add, or search…"
              aria-label="Command bar"
              style={{
                flex:1, border:"none", outline:"none", background:"transparent",
                ...T.body, fontSize:15, color:C.textPrimary, fontFamily:"inherit",
                caretColor:C.accent,
              }}
            />
            <kbd style={kbdStyle}>esc</kbd>
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear"
                style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, display:"flex", padding:2 }}>
                <XIcon/>
              </button>
            )}
          </div>

          {/* Suggestions */}
          {!submitted && filtered.length > 0 && (
            <div style={{ padding:"8px 0 2px" }}>
              {categories.map(cat => (
                <div key={cat}>
                  <p style={{ ...T.label, color:C.textMuted, padding:"6px 18px 4px" }}>{cat}</p>
                  {filtered.filter(s => s.category === cat).map(s => {
                    const globalIdx = filtered.indexOf(s);
                    const isActive  = globalIdx === activeIdx;
                    const Ico       = SUGGESTION_ICONS[s.icon] ?? PlusIcon;
                    return (
                      <motion.div key={s.label}
                        onClick={() => selectSuggestion(s.label)}
                        onHoverStart={() => setActiveIdx(globalIdx)}
                        animate={{ background: isActive ? "rgba(221,160,221,0.08)" : "transparent" }}
                        transition={{ duration:0.12 }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 18px", cursor:"pointer" }}>
                        <span style={{ color:isActive ? C.accentDark : C.textMuted, display:"flex", flexShrink:0 }}>
                          <Ico/>
                        </span>
                        <span style={{ flex:1, ...T.body, color:isActive ? C.textPrimary : C.textSecondary, fontWeight:isActive ? 500 : 400 }}>
                          {s.label}
                        </span>
                        {isActive && <span style={{ color:C.textMuted, display:"flex" }}><ArrowIcon/></span>}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Free-text task creation hint */}
          {!submitted && query.trim() && (
            <div style={{
              padding:"10px 18px 12px",
              borderTop: filtered.length > 0 ? "0.5px solid rgba(255,255,255,0.06)" : "none",
              display:"flex", alignItems:"center", gap:8,
            }}>
              <span style={{ color:C.accentDark, display:"flex" }}><PlusIcon size={12}/></span>
              <span style={{ ...T.bodySm, color:C.textSecondary }}>
                Press <kbd style={kbdStyle}>↵</kbd> to add task:{" "}
                <span style={{ color:C.textPrimary, fontWeight:500 }}>"{query}"</span>
              </span>
            </div>
          )}

          {/* Confirmation */}
          {submitted && (
            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:22, height:22, borderRadius:"50%", background:C.accent,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, boxShadow:`0 0 12px ${C.accentGlow}`,
              }}>
                <CheckIcon size={12}/>
              </div>
              <span style={{ ...T.body, color:C.textSecondary }}>
                Added — <span style={{ color:C.textPrimary, fontWeight:500 }}>"{submitted}"</span>
              </span>
            </motion.div>
          )}

          {/* Keyboard hint footer */}
          {!submitted && (
            <div style={{
              display:"flex", gap:16, padding:"8px 18px 12px",
              borderTop:"0.5px solid rgba(255,255,255,0.06)",
            }}>
              {[["↑↓","Navigate"],["↵","Add / Select"],["esc","Close"]].map(([key, hint]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <kbd style={kbdStyle}>{key}</kbd>
                  <span style={{ ...T.mono, color:C.textMuted }}>{hint}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"home",  Icon:HomeIcon,  label:"Home"  },
  { id:"tasks", Icon:TasksIcon, label:"Tasks" },
  { id:"stats", Icon:StatsIcon, label:"Stats" },
];

function Sidebar({ onCmdK }) {
  const [active, setActive] = useState("home");
  const [hov,    setHov]    = useState(null);
  return (
    <motion.nav variants={sidebarVariants} initial="hidden" animate="show"
      aria-label="Main navigation"
      style={{
        position:"relative", zIndex:20, width:64, flexShrink:0, height:"100vh",
        background:"rgba(255,255,255,0.03)",
        borderRight:"0.5px solid rgba(255,255,255,0.07)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"26px 0", gap:6,
      }}>
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none"
        aria-hidden="true" style={{ opacity:0.35, marginBottom:18 }}>
        <circle cx="14" cy="14" r="13" stroke={C.textSecondary} strokeWidth="1.2"/>
        <path d="M14 6 C14 6,10 10,10 14 C10 18,14 22,14 22 C14 22,18 18,18 14 C18 10,14 6,14 6Z"
          stroke={C.accent} strokeWidth="1.2" fill="none"/>
        <circle cx="14" cy="14" r="2" fill={C.accent} opacity="0.8"/>
      </svg>

      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const isActive = active === id;
        const isHov    = hov === id;
        return (
          <div key={id} title={label} role="button" aria-label={label}
            onClick={() => setActive(id)}
            onMouseEnter={() => setHov(id)}
            onMouseLeave={() => setHov(null)}
            style={{
              width:40, height:40, borderRadius:10, position:"relative",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer",
              background: isActive ? "rgba(221,160,221,0.15)" : isHov ? "rgba(255,255,255,0.05)" : "transparent",
              color: isActive ? C.accent : C.textMuted,
              opacity: isActive ? 1 : isHov ? 0.8 : 0.4,
              transition:"all 0.2s ease",
            }}>
            {isActive && (
              <span style={{
                position:"absolute", left:-1, width:3, height:18,
                borderRadius:"0 3px 3px 0", background:C.accent,
                boxShadow:`0 0 8px ${C.accentGlow}`,
              }}/>
            )}
            <Icon/>
          </div>
        );
      })}

      <div style={{ flex:1 }}/>

      <motion.div title="Command Bar (⌘K)" whileTap={{ scale:0.92 }} onClick={onCmdK}
        role="button" aria-label="Open command bar"
        style={{ width:40, height:40, borderRadius:10, display:"flex",
          alignItems:"center", justifyContent:"center", cursor:"pointer", flexDirection:"column", gap:2 }}>
        <div style={{ display:"flex", gap:3 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:3, height:3, borderRadius:"50%", background:C.textMuted, opacity:0.4 }}/>
          ))}
        </div>
      </motion.div>

      <div title="Settings" role="button" aria-label="Settings"
        style={{ width:40, height:40, borderRadius:10, display:"flex",
          alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textMuted, opacity:0.35 }}>
        <SettingsIcon/>
      </div>
    </motion.nav>
  );
}

// ─── Root Shell ───────────────────────────────────────────────────────────────
// Single source of truth: tasks[] and nowPlaying live here.
export default function SakuraShell() {
  const [tasks,      setTasks]      = useState(SEED_TASKS);
  const [cmdOpen,    setCmdOpen]    = useState(false);
  const [nowPlaying, setNowPlaying] = useState(MOCK_NOW_PLAYING);
  // ★ To wire Spotify: add a useEffect here that fetches from your backend
  //   and calls setNowPlaying({ isPlaying, songTitle, artist, albumArtUrl, progress }).

  const addTask = useCallback((label) => {
    setTasks(prev => [...prev, { id:Date.now(), label, done:false }]);
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done:!t.done } : t));
  }, []);

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = now.toLocaleDateString("en-CA", {
    weekday:"long", month:"long", day:"numeric",
  }).toUpperCase();

  const handleGlobalKey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    if (e.key === "Escape") setCmdOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  return (
    <div style={{
      fontFamily:"'Geist Sans','Geist',ui-sans-serif,system-ui,sans-serif",
      background:C.bg, color:C.textPrimary,
      height:"100vh", width:"100vw",
      overflow:"hidden", display:"flex", position:"relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button { font-family:inherit; outline:none; }
        input  { font-family:inherit; }
        input::placeholder { color:#475569; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:99px; }
      `}</style>

      <Sidebar onCmdK={() => setCmdOpen(o => !o)}/>

      <main style={{ flex:1, position:"relative", height:"100vh", overflow:"hidden" }}>
        {/* Sakura anchor */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ duration:1.4, delay:0.2 }} aria-hidden="true"
          style={{
            position:"absolute", right:0, top:0,
            height:"100%", width:"42%",
            pointerEvents:"none", zIndex:0,
          }}>
          <SakuraBranch/>
        </motion.div>

        {/* Content */}
        <div style={{
          position:"relative", zIndex:10, height:"100vh",
          padding:"28px 32px 28px 28px", display:"flex", flexDirection:"column",
        }}>
          {/* Header bar */}
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.38, ease:[0.16,1,0.3,1] }}
            style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:20 }}>
            <span style={{ ...T.label, color:C.textMuted, fontWeight:400 }}>{dateStr}</span>
            <span style={{ width:3, height:3, borderRadius:"50%", background:C.accent,
              opacity:0.6, alignSelf:"center", display:"inline-block" }}/>
            <span style={{ ...T.bodySm, color:C.textMuted }}>{greeting}</span>
            <div style={{ marginLeft:"auto" }}>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
                onClick={() => setCmdOpen(o => !o)} aria-label="Open command bar"
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  background:"rgba(255,255,255,0.05)",
                  border:"0.5px solid rgba(255,255,255,0.1)",
                  borderRadius:10, padding:"5px 12px", cursor:"pointer",
                  backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                }}>
                <SearchIcon/>
                <span style={{ ...T.mono, color:C.textMuted }}>Search or create</span>
                <div style={{ display:"flex", gap:3, marginLeft:4 }}>
                  {["⌘","K"].map(k => (
                    <kbd key={k} style={{
                      fontSize:10, color:C.textMuted,
                      background:"rgba(255,255,255,0.06)",
                      border:"0.5px solid rgba(255,255,255,0.1)",
                      borderRadius:4, padding:"1px 5px", fontFamily:"inherit",
                    }}>{k}</kbd>
                  ))}
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Bento grid */}
          <motion.div variants={containerVariants} initial="hidden" animate="show"
            style={{
              display:"grid",
              gridTemplateColumns:"repeat(12, 1fr)",
              gridTemplateRows:"repeat(3, 1fr)",
              gap:14, flex:1, minHeight:0,
            }}>
            <HeroTile     tasks={tasks}           onToggle={toggleTask}/>
            <HorizonTile/>
            <SpotifyTile  nowPlaying={nowPlaying}/>
            <OverviewTile tasks={tasks}/>
            <Phase2Tile label="Zen Ring"   col="1 / 5"  row="3 / 4"/>
            <Phase2Tile label="Brain Dump" col="5 / 9"  row="3 / 4"/>
            <Phase2Tile label="Petals"     col="9 / 13" row="3 / 4"/>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {cmdOpen && (
          <GhostCommandBar
            onClose={() => setCmdOpen(false)}
            onAddTask={addTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}