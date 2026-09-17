import React, { useState, useRef, useEffect } from "react";
import {
  Zap, Camera, X, Wrench, Radio, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Plus, Info, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import MapView from "./MapView.jsx";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ---------- palette ----------
const COLORS = {
  bg: "#0E1620",
  panel: "#16212Cf2",
  panelSolid: "#16212C",
  panelAlt: "#1C2A37",
  line: "#2A3A48",
  text: "#E7EDF3",
  textDim: "#8FA1B0",
  normalFill: "#E7EDF3",
  red: "#E4572E",
  redDim: "#5A2F22",
  yellow: "#F2B134",
  yellowDim: "#4F3F1C",
  accent: "#4A90D9",
};

const LINES = [
  { id: "L1", name: "Feeder A · Panampilly", color: "#4A6FA5" },
  { id: "L2", name: "Feeder B · Kadavanthra", color: "#9B6BB0" },
  { id: "L3", name: "Feeder C · Elamkulam", color: "#2E9188" },
];

// Default demo location — drag pins onto your own street once the map loads,
// or use "Add / move houses" to drop new ones exactly where you need them.
const SUBSTATION = { lat: 9.9693, lng: 76.2942 };

const INITIAL_HOUSES = [
  { id: "h1", name: "Anand Bhavan", lineId: "L1", lat: 9.9684, lng: 76.2925, status: "normal" },
  { id: "h2", name: "Green Villa", lineId: "L1", lat: 9.9677, lng: 76.2934, status: "normal" },
  { id: "h3", name: "Lakeview House", lineId: "L1", lat: 9.9665, lng: 76.2922, status: "normal" },
  { id: "h4", name: "Sunrise Cottage", lineId: "L2", lat: 9.9679, lng: 76.2952, status: "normal" },
  { id: "h5", name: "Palm Residency", lineId: "L2", lat: 9.967, lng: 76.2962, status: "yellow", maintenanceTime: "2:00 PM – 4:00 PM, Today" },
  { id: "h6", name: "Riverside House", lineId: "L2", lat: 9.9661, lng: 76.295, status: "normal" },
  { id: "h7", name: "Hilltop Manor", lineId: "L3", lat: 9.9681, lng: 76.2974, status: "normal" },
  { id: "h8", name: "Blue Nest", lineId: "L3", lat: 9.9664, lng: 76.2972, status: "normal" },
];

function lineColor(id) { return LINES.find((l) => l.id === id)?.color || COLORS.line; }
function lineName(id) { return LINES.find((l) => l.id === id)?.name || "Unassigned"; }
function statusFill(status) {
  if (status === "red") return COLORS.red;
  if (status === "yellow") return COLORS.yellow;
  return COLORS.normalFill;
}

// ---------- small building blocks ----------
function Toggle({ checked, onChange, label, color }) {
  return (
    <div className="flex items-center justify-between py-1.5 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <span className="flex items-center gap-2 text-sm" style={{ color: COLORS.text }}>
        {color && <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: color }} />}
        {label}
      </span>
      <span
        className="relative inline-flex items-center rounded-full shrink-0"
        style={{ width: 34, height: 19, background: checked ? COLORS.accent : COLORS.line, transition: "background 0.15s" }}
      >
        <span
          className="absolute rounded-full bg-white"
          style={{ width: 15, height: 15, top: 2, left: checked ? 17 : 2, transition: "left 0.15s" }}
        />
      </span>
    </div>
  );
}

function Pill({ children, onClick, active, style }) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-xs shadow-lg"
      style={{ background: active ? COLORS.accent : COLORS.panel, color: active ? "#fff" : COLORS.text, backdropFilter: "blur(6px)", ...style }}
    >
      {children}
    </button>
  );
}

function InfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "#000000b0" }} onClick={onClose}>
      <div className="rounded-xl p-5 max-w-sm w-full" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.text }}>
            <Zap size={16} color={COLORS.accent} /> About LineCut
          </span>
          <button onClick={onClose}><X size={18} color={COLORS.textDim} /></button>
        </div>
        <p className="text-sm mb-3" style={{ color: COLORS.textDim }}>
          A live map of who's on which line, and who's without power right now.
        </p>
        <div className="space-y-1.5 text-sm mb-3" style={{ color: COLORS.text }}>
          <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.normalFill }} /> Power on</p>
          <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.red }} /> Outage reported by a resident</p>
          <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.yellow }} /> Planned maintenance, scheduled by KSEB</p>
          <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.accent }} /> Feeder line, colored coded per line</p>
        </div>
        <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textDim }}>
          <Radio size={12} /> A future monitoring device will report outages here automatically, no swipe needed.
        </p>
      </div>
    </div>
  );
}

// ---------- Swipe-to-report bar ----------
function SwipeBar({ reported, onReport, onRestore, disabled }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handleMove = (clientX) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    setDrag(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };

  const commit = () => {
    setDragging(false);
    setDrag((d) => {
      if (d > 0.82) { onReport(); return 1; }
      return 0;
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => handleMove(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => commit();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  if (reported) {
    return (
      <button onClick={onRestore} className="w-full rounded-full flex items-center justify-between px-1.5 py-1.5" style={{ background: COLORS.redDim, border: `1px solid ${COLORS.red}` }}>
        <span className="flex items-center gap-2 pl-2" style={{ color: COLORS.text }}>
          <CheckCircle2 size={16} color={COLORS.red} />
          <span className="text-sm">Power cut reported</span>
        </span>
        <span className="rounded-full flex items-center justify-center" style={{ background: COLORS.red, width: 34, height: 34, flexShrink: 0 }}>
          <X size={16} color="#fff" />
        </span>
      </button>
    );
  }

  const pct = Math.round(drag * 100);
  return (
    <div
      ref={trackRef}
      onMouseDown={(e) => { if (!disabled) { setDragging(true); handleMove(e.clientX); } }}
      onTouchStart={(e) => { if (!disabled) { setDragging(true); handleMove(e.touches[0].clientX); } }}
      className="relative w-full rounded-full select-none"
      style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.line}`, height: 46, opacity: disabled ? 0.5 : 1, touchAction: "none" }}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.redDim}, ${COLORS.red})`, transition: dragging ? "none" : "width 0.2s ease" }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm" style={{ color: pct > 40 ? "#fff" : COLORS.textDim }}>{disabled ? "Maintenance scheduled" : "Slide to report a power cut →"}</span>
      </div>
      <div className="absolute top-0.5 rounded-full flex items-center justify-center" style={{ left: `calc(${pct}% - ${pct > 2 ? 17 : 1}px)`, width: 38, height: 38, background: COLORS.red, transition: dragging ? "none" : "left 0.2s ease" }}>
        <ChevronRight size={18} color="#fff" />
      </div>
    </div>
  );
}

// ---------- Camera capture ----------
function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let localStream = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => { if (!active) return; localStream = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError("Camera unavailable — upload a photo instead."));
    return () => { active = false; localStream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "#000000b0" }}>
      <div className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-4" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.text }}><Camera size={16} /> Capture incident</span>
          <button onClick={onClose}><X size={18} color={COLORS.textDim} /></button>
        </div>
        {!error ? (
          <div className="rounded-lg overflow-hidden mb-3" style={{ background: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: 260 }} />
          </div>
        ) : <p className="text-sm mb-3" style={{ color: COLORS.textDim }}>{error}</p>}
        <div className="flex gap-2">
          {!error && (
            <button onClick={snap} className="flex-1 rounded-lg py-2.5 text-sm font-medium" style={{ background: COLORS.accent, color: "#fff" }}>Take photo</button>
          )}
          <label className="flex-1 rounded-lg py-2.5 text-sm font-medium text-center cursor-pointer" style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}>
            Upload instead
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------- Top bar (shared) ----------
function TopBar({ view, setView, onInfo }) {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between pointer-events-none">
      <div className="flex items-center gap-2">
        <Pill style={{ paddingLeft: 12, paddingRight: 12 }}>
          <Zap size={16} color={COLORS.accent} />
          <span className="text-sm" style={{ color: COLORS.text }}>LineCut</span>
        </Pill>
        <Pill onClick={onInfo}><Info size={14} /></Pill>
      </div>
      <div className="pointer-events-auto flex rounded-full p-0.5 shadow-lg" style={{ background: COLORS.panel, backdropFilter: "blur(6px)" }}>
        {[{ id: "resident", label: "Resident" }, { id: "kseb", label: "KSEB" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: view === t.id ? COLORS.accent : "transparent", color: view === t.id ? "#fff" : COLORS.textDim }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Resident bottom sheet ----------
function ResidentSheet({ houses, residentId, setResidentId, onReport, onRestore, onAddIncident }) {
  const house = houses.find((h) => h.id === residentId);
  const [showCamera, setShowCamera] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center px-3 pb-3">
      <div className="w-full max-w-md rounded-2xl p-4 shadow-2xl" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }}>
        <div className="relative mb-2">
          <button onClick={() => setPickerOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
            <span className="flex items-center gap-2">
              <span className="text-base font-medium" style={{ color: COLORS.text }}>{house.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.panelAlt, color: lineColor(house.lineId), border: `1px solid ${lineColor(house.lineId)}` }}>
                {lineName(house.lineId)}
              </span>
            </span>
            <ChevronDown size={16} color={COLORS.textDim} style={{ transform: pickerOpen ? "rotate(180deg)" : "none" }} />
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 rounded-lg overflow-hidden shadow-xl" style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.line}` }}>
              {houses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setResidentId(h.id); setPickerOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm"
                  style={{ color: COLORS.text, background: h.id === residentId ? COLORS.line : "transparent" }}
                >
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {house.status === "yellow" ? (
          <div className="flex items-start gap-2 mb-3 rounded-lg p-3" style={{ background: COLORS.yellowDim }}>
            <Clock size={16} color={COLORS.yellow} className="mt-0.5 shrink-0" />
            <p className="text-sm" style={{ color: COLORS.text }}>
              KSEB has scheduled maintenance on this line: <span style={{ color: COLORS.yellow }}>{house.maintenanceTime}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: COLORS.textDim }}>
            {house.status === "red" ? "Your report is visible to KSEB." : "If your power is out right now, report it below."}
          </p>
        )}

        <SwipeBar reported={house.status === "red"} disabled={house.status === "yellow"} onReport={() => onReport(house.id)} onRestore={() => onRestore(house.id)} />

        {house.status === "red" && (
          <button onClick={() => setShowCamera(true)} className="w-full mt-3 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2" style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}>
            <Camera size={16} /> Add a photo of the cause
          </button>
        )}

        {house.incidents?.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {house.incidents.map((src, i) => (
              <img key={i} src={src} alt="incident" className="w-16 h-16 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.line}` }} />
            ))}
          </div>
        )}
      </div>
      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={(dataUrl) => { onAddIncident(house.id, dataUrl); setShowCamera(false); }} />}
    </div>
  );
}

// ---------- KSEB layer/manage panel ----------
function KsebPanel({
  houses, visibleLines, setVisibleLines, showOutages, setShowOutages, showMaintenance, setShowMaintenance,
  showFeederLines, setShowFeederLines, selected, setSelected, editMode, setEditMode,
  onSchedule, onClear, onSimulateDevice, onViewIncidents,
}) {
  const [tab, setTab] = useState("layers");
  const [scheduling, setScheduling] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  const toggleLine = (id) => setVisibleLines((vs) => (vs.includes(id) ? vs.filter((x) => x !== id) : [...vs, id]));
  const toggleSelect = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const redCount = houses.filter((h) => h.status === "red").length;
  const yellowCount = houses.filter((h) => h.status === "yellow").length;

  return (
    <div className="absolute top-16 bottom-3 right-3 z-20 w-[19rem] max-w-[90vw] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }}>
      <div className="flex gap-1 p-1.5" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
        {[{ id: "layers", label: "Layers" }, { id: "manage", label: "Manage" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 text-xs py-1.5 rounded-lg"
            style={{ background: tab === t.id ? COLORS.panelAlt : "transparent", color: tab === t.id ? COLORS.text : COLORS.textDim }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "layers" ? (
          <>
            <div className="flex gap-2 mb-3">
              <span className="flex-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]" style={{ background: COLORS.redDim, color: COLORS.text }}>
                <AlertTriangle size={11} color={COLORS.red} /> {redCount} active
              </span>
              <span className="flex-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]" style={{ background: COLORS.yellowDim, color: COLORS.text }}>
                <Wrench size={11} color={COLORS.yellow} /> {yellowCount} planned
              </span>
            </div>

            <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: COLORS.textDim }}>Status</p>
            <Toggle checked={showOutages} onChange={setShowOutages} label="Reported outages" color={COLORS.red} />
            <Toggle checked={showMaintenance} onChange={setShowMaintenance} label="Planned maintenance" color={COLORS.yellow} />

            <p className="text-[11px] uppercase tracking-wide mt-3 mb-1" style={{ color: COLORS.textDim }}>Feeder lines</p>
            <Toggle checked={showFeederLines} onChange={setShowFeederLines} label="Show feeder lines" />
            {LINES.map((l) => (
              <Toggle key={l.id} checked={visibleLines.includes(l.id)} onChange={() => toggleLine(l.id)} label={l.name} color={l.color} />
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => setEditMode((v) => !v)}
              className="w-full mb-3 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5"
              style={{ background: editMode ? COLORS.yellow : COLORS.panelAlt, color: editMode ? "#3A2E10" : COLORS.text, border: `1px solid ${editMode ? COLORS.yellow : COLORS.line}` }}
            >
              <Plus size={13} /> {editMode ? "Done editing positions" : "Add / move houses"}
            </button>
            {editMode && (
              <p className="text-[11px] mb-3" style={{ color: COLORS.textDim }}>
                Click the map to drop a new house, or drag a pin onto the right building.
              </p>
            )}

            <div className="rounded-lg p-2.5 mb-3" style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.line}` }}>
              <p className="text-[11px] mb-2" style={{ color: COLORS.textDim }}>
                {selected.length === 0 ? "Tap houses below or on the map to select." : `${selected.length} selected`}
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={!selected.length}
                  onClick={() => setScheduling(true)}
                  className="flex-1 rounded-lg py-1.5 text-[11px] font-medium disabled:opacity-40"
                  style={{ background: COLORS.yellowDim, color: COLORS.text, border: `1px solid ${COLORS.yellow}` }}
                >
                  Schedule
                </button>
                <button
                  disabled={!selected.length}
                  onClick={() => { onClear(selected); setSelected([]); }}
                  className="flex-1 rounded-lg py-1.5 text-[11px] font-medium disabled:opacity-40"
                  style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
                >
                  Clear
                </button>
              </div>
              {scheduling && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                  <input
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="10 AM – 1 PM, Sat"
                    className="w-full rounded-lg px-2 py-1.5 text-xs mb-1.5"
                    style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { if (!timeInput.trim()) return; onSchedule(selected, timeInput.trim()); setScheduling(false); setTimeInput(""); setSelected([]); }}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-medium"
                      style={{ background: COLORS.yellow, color: "#3A2E10" }}
                    >
                      Confirm
                    </button>
                    <button onClick={() => setScheduling(false)} className="rounded-lg py-1.5 px-2 text-[11px]" style={{ color: COLORS.textDim }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {LINES.map((line) => (
              <div key={line.id} className="mb-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.line}` }}>
                <div className="px-2.5 py-1 text-[11px] font-mono flex items-center gap-1.5" style={{ background: COLORS.panelAlt, color: line.color }}>
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: line.color }} /> {line.name}
                </div>
                {houses.filter((h) => h.lineId === line.id).map((h) => (
                  <div
                    key={h.id}
                    onClick={() => toggleSelect(h.id)}
                    className="px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer"
                    style={{ borderTop: `1px solid ${COLORS.line}`, background: selected.includes(h.id) ? COLORS.panelAlt : "transparent" }}
                  >
                    <span className="flex items-center gap-1.5" style={{ color: COLORS.text }}>
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ background: statusFill(h.status), border: `1px solid ${COLORS.line}` }} />
                      {h.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {h.incidents?.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); onViewIncidents(h.id); }}><Camera size={12} color={COLORS.accent} /></button>
                      )}
                      {h.status === "red" && (
                        <button onClick={(e) => { e.stopPropagation(); onSimulateDevice(h.id); }} title="Device already flagged this — demo only" style={{ color: COLORS.textDim }}>
                          <Radio size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function feederPolylines(houses) {
  return houses.map((h) => ({ path: [SUBSTATION, { lat: h.lat, lng: h.lng }], color: lineColor(h.lineId), opacity: 0.75 }));
}

// ---------- App ----------
export default function App() {
  const [houses, setHouses] = useState(INITIAL_HOUSES.map((h) => ({ ...h, incidents: [] })));
  const [view, setView] = useState("resident");
  const [residentId, setResidentId] = useState("h1");
  const [infoOpen, setInfoOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // layer state (KSEB view)
  const [visibleLines, setVisibleLines] = useState(LINES.map((l) => l.id));
  const [showOutages, setShowOutages] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showFeederLines, setShowFeederLines] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [newName, setNewName] = useState("");
  const [newLine, setNewLine] = useState(LINES[0].id);
  const [viewingIncidentsOf, setViewingIncidentsOf] = useState(null);

  const updateHouse = (id, patch) => setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const updateMany = (ids, patch) => setHouses((hs) => hs.map((h) => (ids.includes(h.id) ? { ...h, ...patch } : h)));

  const residentHouse = houses.find((h) => h.id === residentId);

  const visibleHouses = view === "kseb"
    ? houses.filter((h) => {
        if (!visibleLines.includes(h.lineId)) return false;
        if (h.status === "red" && !showOutages) return false;
        if (h.status === "yellow" && !showMaintenance) return false;
        return true;
      })
    : [residentHouse];

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg, fontFamily: "ui-sans-serif, system-ui" }}>
      <MapView
        apiKey={GOOGLE_MAPS_API_KEY}
        center={view === "kseb" ? SUBSTATION : { lat: residentHouse.lat, lng: residentHouse.lng }}
        zoom={view === "kseb" ? 18 : 19}
        houses={visibleHouses}
        substation={view === "kseb" ? SUBSTATION : null}
        getColor={(h) => statusFill(h.status)}
        selectedIds={view === "kseb" ? selected : [residentId]}
        onHouseClick={view === "kseb" && !editMode ? (h) => setSelected((s) => (s.includes(h.id) ? s.filter((x) => x !== h.id) : [...s, h.id])) : undefined}
        editable={view === "kseb" && editMode}
        onMapClick={view === "kseb" && editMode ? (pt) => setPendingPoint(pt) : undefined}
        onHouseDrag={(id, pos) => updateHouse(id, pos)}
        polylines={view === "kseb" && showFeederLines ? feederPolylines(visibleHouses) : []}
      />

      <TopBar view={view} setView={setView} onInfo={() => setInfoOpen(true)} />

      {view === "kseb" && (
        <>
          <div className="absolute top-16 right-3 z-20" style={{ display: panelOpen ? "none" : "block" }}>
            <Pill onClick={() => setPanelOpen(true)}><SlidersHorizontal size={14} /></Pill>
          </div>
          {panelOpen && (
            <>
              <div className="absolute top-3 right-3 z-30">
                <Pill onClick={() => setPanelOpen(false)}><X size={14} /></Pill>
              </div>
              <KsebPanel
                houses={houses}
                visibleLines={visibleLines}
                setVisibleLines={setVisibleLines}
                showOutages={showOutages}
                setShowOutages={setShowOutages}
                showMaintenance={showMaintenance}
                setShowMaintenance={setShowMaintenance}
                showFeederLines={showFeederLines}
                setShowFeederLines={setShowFeederLines}
                selected={selected}
                setSelected={setSelected}
                editMode={editMode}
                setEditMode={setEditMode}
                onSchedule={(ids, time) => updateMany(ids, { status: "yellow", maintenanceTime: time })}
                onClear={(ids) => updateMany(ids, { status: "normal", maintenanceTime: undefined })}
                onSimulateDevice={(id) => updateHouse(id, { status: "red" })}
                onViewIncidents={setViewingIncidentsOf}
              />
            </>
          )}

          {pendingPoint && (
            <div className="absolute bottom-3 left-3 z-30 w-72 max-w-[85vw] rounded-xl p-3 shadow-2xl" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }}>
              <p className="text-xs mb-2" style={{ color: COLORS.textDim }}>New house at {pendingPoint.lat.toFixed(5)}, {pendingPoint.lng.toFixed(5)}</p>
              <div className="flex gap-2 mb-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="House name"
                  className="flex-1 rounded-lg px-2.5 py-2 text-sm"
                  style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
                />
                <select
                  value={newLine}
                  onChange={(e) => setNewLine(e.target.value)}
                  className="rounded-lg px-2 py-2 text-sm"
                  style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
                >
                  {LINES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!newName.trim()) return;
                    setHouses((hs) => [...hs, { id: `h${Date.now()}`, name: newName.trim(), lineId: newLine, ...pendingPoint, status: "normal", incidents: [] }]);
                    setPendingPoint(null);
                    setNewName("");
                  }}
                  className="flex-1 rounded-lg py-2 text-xs font-medium"
                  style={{ background: COLORS.accent, color: "#fff" }}
                >
                  Add house
                </button>
                <button onClick={() => setPendingPoint(null)} className="rounded-lg py-2 px-3 text-xs" style={{ color: COLORS.textDim }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {view === "resident" && (
        <ResidentSheet
          houses={houses}
          residentId={residentId}
          setResidentId={setResidentId}
          onReport={(id) => updateHouse(id, { status: "red" })}
          onRestore={(id) => updateHouse(id, { status: "normal" })}
          onAddIncident={(id, photo) => setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, incidents: [...(h.incidents || []), photo] } : h)))}
        />
      )}

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}

      {viewingIncidentsOf && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "#000000b0" }} onClick={() => setViewingIncidentsOf(null)}>
          <div className="rounded-xl p-4 max-w-sm w-full" style={{ background: COLORS.panelSolid, border: `1px solid ${COLORS.line}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: COLORS.text }}>Incident photos</span>
              <button onClick={() => setViewingIncidentsOf(null)}><X size={18} color={COLORS.textDim} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {houses.find((h) => h.id === viewingIncidentsOf)?.incidents.map((src, i) => (
                <img key={i} src={src} alt="incident" className="w-full h-28 object-cover rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
