import React, { useState, useRef, useEffect } from "react";
import {
  Zap, Camera, X, Wrench, Radio, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Plus, ChevronDown, MapPin, Users, ActivitySquare, ShieldCheck,
} from "lucide-react";
import MapView from "./MapView.jsx";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ---------- palette: light, institutional-utility feel ----------
const COLORS = {
  bg: "#F4F6F8",
  headerBg: "#0B3D59",
  headerBgAlt: "#0E4A6E",
  card: "#FFFFFF",
  cardAlt: "#F1F4F7",
  border: "#E2E8EE",
  text: "#16212C",
  textDim: "#64748B",
  normalFill: "#FFFFFF",
  red: "#E4572E",
  redDim: "#FBE4DC",
  yellow: "#F2A93B",
  yellowDim: "#FCEFD1",
  accent: "#1D6FA5",
  accentDark: "#0B3D59",
};

const LINES = [
  { id: "L1", name: "Feeder A · Panampilly", color: "#4A6FA5" },
  { id: "L2", name: "Feeder B · Kadavanthra", color: "#9B4FA0" },
  { id: "L3", name: "Feeder C · Elamkulam", color: "#1E8F7A" },
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

function lineColor(id) { return LINES.find((l) => l.id === id)?.color || COLORS.border; }
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
      <span className="relative inline-flex items-center rounded-full shrink-0" style={{ width: 34, height: 19, background: checked ? COLORS.accent : "#CBD5E0", transition: "background 0.15s" }}>
        <span className="absolute rounded-full bg-white" style={{ width: 15, height: 15, top: 2, left: checked ? 17 : 2, transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone }}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-semibold" style={{ color: COLORS.text }}>{value}</div>
        <div className="text-xs" style={{ color: COLORS.textDim }}>{label}</div>
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
      style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, height: 46, opacity: disabled ? 0.6 : 1, touchAction: "none" }}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.redDim}, ${COLORS.red})`, transition: dragging ? "none" : "width 0.2s ease" }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-medium" style={{ color: pct > 40 ? "#fff" : COLORS.textDim }}>{disabled ? "Maintenance scheduled" : "Slide to report a power cut →"}</span>
      </div>
      <div className="absolute top-0.5 rounded-full flex items-center justify-center" style={{ left: `calc(${pct}% - ${pct > 2 ? 17 : 1}px)`, width: 38, height: 38, background: COLORS.red, transition: dragging ? "none" : "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
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
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "#0B121Ac0" }}>
      <div className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
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
          <label className="flex-1 rounded-lg py-2.5 text-sm font-medium text-center cursor-pointer" style={{ background: COLORS.cardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
            Upload instead
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>
      </div>
    </div>
  );
}

function feederPolylines(houses) {
  return houses.map((h) => ({ path: [SUBSTATION, { lat: h.lat, lng: h.lng }], color: lineColor(h.lineId), opacity: 0.75 }));
}

// ---------- Header ----------
function Header({ view, setView }) {
  const NAV = [
    { id: "home", label: "Overview" },
    { id: "resident", label: "Resident Portal" },
    { id: "kseb", label: "KSEB Control Room" },
  ];
  return (
    <header style={{ background: `linear-gradient(120deg, ${COLORS.headerBg}, ${COLORS.headerBgAlt})` }}>
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        <button onClick={() => setView("home")} className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ffffff22" }}>
            <Zap size={18} color={COLORS.yellow} />
          </span>
          <span>
            <span className="block text-white text-base font-semibold leading-tight">LineCut</span>
            <span className="block text-[10px] leading-tight" style={{ color: "#B7CBDA" }}>Grid Outage & Feeder Map</span>
          </span>
        </button>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className="text-sm px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{
                background: view === n.id ? "#ffffff" : "transparent",
                color: view === n.id ? COLORS.accentDark : "#D7E4EE",
                fontWeight: view === n.id ? 600 : 400,
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ---------- Home / landing ----------
function HomeView({ houses, setView }) {
  const redCount = houses.filter((h) => h.status === "red").length;
  const yellowCount = houses.filter((h) => h.status === "yellow").length;

  return (
    <div>
      <section style={{ background: `linear-gradient(160deg, ${COLORS.headerBg}, ${COLORS.headerBgAlt})` }}>
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.yellow }}>Community outage reporting, mapped by feeder line</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-white max-w-xl mb-4">
            See exactly where the power is out, and which line it's on.
          </h1>
          <p className="text-sm md:text-base max-w-lg mb-7" style={{ color: "#C7D9E5" }}>
            Residents flag a power cut in seconds. KSEB sees it land on the right feeder in real time,
            can schedule maintenance in advance, and can trace an incident back to its cause with a photo.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setView("resident")} className="rounded-lg px-5 py-2.5 text-sm font-medium" style={{ background: COLORS.yellow, color: "#3A2E10" }}>
              Report a power cut
            </button>
            <button onClick={() => setView("kseb")} className="rounded-lg px-5 py-2.5 text-sm font-medium" style={{ background: "#ffffff18", color: "#fff", border: "1px solid #ffffff40" }}>
              Open KSEB Control Room
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<AlertTriangle size={18} color={COLORS.red} />} label="Active outages" value={redCount} tone={COLORS.redDim} />
          <StatCard icon={<Wrench size={18} color={COLORS.yellow} />} label="Scheduled maintenance" value={yellowCount} tone={COLORS.yellowDim} />
          <StatCard icon={<Users size={18} color={COLORS.accent} />} label="Houses monitored" value={houses.length} tone={COLORS.cardAlt} />
          <StatCard icon={<ActivitySquare size={18} color={COLORS.accent} />} label="Feeder lines" value={LINES.length} tone={COLORS.cardAlt} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-lg font-semibold mb-5" style={{ color: COLORS.text }}>How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <Zap size={18} color={COLORS.accent} />, title: "Resident reports", body: "A resident swipes a single bar to flag their power as out. No forms, no phone call." },
            { icon: <MapPin size={18} color={COLORS.accent} />, title: "KSEB sees the line", body: "The report lands on the map, colored red, on the exact feeder that serves the house." },
            { icon: <ShieldCheck size={18} color={COLORS.accent} />, title: "Crew resolves it", body: "Planned work is marked yellow with a time window in advance; a photo can flag the cause." },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: COLORS.cardAlt }}>{s.icon}</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>{s.title}</h3>
              <p className="text-sm" style={{ color: COLORS.textDim }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, height: 340 }}>
          <MapView
            apiKey={GOOGLE_MAPS_API_KEY}
            center={SUBSTATION}
            zoom={16}
            houses={houses}
            substation={SUBSTATION}
            getColor={(h) => statusFill(h.status)}
            polylines={feederPolylines(houses)}
          />
        </div>
      </section>
    </div>
  );
}

// ---------- Resident Portal ----------
function ResidentView({ houses, residentId, setResidentId, onReport, onRestore, onAddIncident }) {
  const house = houses.find((h) => h.id === residentId);
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1" style={{ color: COLORS.text }}>Resident Portal</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textDim }}>Report a power cut at your house in a couple of seconds.</p>

      <div className="grid md:grid-cols-5 gap-5">
        <div className="md:col-span-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, height: 420 }}>
          <MapView
            apiKey={GOOGLE_MAPS_API_KEY}
            center={{ lat: house.lat, lng: house.lng }}
            zoom={19}
            houses={[house]}
            substation={null}
            getColor={(h) => statusFill(h.status)}
            selectedIds={[house.id]}
          />
        </div>

        <div className="md:col-span-2 rounded-xl p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.textDim }}>Viewing as</label>
          <select
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            className="w-full mt-1 mb-4 rounded-lg px-3 py-2 text-sm"
            style={{ background: COLORS.cardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-medium" style={{ color: COLORS.text }}>{house.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.cardAlt, color: lineColor(house.lineId), border: `1px solid ${lineColor(house.lineId)}` }}>
              {lineName(house.lineId)}
            </span>
          </div>

          {house.status === "yellow" ? (
            <div className="flex items-start gap-2 mt-3 mb-4 rounded-lg p-3" style={{ background: COLORS.yellowDim }}>
              <Clock size={16} color="#8A6415" className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: COLORS.text }}>
                KSEB has scheduled maintenance on this line: <strong>{house.maintenanceTime}</strong>
              </p>
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: COLORS.textDim }}>
              {house.status === "red" ? "Your report is visible to KSEB." : "If your power is out right now, report it below."}
            </p>
          )}

          <SwipeBar reported={house.status === "red"} disabled={house.status === "yellow"} onReport={() => onReport(house.id)} onRestore={() => onRestore(house.id)} />

          {house.status === "red" && (
            <button onClick={() => setShowCamera(true)} className="w-full mt-3 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2" style={{ background: COLORS.cardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
              <Camera size={16} /> Add a photo of the cause
            </button>
          )}

          {house.incidents?.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {house.incidents.map((src, i) => (
                <img key={i} src={src} alt="incident" className="w-16 h-16 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.border}` }} />
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 flex items-center gap-2 text-xs" style={{ borderTop: `1px solid ${COLORS.border}`, color: COLORS.textDim }}>
            <Radio size={13} />
            <span>A future monitoring device will report outages here automatically — coming soon.</span>
          </div>
        </div>
      </div>

      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={(dataUrl) => { onAddIncident(house.id, dataUrl); setShowCamera(false); }} />}
    </div>
  );
}

// ---------- KSEB Control Room ----------
function KsebView({ houses, onSchedule, onClear, onSimulateDevice, onAddHouse, onMoveHouse }) {
  const [tab, setTab] = useState("layers");
  const [visibleLines, setVisibleLines] = useState(LINES.map((l) => l.id));
  const [showOutages, setShowOutages] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showFeederLines, setShowFeederLines] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [newName, setNewName] = useState("");
  const [newLine, setNewLine] = useState(LINES[0].id);
  const [scheduling, setScheduling] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [viewingIncidentsOf, setViewingIncidentsOf] = useState(null);

  const toggleLine = (id) => setVisibleLines((vs) => (vs.includes(id) ? vs.filter((x) => x !== id) : [...vs, id]));
  const toggleSelect = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const redCount = houses.filter((h) => h.status === "red").length;
  const yellowCount = houses.filter((h) => h.status === "yellow").length;

  const visibleHouses = houses.filter((h) => {
    if (!visibleLines.includes(h.lineId)) return false;
    if (h.status === "red" && !showOutages) return false;
    if (h.status === "yellow" && !showMaintenance) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 className="text-xl font-semibold" style={{ color: COLORS.text }}>KSEB Control Room</h1>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: COLORS.redDim, color: "#8A2E17" }}>
            <AlertTriangle size={12} /> {redCount} active
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: COLORS.yellowDim, color: "#8A6415" }}>
            <Wrench size={12} /> {yellowCount} scheduled
          </span>
        </div>
      </div>
      <p className="text-sm mb-6" style={{ color: COLORS.textDim }}>Monitor every feeder, schedule planned outages, and trace incidents back to their line.</p>

      <div className="grid md:grid-cols-5 gap-5">
        <div className="md:col-span-3">
          <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${COLORS.border}`, height: 460 }}>
            <MapView
              apiKey={GOOGLE_MAPS_API_KEY}
              center={SUBSTATION}
              zoom={18}
              houses={visibleHouses}
              substation={SUBSTATION}
              getColor={(h) => statusFill(h.status)}
              selectedIds={selected}
              onHouseClick={editMode ? undefined : (h) => toggleSelect(h.id)}
              editable={editMode}
              onMapClick={editMode ? (pt) => setPendingPoint(pt) : undefined}
              onHouseDrag={onMoveHouse}
              polylines={showFeederLines ? feederPolylines(visibleHouses) : []}
            />
          </div>

          <button
            onClick={() => setEditMode((v) => !v)}
            className="rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-1.5"
            style={{ background: editMode ? COLORS.yellow : COLORS.card, color: editMode ? "#3A2E10" : COLORS.text, border: `1px solid ${editMode ? COLORS.yellow : COLORS.border}` }}
          >
            <Plus size={13} /> {editMode ? "Done editing positions" : "Add / move houses"}
          </button>
          {editMode && (
            <p className="text-xs mt-2" style={{ color: COLORS.textDim }}>
              Click the map to drop a new house, or drag a pin onto the right building.
            </p>
          )}

          {pendingPoint && (
            <div className="mt-3 rounded-xl p-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs mb-2" style={{ color: COLORS.textDim }}>New house at {pendingPoint.lat.toFixed(5)}, {pendingPoint.lng.toFixed(5)}</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="House name"
                  className="flex-1 rounded-lg px-2.5 py-2 text-sm"
                  style={{ background: COLORS.cardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                />
                <select
                  value={newLine}
                  onChange={(e) => setNewLine(e.target.value)}
                  className="rounded-lg px-2 py-2 text-sm"
                  style={{ background: COLORS.cardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                >
                  {LINES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!newName.trim()) return;
                    onAddHouse({ id: `h${Date.now()}`, name: newName.trim(), lineId: newLine, ...pendingPoint, status: "normal", incidents: [] });
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
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex gap-1 p-1.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[{ id: "layers", label: "Layers" }, { id: "manage", label: "Manage" }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 text-xs py-1.5 rounded-lg font-medium"
                  style={{ background: tab === t.id ? COLORS.cardAlt : "transparent", color: tab === t.id ? COLORS.text : COLORS.textDim }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === "layers" ? (
                <>
                  <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: COLORS.textDim }}>Status</p>
                  <Toggle checked={showOutages} onChange={setShowOutages} label="Reported outages" color={COLORS.red} />
                  <Toggle checked={showMaintenance} onChange={setShowMaintenance} label="Planned maintenance" color={COLORS.yellow} />

                  <p className="text-[11px] uppercase tracking-wide mt-4 mb-1" style={{ color: COLORS.textDim }}>Feeder lines</p>
                  <Toggle checked={showFeederLines} onChange={setShowFeederLines} label="Show feeder lines" />
                  {LINES.map((l) => (
                    <Toggle key={l.id} checked={visibleLines.includes(l.id)} onChange={() => toggleLine(l.id)} label={l.name} color={l.color} />
                  ))}
                </>
              ) : (
                <>
                  <div className="rounded-lg p-2.5 mb-3" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}>
                    <p className="text-[11px] mb-2" style={{ color: COLORS.textDim }}>
                      {selected.length === 0 ? "Tap houses below or on the map to select." : `${selected.length} selected`}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        disabled={!selected.length}
                        onClick={() => setScheduling(true)}
                        className="flex-1 rounded-lg py-1.5 text-[11px] font-medium disabled:opacity-40"
                        style={{ background: COLORS.yellowDim, color: "#3A2E10", border: `1px solid ${COLORS.yellow}` }}
                      >
                        Schedule
                      </button>
                      <button
                        disabled={!selected.length}
                        onClick={() => { onClear(selected); setSelected([]); }}
                        className="flex-1 rounded-lg py-1.5 text-[11px] font-medium disabled:opacity-40"
                        style={{ background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                      >
                        Clear
                      </button>
                    </div>
                    {scheduling && (
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <input
                          value={timeInput}
                          onChange={(e) => setTimeInput(e.target.value)}
                          placeholder="10 AM – 1 PM, Sat"
                          className="w-full rounded-lg px-2 py-1.5 text-xs mb-1.5"
                          style={{ background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
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
                    <div key={line.id} className="mb-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
                      <div className="px-2.5 py-1 text-[11px] font-mono flex items-center gap-1.5" style={{ background: COLORS.cardAlt, color: line.color }}>
                        <span className="w-2 h-2 rounded-sm inline-block" style={{ background: line.color }} /> {line.name}
                      </div>
                      {houses.filter((h) => h.lineId === line.id).map((h) => (
                        <div
                          key={h.id}
                          onClick={() => toggleSelect(h.id)}
                          className="px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer"
                          style={{ borderTop: `1px solid ${COLORS.border}`, background: selected.includes(h.id) ? COLORS.cardAlt : "transparent" }}
                        >
                          <span className="flex items-center gap-1.5" style={{ color: COLORS.text }}>
                            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: statusFill(h.status), border: `1px solid ${COLORS.border}` }} />
                            {h.name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {h.incidents?.length > 0 && (
                              <button onClick={(e) => { e.stopPropagation(); setViewingIncidentsOf(h.id); }}><Camera size={12} color={COLORS.accent} /></button>
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
        </div>
      </div>

      {viewingIncidentsOf && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "#0B121Ac0" }} onClick={() => setViewingIncidentsOf(null)}>
          <div className="rounded-xl p-4 max-w-sm w-full" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
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

// ---------- App ----------
export default function App() {
  const [houses, setHouses] = useState(INITIAL_HOUSES.map((h) => ({ ...h, incidents: [] })));
  const [view, setView] = useState("home");
  const [residentId, setResidentId] = useState("h1");

  const updateHouse = (id, patch) => setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const updateMany = (ids, patch) => setHouses((hs) => hs.map((h) => (ids.includes(h.id) ? { ...h, ...patch } : h)));

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: "ui-sans-serif, system-ui" }}>
      <Header view={view} setView={setView} />

      {view === "home" && <HomeView houses={houses} setView={setView} />}

      {view === "resident" && (
        <ResidentView
          houses={houses}
          residentId={residentId}
          setResidentId={setResidentId}
          onReport={(id) => updateHouse(id, { status: "red" })}
          onRestore={(id) => updateHouse(id, { status: "normal" })}
          onAddIncident={(id, photo) => setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, incidents: [...(h.incidents || []), photo] } : h)))}
        />
      )}

      {view === "kseb" && (
        <KsebView
          houses={houses}
          onSchedule={(ids, time) => updateMany(ids, { status: "yellow", maintenanceTime: time })}
          onClear={(ids) => updateMany(ids, { status: "normal", maintenanceTime: undefined })}
          onSimulateDevice={(id) => updateHouse(id, { status: "red" })}
          onAddHouse={(house) => setHouses((hs) => [...hs, house])}
          onMoveHouse={(id, pos) => updateHouse(id, pos)}
        />
      )}

      <footer className="py-8" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.textDim }}>
            <Zap size={14} color={COLORS.accent} /> LineCut — a community outage-mapping prototype
          </span>
          <span className="text-xs" style={{ color: COLORS.textDim }}>Map data © Google</span>
        </div>
      </footer>
    </div>
  );
}
