"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:            "#020617",
  glass:         "rgba(255,255,255,0.055)",
  glassBorder:   "rgba(255,255,255,0.09)",
  shadow:        "0 8px 40px rgba(0,0,0,0.45)",
  textPrimary:   "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted:     "#64748b",
  accent:        "#dda0dd",
  accentDark:    "#c084c0",
  accentGlow:    "rgba(221,160,221,0.2)",
};

const T = {
  label:  { fontSize: 9.5,  letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 },
  body:   { fontSize: 13,   letterSpacing: "0.01em",  fontWeight: 400 },
  bodySm: { fontSize: 11.5, letterSpacing: "0.02em",  fontWeight: 300 },
  mono:   { fontSize: 10.5, letterSpacing: "0.03em",  fontVariantNumeric: "tabular-nums" },
  header: { fontSize: 24,   letterSpacing: "-0.02em", fontWeight: 500 },
  num:    { fontSize: 36,   letterSpacing: "-0.04em", fontWeight: 500, lineHeight: 1 },
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};
const tileVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: [0.16,1,0.3,1] } },
};
const sidebarVariants = {
  hidden: { x: -64, opacity: 0 },
  show:   { x: 0,   opacity: 1, transition: { duration: 0.55, ease: [0.16,1,0.3,1] } },
};
const overlayVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.18 } },
  exit:   { opacity: 0, transition: { duration: 0.16 } },
};
const cmdBarVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.28, ease: [0.16,1,0.3,1] } },
  exit:   { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18, ease: [0.4,0,1,1] } },
};

// ─── Icon Library ─────────────────────────────────────────────────────────────
const Svg = ({ size=18, children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true" {...p}>
    {children}
  </svg>
);
const HomeIcon     = () => <Svg><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></Svg>;
const TasksIcon    = () => <Svg><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>;
const StatsIcon    = () => <Svg><path d="M18 20V10M12 20V4M6 20v-6"/></Svg>;
const SettingsIcon = () => <Svg><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></Svg>;
const CalIcon      = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Svg>;
const MusicIcon    = ({ size=18 }) => <Svg size={size}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></Svg>;
const PlayIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PauseIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const SearchIcon   = ({ size=16 }) => <Svg size={size}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Svg>;
const CheckIcon    = ({ size=18 }) => <Svg size={size}><path d="M20 6L9 17l-5-5"/></Svg>;
const XIcon        = () => <Svg size={14}><path d="M18 6L6 18M6 6l12 12"/></Svg>;
const ArrowIcon    = () => <Svg size={13}><path d="M5 12h14M12 5l7 7-7 7"/></Svg>;
const PlusIcon     = ({ size=14 }) => <Svg size={size}><path d="M12 5v14M5 12h14"/></Svg>;
const StarIcon     = () => <Svg size={14}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const ClockIcon    = () => <Svg size={14}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
const TrashIcon    = () => <Svg size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></Svg>;

const SUGGESTION_ICONS = { plus:PlusIcon, cal:CalIcon, star:StarIcon, clock:ClockIcon, music:MusicIcon, stats:StatsIcon };
const SUGGESTIONS = [
  { icon:"plus",  label:"Add a new task",         hint:"task",    category:"Create" },
  { icon:"cal",   label:"Add a calendar event",   hint:"event",   category:"Create" },
  { icon:"star",  label:"Set today's focus",       hint:"focus",   category:"Quick"  },
  { icon:"clock", label:"Start Pomodoro session",  hint:"timer",   category:"Quick"  },
  { icon:"music", label:"Open Spotify controls",   hint:"spotify", category:"Go to"  },
  { icon:"stats", label:"View weekly stats",       hint:"stats",   category:"Go to"  },
];

// Dot colours for new events
const DOT_PALETTE = ["#dda0dd","#93c5fd","#86efac","#fca5a5","#fcd34d","#f9a8d4"];

// ─── Seed data ─────────────────────────────────────────────────────────────────
const SEED_TASKS = [
  { id:1, label:"Finish Sakura dark mode pivot",  done:false },
  { id:2, label:"Wire Spotify API token refresh", done:false },
  { id:3, label:"Ship Phase 1 to staging",        done:false },
];

const SEED_EVENTS = [
  { id:1, time:"09:00", label:"Design sync",          tag:"Team",     dot:"#dda0dd" },
  { id:2, time:"11:30", label:"Component review",     tag:"Dev",      dot:"#93c5fd" },
  { id:3, time:"14:00", label:"Phase 2 planning",     tag:"Planning", dot:"#86efac" },
  { id:4, time:"16:30", label:"Wrap-up & ship notes", tag:"Solo",     dot:"#fca5a5" },
];

// ─── Sakura Branch ────────────────────────────────────────────────────────────
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
      style={{ width:"100%", height:"100%", opacity:0.2 }}>
      <path d="M420 0 C400 80,360 160,320 220 C280 280,240 300,200 360 C160 420,140 490,130 560 C120 630,125 700,140 780" stroke="#7a4a5e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M370 100 C340 85,300 70,270 80 C240 90,210 110,190 130" stroke="#7a4a5e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M295 235 C265 245,230 260,205 280 C180 300,165 320,155 345" stroke="#7a4a5e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M220 370 C190 365,155 370,130 385 C105 400,90 425,85 455" stroke="#7a4a5e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M155 500 C125 510,95 525,75 550" stroke="#7a4a5e" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <g opacity="0.72">
        {clusters.map(([cx,cy,fills,rots],ci) => (
          <g key={ci}>
            {rots.map((r,i) => (
              <ellipse key={i} cx={cx} cy={cy-6.5} rx="4" ry="6"
                fill={fills[i%fills.length]} transform={`rotate(${r} ${cx} ${cy})`}/>
            ))}
            <circle cx={cx} cy={cy} r="2" fill="rgba(255,220,235,0.55)"/>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Shared Primitives ─────────────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span style={{
      ...T.label, color:C.accentDark,
      background:"rgba(221,160,221,0.12)", border:"0.5px solid rgba(221,160,221,0.2)",
      borderRadius:6, padding:"3px 8px", alignSelf:"flex-start",
    }}>{children}</span>
  );
}

function GlassTile({ style, children }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div variants={tileVariants}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{
        ...style,
        background: hov ? "rgba(255,255,255,0.075)" : C.glass,
        border:`0.5px solid ${hov ? "rgba(221,160,221,0.18)" : C.glassBorder}`,
        borderRadius:20,
        boxShadow: hov
          ? "0 20px 60px rgba(0,0,0,0.55), inset 0 0.5px 0 rgba(255,255,255,0.1)"
          : `${C.shadow}, inset 0 0.5px 0 rgba(255,255,255,0.06)`,
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        position:"relative", overflow:"hidden",
        display:"flex", flexDirection:"column",
        transition:"box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
      }}>
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:1, pointerEvents:"none",
        background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)",
      }}/>
      {children}
    </motion.div>
  );
}

const kbdStyle = {
  fontSize:10, color:C.textMuted,
  background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.1)",
  borderRadius:5, padding:"1px 6px", fontFamily:"inherit",
};

// ─── Hero Tile ─────────────────────────────────────────────────────────────────
function HeroTile({ tasks, onToggle }) {
  const doneCount = tasks.filter(t => t.done).length;
  const dateLabel = new Date().toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
  return (
    <GlassTile style={{ gridColumn:"1 / 5", gridRow:"1 / 3", padding:"26px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <Chip>Today's Tasks</Chip>
        <div style={{ textAlign:"right" }}>
          <span style={{ ...T.mono, color:C.textMuted }}>{dateLabel}</span>
          <p style={{ ...T.label, fontSize:9, color:C.textMuted, marginTop:2 }}>{doneCount}/{tasks.length} done</p>
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, overflowY:"auto", paddingRight:2 }}>
        <AnimatePresence initial={false}>
          {tasks.length === 0 && (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
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
              animate={{ opacity:1, x:0,   scale:1 }}
              exit={{    opacity:0, x:12,   scale:0.97 }}
              transition={{ duration:0.28, ease:[0.16,1,0.3,1] }}
              onClick={() => onToggle(task.id)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
                borderRadius:12, cursor:"pointer",
                background: task.done ? "rgba(221,160,221,0.06)" : "rgba(255,255,255,0.04)",
                border:`0.5px solid ${task.done ? "rgba(221,160,221,0.15)" : "rgba(255,255,255,0.06)"}`,
                transition:"background 0.2s, border-color 0.2s",
              }}>
              <motion.div
                animate={{ background:task.done ? C.accent : "transparent", borderColor:task.done ? C.accent : "rgba(148,163,184,0.35)" }}
                transition={{ duration:0.2 }}
                style={{ width:18, height:18, borderRadius:5, flexShrink:0,
                  border:"1.5px solid rgba(148,163,184,0.35)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
              </motion.div>
              <span style={{ ...T.body, flex:1, color:task.done ? C.textMuted : C.textPrimary,
                textDecoration:task.done ? "line-through" : "none", transition:"color 0.2s" }}>
                {task.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div style={{ paddingTop:12, marginTop:8, borderTop:`0.5px solid ${C.glassBorder}`,
        display:"flex", alignItems:"center", gap:8 }}>
        {["⌘","K"].map(k => <kbd key={k} style={kbdStyle}>{k}</kbd>)}
        <span style={{ ...T.bodySm, color:C.textMuted }}>to add a task</span>
      </div>
    </GlassTile>
  );
}

// ─── Horizon Tile ──────────────────────────────────────────────────────────────
function HorizonTile({ events, onAddEvent, onDeleteEvent }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState({ time:"09:00", label:"", tag:"", dot: DOT_PALETTE[0] });
  const labelRef = useRef(null);

  const nowMins = new Date().getHours()*60 + new Date().getMinutes();

  const sorted = useMemo(() =>
    [...events].sort((a,b) => a.time.localeCompare(b.time)), [events]);

  const openForm = () => {
    setDraft({ time:"09:00", label:"", tag:"", dot:DOT_PALETTE[Math.floor(Math.random()*DOT_PALETTE.length)] });
    setAdding(true);
    setTimeout(() => labelRef.current?.focus(), 80);
  };

  const submitEvent = () => {
    if (!draft.label.trim()) return;
    onAddEvent({ ...draft, label:draft.label.trim(), tag:draft.tag.trim()||"Event" });
    setAdding(false);
  };

  return (
    <GlassTile style={{ gridColumn:"5 / 9", gridRow:"1 / 2", padding:"18px 20px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <Chip>Horizon</Chip>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <motion.button whileTap={{ scale:0.9 }} onClick={openForm}
            style={{ width:26, height:26, borderRadius:7, border:"0.5px solid rgba(221,160,221,0.25)",
              background:"rgba(221,160,221,0.08)", display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer", color:C.accentDark }}>
            <PlusIcon size={12}/>
          </motion.button>
          <span style={{ color:C.accentDark, opacity:0.7 }}><CalIcon/></span>
        </div>
      </div>

      {/* Add-event form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity:0, height:0, marginBottom:0 }}
            animate={{ opacity:1, height:"auto", marginBottom:10 }}
            exit={{    opacity:0, height:0, marginBottom:0 }}
            transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
            style={{ overflow:"hidden" }}>
            <div style={{
              background:"rgba(221,160,221,0.07)", border:"0.5px solid rgba(221,160,221,0.18)",
              borderRadius:12, padding:"12px 12px 10px", display:"flex", flexDirection:"column", gap:8,
            }}>
              {/* Time + dot row */}
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="time" value={draft.time}
                  onChange={e => setDraft(d => ({...d, time:e.target.value}))}
                  style={{
                    background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.12)",
                    borderRadius:7, padding:"4px 8px", color:C.textPrimary, fontSize:12,
                    fontFamily:"inherit", outline:"none", cursor:"pointer",
                    colorScheme:"dark",
                  }}/>
                {/* Dot colour picker */}
                <div style={{ display:"flex", gap:4, marginLeft:"auto" }}>
                  {DOT_PALETTE.map(col => (
                    <div key={col} onClick={() => setDraft(d => ({...d, dot:col}))}
                      style={{ width:11, height:11, borderRadius:"50%", background:col, cursor:"pointer",
                        outline: draft.dot===col ? `2px solid ${col}` : "none",
                        outlineOffset: draft.dot===col ? 2 : 0,
                        transition:"outline 0.15s",
                      }}/>
                  ))}
                </div>
              </div>
              {/* Label */}
              <input ref={labelRef} value={draft.label} placeholder="Event name…"
                onChange={e => setDraft(d => ({...d, label:e.target.value}))}
                onKeyDown={e => { if(e.key==="Enter") submitEvent(); if(e.key==="Escape") setAdding(false); }}
                style={{
                  background:"transparent", border:"none", borderBottom:"0.5px solid rgba(255,255,255,0.12)",
                  color:C.textPrimary, fontSize:13, fontFamily:"inherit", outline:"none", padding:"2px 0 4px",
                  "::placeholder":{ color:C.textMuted },
                }}/>
              {/* Tag */}
              <input value={draft.tag} placeholder="Tag (e.g. Team, Solo…)"
                onChange={e => setDraft(d => ({...d, tag:e.target.value}))}
                onKeyDown={e => { if(e.key==="Enter") submitEvent(); if(e.key==="Escape") setAdding(false); }}
                style={{
                  background:"transparent", border:"none", borderBottom:"0.5px solid rgba(255,255,255,0.08)",
                  color:C.textSecondary, fontSize:11, fontFamily:"inherit", outline:"none", padding:"2px 0 4px",
                }}/>
              {/* Actions */}
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:2 }}>
                <button onClick={() => setAdding(false)}
                  style={{ background:"none", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:7,
                    padding:"4px 12px", color:C.textMuted, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                  Cancel
                </button>
                <button onClick={submitEvent}
                  style={{ background:"rgba(221,160,221,0.18)", border:"0.5px solid rgba(221,160,221,0.28)",
                    borderRadius:7, padding:"4px 12px", color:C.accentDark, fontSize:11,
                    cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}>
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event list */}
      <div style={{ display:"flex", flexDirection:"column", flex:1, overflowY:"auto", gap:0 }}>
        <AnimatePresence initial={false}>
          {sorted.length === 0 && !adding && (
            <motion.p key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ ...T.bodySm, color:C.textMuted, textAlign:"center", paddingTop:16 }}>
              No events — press + to add one.
            </motion.p>
          )}
          {sorted.map((ev, i) => {
            const [h,m] = ev.time.split(":").map(Number);
            const evMins    = h*60 + m;
            const isPast    = evMins < nowMins;
            const isCurrent = !isPast && evMins - nowMins < 90;
            return (
              <motion.div key={ev.id} layout
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }}
                transition={{ duration:0.22 }}
                style={{ display:"flex", alignItems:"stretch", gap:10, padding:"8px 0",
                  borderBottom: i < sorted.length-1 ? "0.5px solid rgba(255,255,255,0.07)" : "none",
                  opacity:isPast ? 0.32 : 1, transition:"opacity 0.3s", position:"relative" }}
                className="horizon-row">
                {/* Time */}
                <span style={{
                  ...T.mono, fontSize:11,
                  color: isPast ? C.textMuted : C.textSecondary,
                  minWidth:36, paddingTop:2, flexShrink:0,
                  fontWeight:500,
                }}>
                  {ev.time}
                </span>
                {/* Dot + line */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                  <div style={{
                    width:8, height:8, borderRadius:"50%", marginTop:3,
                    background: isPast ? "rgba(148,163,184,0.2)" : ev.dot,
                    boxShadow: isCurrent ? `0 0 0 3px ${ev.dot}44, 0 0 8px ${ev.dot}55` : "none",
                    transition:"box-shadow 0.4s", flexShrink:0,
                  }}/>
                  {i < sorted.length-1 && <div style={{ width:1, flex:1, background:"rgba(255,255,255,0.08)", marginTop:4 }}/>}
                </div>
                {/* Label + tag */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{
                    ...T.body, fontSize:12.5,
                    color: isPast ? C.textMuted : C.textPrimary,
                    fontWeight: isCurrent ? 500 : 400,
                    lineHeight:1.35, whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {ev.label}
                  </p>
                  <span style={{
                    ...T.label, fontSize:9,
                    color: isPast ? C.textMuted : C.textSecondary,
                    letterSpacing:"0.1em",
                  }}>
                    {ev.tag}
                  </span>
                </div>
                {/* Now badge */}
                {isCurrent && (
                  <span style={{
                    fontSize:8.5, color:"#fff", background:C.accent,
                    borderRadius:5, padding:"2px 7px", alignSelf:"flex-start",
                    letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0,
                  }}>Now</span>
                )}
                {/* Delete btn — appears on row hover via CSS class */}
                <button onClick={() => onDeleteEvent(ev.id)}
                  className="horizon-delete"
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    color:C.textMuted, opacity:0, padding:"0 2px",
                    display:"flex", alignItems:"center", flexShrink:0,
                    transition:"opacity 0.15s",
                  }}>
                  <TrashIcon/>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassTile>
  );
}

// ─── Spotify Tile — live /api/spotify polling ─────────────────────────────────
//
// Expects your route.js to return either:
//   { isPlaying: false }                          ← nothing playing
//   { is_playing, item: { name, artists, album, duration_ms }, progress_ms }
//
// Rename your env vars to remove NEXT_PUBLIC_ prefix so secrets stay server-side:
//   SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN

const IDLE_STATE = {
  isPlaying:   false,
  songTitle:   "Nothing playing",
  artist:      "Open Spotify to start",
  album:       "",
  albumArtUrl: null,
  progressMs:  0,
  durationMs:  0,
};

function SpotifyTile() {
  const [track,       setTrack]       = useState(IDLE_STATE);
  const [localProgress, setLocalProgress] = useState(0); // 0–100
  const [apiStatus,   setApiStatus]   = useState("connecting"); // connecting | live | idle | error
  const pollRef = useRef(null);

  // ── Derive display values from track ──────────────────────────────────────
  const duration = track.durationMs / 1000;  // seconds

  const fmt = useCallback((pct) => {
    if (!track.durationMs) return "0:00";
    const s = Math.round(track.durationMs / 1000 * pct / 100);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, [track.durationMs]);

  const totalFmt = useMemo(() => {
    if (!track.durationMs) return "0:00";
    const s = Math.floor(track.durationMs / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, [track.durationMs]);

  // ── Fetch from /api/spotify ───────────────────────────────────────────────
  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify");

      // 204 = nothing playing, treat as idle
      if (res.status === 204) {
        setTrack(IDLE_STATE);
        setLocalProgress(0);
        setApiStatus("idle");
        return;
      }

      if (!res.ok) {
        setApiStatus("error");
        return;
      }

      const data = await res.json();

      // Route returned { isPlaying: false } sentinel
      if (!data.item) {
        setTrack(IDLE_STATE);
        setLocalProgress(0);
        setApiStatus("idle");
        return;
      }

      const next = {
        isPlaying:   data.is_playing,
        songTitle:   data.item.name,
        artist:      data.item.artists.map(a => a.name).join(", "),
        album:       data.item.album.name,
        albumArtUrl: data.item.album.images?.[0]?.url ?? null,
        progressMs:  data.progress_ms,
        durationMs:  data.item.duration_ms,
      };

      setTrack(next);
      setLocalProgress(next.durationMs > 0
        ? parseFloat(((next.progressMs / next.durationMs) * 100).toFixed(2))
        : 0
      );
      setApiStatus(next.isPlaying ? "live" : "idle");

    } catch {
      setApiStatus("error");
    }
  }, []);

  // ── Poll every 3 s ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNowPlaying(); // immediate first fetch
    pollRef.current = setInterval(fetchNowPlaying, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchNowPlaying]);

  // ── Optimistic progress tick between polls (200 ms) ───────────────────────
  useEffect(() => {
    if (!track.isPlaying || !track.durationMs) return;
    const tickMs  = 200;
    const tickPct = (tickMs / track.durationMs) * 100;
    const id = setInterval(() =>
      setLocalProgress(p => p >= 100 ? 0 : parseFloat((p + tickPct).toFixed(3))), tickMs);
    return () => clearInterval(id);
  }, [track.isPlaying, track.durationMs]);

  // ── Scrub handler (UI only — no Spotify seek endpoint needed) ────────────
  const handleScrub = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(100,
      parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))
    ));
    setLocalProgress(pct);
  }, []);

  // ── Status badge ──────────────────────────────────────────────────────────
  const badge = {
    connecting: { label: "Connecting…", color: "rgba(148,163,184,0.55)" },
    live:       { label: "Live",        color: "#1DB954"                },
    idle:       { label: "Idle",        color: "rgba(148,163,184,0.45)" },
    error:      { label: "API error",   color: "#fca5a5"                },
  }[apiStatus];

  return (
    <GlassTile style={{ gridColumn:"9 / 13", gridRow:"1 / 2", padding:"20px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Chip>Now Playing</Chip>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Live status dot + label */}
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{
              width:6, height:6, borderRadius:"50%",
              background: badge.color,
              boxShadow: apiStatus === "live" ? "0 0 7px #1DB95488" : "none",
              transition:"background 0.4s, box-shadow 0.4s",
            }}/>
            <span style={{ ...T.mono, fontSize:9.5, color:"rgba(148,163,184,0.6)" }}>
              {badge.label}
            </span>
          </div>
          <span style={{ color:"#1DB954", opacity:0.85 }}><MusicIcon/></span>
        </div>
      </div>

      {/* Track info */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>

        {/* Album art */}
        <div style={{
          width:58, height:58, borderRadius:12, flexShrink:0, overflow:"hidden",
          background:"linear-gradient(135deg, rgba(221,160,221,0.15) 0%, rgba(147,197,253,0.10) 100%)",
          border:"0.5px solid rgba(221,160,221,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"opacity 0.4s",
        }}>
          {track.albumArtUrl
            ? <img
                key={track.albumArtUrl}   // re-mount on track change for fade
                src={track.albumArtUrl}
                alt={`${track.album} artwork`}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            : <span style={{ color:"rgba(221,160,221,0.35)" }}><MusicIcon size={22}/></span>
          }
        </div>

        {/* Text block */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", gap:3 }}>

          {/* Scrolling title */}
          <div style={{ overflow:"hidden" }}>
            <motion.p
              key={track.songTitle}
              animate={ track.isPlaying ? { x:[0, -80, 0] } : { x:0 }}
              transition={ track.isPlaying ? { duration:9, repeat:Infinity, ease:"linear" } : {}}
              style={{ ...T.body, fontWeight:500, color:C.textPrimary, whiteSpace:"nowrap", letterSpacing:"-0.01em" }}>
              {track.songTitle}
            </motion.p>
          </div>

          <p style={{ ...T.bodySm, color:C.textSecondary,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {track.artist}
          </p>

          {track.album && (
            <p style={{ ...T.bodySm, fontSize:10.5, color:C.textMuted,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {track.album}
            </p>
          )}
        </div>
      </div>

      {/* Progress + play indicator */}
      <div style={{ marginTop:"auto", paddingTop:12 }}>
        <div onClick={handleScrub} style={{
          position:"relative", height:3,
          background:"rgba(255,255,255,0.09)",
          borderRadius:99, marginBottom:8, cursor: track.durationMs ? "pointer" : "default",
        }}>
          <motion.div
            style={{ height:"100%", borderRadius:99, background:C.accent, originX:0 }}
            animate={{ scaleX: localProgress / 100 }}
            transition={{ duration:0.18, ease:"linear" }}
          />
          {track.durationMs > 0 && (
            <div style={{
              position:"absolute", top:"50%", left:`${localProgress}%`,
              transform:"translate(-50%,-50%)",
              width:9, height:9, borderRadius:"50%",
              background:C.accent, border:"1.5px solid rgba(2,6,23,0.8)",
              boxShadow:`0 0 6px ${C.accentGlow}`,
            }}/>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ ...T.mono, color:C.textMuted }}>{fmt(localProgress)}</span>

          {/* Play state indicator — read-only, reflects Spotify's actual state */}
          <div style={{
            width:32, height:32, borderRadius:"50%",
            background: track.isPlaying ? C.accent : "rgba(221,160,221,0.10)",
            border:`0.5px solid ${track.isPlaying ? C.accent : "rgba(221,160,221,0.22)"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color: track.isPlaying ? "#fff" : C.accentDark,
            boxShadow: track.isPlaying ? `0 0 16px ${C.accentGlow}` : "none",
            transition:"all 0.3s ease",
            // Not a button — Spotify play/pause requires a premium scope (user-modify-playback-state)
            // and a PUT /me/player/play request. Wire it here when you add that scope.
            opacity: apiStatus === "error" ? 0.35 : 1,
          }}>
            {track.isPlaying ? <PauseIcon/> : <PlayIcon/>}
          </div>

          <span style={{ ...T.mono, color:C.textMuted }}>{totalFmt}</span>
        </div>
      </div>

    </GlassTile>
  );
}

// ─── Overview Tile ─────────────────────────────────────────────────────────────
function OverviewTile({ tasks }) {
  const doneCount = tasks.filter(t => t.done).length;
  const pct       = tasks.length > 0 ? Math.round((doneCount/tasks.length)*100) : 0;
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
          <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            style={{ height:"100%", borderRadius:99, background:C.accent, boxShadow:`0 0 8px ${C.accentGlow}` }}/>
        </div>
      </div>
      <div style={{ width:"0.5px", background:C.glassBorder, alignSelf:"stretch" }}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:9, overflowY:"auto" }}>
        <AnimatePresence initial={false}>
          {tasks.length === 0 && (
            <p style={{ ...T.bodySm, color:C.textMuted }}>Add tasks via ⌘K to track progress.</p>
          )}
          {tasks.map(t => (
            <motion.div key={t.id} layout initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:14, height:14, borderRadius:4, flexShrink:0,
                background:t.done ? C.accent : "transparent",
                border:`1.5px solid ${t.done ? C.accent : "rgba(148,163,184,0.25)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background 0.2s, border-color 0.2s",
              }}>
                {t.done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ ...T.body, fontSize:12, color:t.done ? C.textMuted : C.textPrimary, textDecoration:t.done ? "line-through" : "none" }}>
                {t.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassTile>
  );
}

// ─── Phase 2 ───────────────────────────────────────────────────────────────────
function Phase2Tile({ label, col, row }) {
  return (
    <motion.div variants={tileVariants} style={{
      gridColumn:col, gridRow:row,
      background:"rgba(255,255,255,0.02)", border:"0.5px dashed rgba(255,255,255,0.07)",
      borderRadius:20, opacity:0.5, display:"flex", flexDirection:"column",
      alignItems:"flex-start", justifyContent:"flex-end", padding:"14px 16px",
    }}>
      <span style={{ ...T.label, color:"rgba(192,132,192,0.45)" }}>{label}</span>
      <span style={{ ...T.label, fontSize:9, color:"rgba(71,85,105,0.6)", marginTop:2 }}>Phase 2</span>
    </motion.div>
  );
}

// ─── Ghost Command Bar ─────────────────────────────────────────────────────────
function GhostCommandBar({ onClose, onAddTask, onAddEvent }) {
  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTIONS;
    return SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q) || s.hint.includes(q));
  }, [query]);

  const categories = useMemo(() => [...new Set(filtered.map(s => s.category))], [filtered]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);
  useEffect(() => { setActiveIdx(0); }, [query]);

  const commitTask = useCallback((label) => {
    setSubmitted(label);
    onAddTask(label);
    setTimeout(onClose, 750);
  }, [onAddTask, onClose]);

  const selectSuggestion = useCallback((s) => {
    if (s.hint === "event") {
      onAddEvent();
      onClose();
    } else {
      setSubmitted(s.label);
      setTimeout(onClose, 750);
    }
  }, [onAddEvent, onClose]);

  const handleKey = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
    if (e.key === "Enter") {
      if (query.trim()) commitTask(query.trim());
      else if (filtered[activeIdx]) selectSuggestion(filtered[activeIdx]);
    }
  }, [filtered, activeIdx, query, commitTask, selectSuggestion]);

  return (
    <>
      <motion.div variants={overlayVariants} initial="hidden" animate="show" exit="exit"
        onClick={onClose}
        style={{ position:"fixed", inset:0, zIndex:50,
          background:"rgba(2,6,23,0.75)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}/>
      <motion.div variants={cmdBarVariants} initial="hidden" animate="show" exit="exit"
        style={{ position:"fixed", top:"22%", left:"50%", transform:"translateX(-50%)", zIndex:60, width:"min(560px,88vw)" }}>
        <div style={{
          background:"rgba(15,23,42,0.94)", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:20,
          boxShadow:"0 40px 100px rgba(0,0,0,0.75), inset 0 0.5px 0 rgba(255,255,255,0.08)",
          overflow:"hidden",
        }}>
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(221,160,221,0.3),transparent)" }}/>
          {/* Input */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 18px",
            borderBottom: filtered.length>0||query ? "0.5px solid rgba(255,255,255,0.07)" : "none" }}>
            <span style={{ color:C.textMuted, flexShrink:0, display:"flex" }}><SearchIcon/></span>
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
              placeholder="Type a task, or search actions…" aria-label="Command bar"
              style={{ flex:1, border:"none", outline:"none", background:"transparent",
                ...T.body, fontSize:15, color:C.textPrimary, fontFamily:"inherit", caretColor:C.accent }}/>
            <kbd style={kbdStyle}>esc</kbd>
            {query && (
              <button onClick={() => setQuery("")}
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
                  {filtered.filter(s => s.category===cat).map(s => {
                    const gi = filtered.indexOf(s);
                    const isActive = gi===activeIdx;
                    const Ico = SUGGESTION_ICONS[s.icon]??PlusIcon;
                    return (
                      <motion.div key={s.label} onClick={() => selectSuggestion(s)}
                        onHoverStart={() => setActiveIdx(gi)}
                        animate={{ background:isActive ? "rgba(221,160,221,0.08)" : "transparent" }}
                        transition={{ duration:0.12 }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 18px", cursor:"pointer" }}>
                        <span style={{ color:isActive ? C.accentDark : C.textMuted, display:"flex", flexShrink:0 }}><Ico/></span>
                        <span style={{ flex:1, ...T.body, color:isActive ? C.textPrimary : C.textSecondary, fontWeight:isActive?500:400 }}>
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
          {/* Free-text hint */}
          {!submitted && query.trim() && (
            <div style={{ padding:"10px 18px 12px",
              borderTop: filtered.length>0 ? "0.5px solid rgba(255,255,255,0.06)" : "none",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:C.accentDark, display:"flex" }}><PlusIcon size={12}/></span>
              <span style={{ ...T.bodySm, color:C.textSecondary }}>
                Press <kbd style={kbdStyle}>↵</kbd> to add task: <span style={{ color:C.textPrimary, fontWeight:500 }}>"{query}"</span>
              </span>
            </div>
          )}
          {/* Confirmation */}
          {submitted && (
            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.accent,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                boxShadow:`0 0 12px ${C.accentGlow}` }}>
                <CheckIcon size={12}/>
              </div>
              <span style={{ ...T.body, color:C.textSecondary }}>
                Added — <span style={{ color:C.textPrimary, fontWeight:500 }}>"{submitted}"</span>
              </span>
            </motion.div>
          )}
          {/* Footer */}
          {!submitted && (
            <div style={{ display:"flex", gap:16, padding:"8px 18px 12px", borderTop:"0.5px solid rgba(255,255,255,0.06)" }}>
              {[["↑↓","Navigate"],["↵","Add / Select"],["esc","Close"]].map(([k,h]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <kbd style={kbdStyle}>{k}</kbd>
                  <span style={{ ...T.mono, color:C.textMuted }}>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
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
      style={{
        position:"relative", zIndex:20, width:64, flexShrink:0, height:"100vh",
        background:"rgba(255,255,255,0.03)", borderRight:"0.5px solid rgba(255,255,255,0.07)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        display:"flex", flexDirection:"column", alignItems:"center", padding:"26px 0", gap:6,
      }}>
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ opacity:0.35, marginBottom:18 }}>
        <circle cx="14" cy="14" r="13" stroke={C.textSecondary} strokeWidth="1.2"/>
        <path d="M14 6 C14 6,10 10,10 14 C10 18,14 22,14 22 C14 22,18 18,18 14 C18 10,14 6,14 6Z"
          stroke={C.accent} strokeWidth="1.2" fill="none"/>
        <circle cx="14" cy="14" r="2" fill={C.accent} opacity="0.8"/>
      </svg>
      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const isActive = active===id; const isHov = hov===id;
        return (
          <div key={id} title={label} onClick={() => setActive(id)}
            onMouseEnter={() => setHov(id)} onMouseLeave={() => setHov(null)}
            style={{
              width:40, height:40, borderRadius:10, position:"relative",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
              background: isActive ? "rgba(221,160,221,0.15)" : isHov ? "rgba(255,255,255,0.05)" : "transparent",
              color: isActive ? C.accent : C.textMuted,
              opacity: isActive ? 1 : isHov ? 0.8 : 0.4, transition:"all 0.2s ease",
            }}>
            {isActive && <span style={{ position:"absolute", left:-1, width:3, height:18,
              borderRadius:"0 3px 3px 0", background:C.accent, boxShadow:`0 0 8px ${C.accentGlow}` }}/>}
            <Icon/>
          </div>
        );
      })}
      <div style={{ flex:1 }}/>
      <motion.div whileTap={{ scale:0.92 }} onClick={onCmdK} title="⌘K"
        style={{ width:40, height:40, borderRadius:10, display:"flex",
          alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <div style={{ display:"flex", gap:3 }}>
          {[0,1,2].map(i => <div key={i} style={{ width:3, height:3, borderRadius:"50%", background:C.textMuted, opacity:0.4 }}/>)}
        </div>
      </motion.div>
      <div title="Settings"
        style={{ width:40, height:40, borderRadius:10, display:"flex", alignItems:"center",
          justifyContent:"center", cursor:"pointer", color:C.textMuted, opacity:0.35 }}>
        <SettingsIcon/>
      </div>
    </motion.nav>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function SakuraShell() {
  const [tasks,   setTasks]   = useState(SEED_TASKS);
  const [events,  setEvents]  = useState(SEED_EVENTS);
  const [cmdOpen, setCmdOpen] = useState(false);
  // When Add Calendar Event is triggered from ⌘K, open the Horizon form
  const [openHorizonForm, setOpenHorizonForm] = useState(false);

  const addTask = useCallback((label) => {
    setTasks(prev => [...prev, { id:Date.now(), label, done:false }]);
  }, []);
  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id===id ? {...t, done:!t.done} : t));
  }, []);
  const addEvent = useCallback((ev) => {
    setEvents(prev => [...prev, { ...ev, id:Date.now() }]);
  }, []);
  const deleteEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id!==id));
  }, []);

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = now.toLocaleDateString("en-CA",{ weekday:"long", month:"long", day:"numeric" }).toUpperCase();

  const handleGlobalKey = useCallback((e) => {
    if ((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); setCmdOpen(o=>!o); }
    if (e.key==="Escape") setCmdOpen(false);
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
        input::placeholder { color:#64748b; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:99px; }
        .horizon-row:hover .horizon-delete { opacity: 0.55 !important; }
        .horizon-row:hover .horizon-delete:hover { opacity: 1 !important; color: #fca5a5 !important; }
      `}</style>

      <Sidebar onCmdK={() => setCmdOpen(o=>!o)}/>

      <main style={{ flex:1, position:"relative", height:"100vh", overflow:"hidden" }}>
        {/* Sakura */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ duration:1.4, delay:0.2 }} aria-hidden="true"
          style={{ position:"absolute", right:0, top:0, height:"100%", width:"42%", pointerEvents:"none", zIndex:0 }}>
          <SakuraBranch/>
        </motion.div>

        {/* Content */}
        <div style={{ position:"relative", zIndex:10, height:"100vh", padding:"28px 32px 28px 28px", display:"flex", flexDirection:"column" }}>
          {/* Header */}
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.38, ease:[0.16,1,0.3,1] }}
            style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:20 }}>
            <span style={{ ...T.label, color:C.textMuted, fontWeight:400 }}>{dateStr}</span>
            <span style={{ width:3, height:3, borderRadius:"50%", background:C.accent, opacity:0.6, alignSelf:"center", display:"inline-block" }}/>
            <span style={{ ...T.bodySm, color:C.textMuted }}>{greeting}</span>
            <div style={{ marginLeft:"auto" }}>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
                onClick={() => setCmdOpen(o=>!o)}
                style={{ display:"flex", alignItems:"center", gap:7,
                  background:"rgba(255,255,255,0.05)", border:"0.5px solid rgba(255,255,255,0.1)",
                  borderRadius:10, padding:"5px 12px", cursor:"pointer",
                  backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}>
                <SearchIcon/>
                <span style={{ ...T.mono, color:C.textMuted }}>Search or create</span>
                {["⌘","K"].map(k => <kbd key={k} style={kbdStyle}>{k}</kbd>)}
              </motion.button>
            </div>
          </motion.div>

          {/* Bento */}
          <motion.div variants={containerVariants} initial="hidden" animate="show"
            style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gridTemplateRows:"repeat(3,1fr)", gap:14, flex:1, minHeight:0 }}>
            <HeroTile   tasks={tasks}   onToggle={toggleTask}/>
            <HorizonTile
              events={events}
              onAddEvent={addEvent}
              onDeleteEvent={deleteEvent}
              triggerOpen={openHorizonForm}
              onTriggered={() => setOpenHorizonForm(false)}
            />
            <SpotifyTile/>
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
            onAddEvent={() => { setOpenHorizonForm(true); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
