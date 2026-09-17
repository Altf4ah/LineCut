import React, { useState, useRef, useEffect, useCallback } from "react";
import { Zap, Camera, X, Wrench, Radio, MapPin, Clock, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";

// ---------- palette ----------
const COLORS = {
  bg: "#0E1620",
  panel: "#16212C",
  panelAlt: "#1C2A37",
  line: "#2A3A48",
  text: "#E7EDF3",
  textDim: "#8FA1B0",
  normal: "#3D4C59",
  normalFill: "#E7EDF3",
  red: "#E4572E",
  redDim: "#5A2F22",
  yellow: "#F2B134",
  yellowDim: "#4F3F1C",
  green: "#4C9A6A",
  accent: "#4A90D9",
};

const LINES = [
  { id: "L1", name: "Feeder A · Panampilly", color: "#4A6FA5" },
  { id: "L2", name: "Feeder B · Kadavanthra", color: "#9B6BB0" },
  { id: "L3", name: "Feeder C · Elamkulam", color: "#2E9188" },
];

const INITIAL_HOUSES = [
  { id: "h1", name: "Anand Bhavan", lineId: "L1", x: 22, y: 72, status: "normal" },
  { id: "h2", name: "Green Villa", lineId: "L1", x: 36, y: 54, status: "normal" },
  { id: "h3", name: "Lakeview House", lineId: "L1", x: 14, y: 38, status: "normal" },
  { id: "h4", name: "Sunrise Cottage", lineId: "L2", x: 55, y: 66, status: "normal" },
  { id: "h5", name: "Palm Residency", lineId: "L2", x: 70, y: 50, status: "yellow", maintenanceTime: "2:00 PM – 4:00 PM, Today" },
  { id: "h6", name: "Riverside House", lineId: "L2", x: 60, y: 30, status: "normal" },
  { id: "h7", name: "Hilltop Manor", lineId: "L3", x: 86, y: 58, status: "normal" },
  { id: "h8", name: "Blue Nest", lineId: "L3", x: 80, y: 34, status: "normal" },
];

const SUBSTATION = { x: 50, y: 8 };

function lineColor(id) {
  return LINES.find((l) => l.id === id)?.color || COLORS.line;
}
function lineName(id) {
  return LINES.find((l) => l.id === id)?.name || "Unassigned";
}
function statusFill(status) {
  if (status === "red") return COLORS.red;
  if (status === "yellow") return COLORS.yellow;
  return COLORS.normalFill;
}

// ---------- Map ----------
function GridMap({ houses, colorMode, selectedIds = [], onHouseClick, highlightHouseId }) {
  return (
    <div
      style={{ background: COLORS.bg, border: `1px solid ${COLORS.line}` }}
      className="relative w-full rounded-lg overflow-hidden"
    >
      <svg viewBox="0 0 100 85" className="w-full h-auto block" style={{ minHeight: 260 }}>
        {/* feeder lines */}
        {houses.map((h) => (
          <line
            key={"ln-" + h.id}
            x1={SUBSTATION.x}
            y1={SUBSTATION.y}
            x2={h.x}
            y2={h.y}
            stroke={lineColor(h.lineId)}
            strokeWidth={highlightHouseId === h.id ? 0.7 : 0.4}
            opacity={colorMode === "line" ? 0.9 : 0.35}
          />
        ))}
        {/* substation node */}
        <g>
          <circle cx={SUBSTATION.x} cy={SUBSTATION.y} r={2.6} fill={COLORS.panelAlt} stroke={COLORS.textDim} strokeWidth={0.3} />
          <circle cx={SUBSTATION.x} cy={SUBSTATION.y} r={1} fill={COLORS.accent} />
        </g>
        <text x={SUBSTATION.x} y={SUBSTATION.y - 3.5} fontSize="2.4" fill={COLORS.textDim} textAnchor="middle" fontFamily="ui-monospace, monospace">
          33kV SUBSTATION
        </text>

        {/* houses */}
        {houses.map((h) => {
          const isSelected = selectedIds.includes(h.id);
          const fill = colorMode === "line" ? (h.status === "normal" ? "#0000" : statusFill(h.status)) : statusFill(h.status);
          const strokeColor = colorMode === "line" ? lineColor(h.lineId) : isSelected ? COLORS.accent : "#00000030";
          return (
            <g
              key={h.id}
              transform={`translate(${h.x} ${h.y})`}
              onClick={() => onHouseClick && onHouseClick(h)}
              style={{ cursor: onHouseClick ? "pointer" : "default" }}
            >
              {highlightHouseId === h.id && (
                <circle r={4.2} fill="none" stroke={COLORS.accent} strokeWidth={0.4}>
                  <animate attributeName="r" values="3;4.6;3" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <rect
                x={-2.4}
                y={-2.4}
                width={4.8}
                height={4.8}
                rx={0.6}
                fill={colorMode === "line" ? (h.status === "normal" ? COLORS.normalFill : fill) : fill}
                stroke={strokeColor}
                strokeWidth={isSelected ? 0.6 : 0.35}
              />
              {h.status === "yellow" && (
                <text x={0} y={0.9} fontSize="3" textAnchor="middle" fill="#4F3F1C">⚠</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Swipe-to-report bar ----------
function SwipeBar({ reported, onReport, onRestore, disabled }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(0); // 0..1
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setDrag(ratio);
  }, []);

  const onPointerDown = (e) => {
    if (disabled) return;
    setDragging(true);
    handleMove(e.clientX);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    handleMove(e.clientX);
  };
  const commit = () => {
    if (!dragging) return;
    setDragging(false);
    if (drag > 0.82) {
      setDrag(1);
      onReport();
    } else {
      setDrag(0);
    }
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
  }, [dragging, drag]);

  if (reported) {
    return (
      <button
        onClick={onRestore}
        className="w-full rounded-full flex items-center justify-between px-1.5 py-1.5"
        style={{ background: COLORS.redDim, border: `1px solid ${COLORS.red}` }}
      >
        <span className="flex items-center gap-2 pl-2" style={{ color: COLORS.text }}>
          <CheckCircle2 size={16} color={COLORS.red} />
          <span className="text-sm">Power cut reported</span>
        </span>
        <span
          className="rounded-full flex items-center justify-center"
          style={{ background: COLORS.red, width: 34, height: 34, flexShrink: 0 }}
        >
          <X size={16} color="#fff" />
        </span>
      </button>
    );
  }

  const pct = Math.round(drag * 100);
  return (
    <div
      ref={trackRef}
      onMouseDown={onPointerDown}
      onTouchStart={(e) => {
        setDragging(true);
        handleMove(e.touches[0].clientX);
      }}
      className="relative w-full rounded-full select-none"
      style={{
        background: COLORS.panelAlt,
        border: `1px solid ${COLORS.line}`,
        height: 46,
        opacity: disabled ? 0.5 : 1,
        touchAction: "none",
      }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.redDim}, ${COLORS.red})`, transition: dragging ? "none" : "width 0.2s ease" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm" style={{ color: pct > 40 ? "#fff" : COLORS.textDim }}>
          {disabled ? "Maintenance scheduled" : "Slide to report a power cut →"}
        </span>
      </div>
      <div
        className="absolute top-0.5 rounded-full flex items-center justify-center"
        style={{
          left: `calc(${pct}% - ${pct > 2 ? 17 : 1}px)`,
          width: 38,
          height: 38,
          background: COLORS.red,
          transition: dragging ? "none" : "left 0.2s ease",
        }}
      >
        <ChevronRight size={18} color="#fff" />
      </div>
    </div>
  );
}

// ---------- Camera capture ----------
function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (!active) return;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera unavailable — upload a photo instead."));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "#000000b0" }}>
      <div className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.text }}>
            <Camera size={16} /> Capture incident
          </span>
          <button onClick={onClose}><X size={18} color={COLORS.textDim} /></button>
        </div>
        {!error ? (
          <div className="rounded-lg overflow-hidden mb-3" style={{ background: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: 260 }} />
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: COLORS.textDim }}>{error}</p>
        )}
        <div className="flex gap-2">
          {!error && (
            <button onClick={snap} className="flex-1 rounded-lg py-2.5 text-sm font-medium" style={{ background: COLORS.accent, color: "#fff" }}>
              Take photo
            </button>
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

// ---------- Resident View ----------
function ResidentView({ houses, residentId, setResidentId, onReport, onRestore, onAddIncident }) {
  const house = houses.find((h) => h.id === residentId);
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="max-w-md mx-auto px-4 pb-10">
      <div className="mb-3">
        <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.textDim }}>Viewing as</label>
        <select
          value={residentId}
          onChange={(e) => setResidentId(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
          style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
        >
          {houses.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <GridMap houses={houses} colorMode="status" highlightHouseId={residentId} />

      <div className="mt-4 rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-medium" style={{ color: COLORS.text }}>{house.name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.panelAlt, color: lineColor(house.lineId), border: `1px solid ${lineColor(house.lineId)}` }}>
            {lineName(house.lineId)}
          </span>
        </div>

        {house.status === "yellow" ? (
          <div className="flex items-start gap-2 mt-3 mb-3 rounded-lg p-3" style={{ background: COLORS.yellowDim }}>
            <Clock size={16} color={COLORS.yellow} className="mt-0.5 shrink-0" />
            <p className="text-sm" style={{ color: COLORS.text }}>
              KSEB has scheduled maintenance on this line. Expected power cut: <span style={{ color: COLORS.yellow }}>{house.maintenanceTime}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: COLORS.textDim }}>
            {house.status === "red" ? "Your report is visible to KSEB." : "If your power is out right now, report it below."}
          </p>
        )}

        <SwipeBar
          reported={house.status === "red"}
          disabled={house.status === "yellow"}
          onReport={() => onReport(house.id)}
          onRestore={() => onRestore(house.id)}
        />

        {house.status === "red" && (
          <button
            onClick={() => setShowCamera(true)}
            className="w-full mt-3 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
          >
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

      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: COLORS.textDim }}>
        <Radio size={13} />
        <span>Have a monitoring device? It'll report outages here automatically — coming soon.</span>
      </div>

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(dataUrl) => {
            onAddIncident(house.id, dataUrl);
            setShowCamera(false);
          }}
        />
      )}
    </div>
  );
}

// ---------- KSEB View ----------
function KsebView({ houses, onSchedule, onClear, onSimulateDevice }) {
  const [colorMode, setColorMode] = useState("status");
  const [selected, setSelected] = useState([]);
  const [scheduling, setScheduling] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [viewingIncidentsOf, setViewingIncidentsOf] = useState(null);

  const toggleSelect = (h) => {
    setSelected((s) => (s.includes(h.id) ? s.filter((id) => id !== h.id) : [...s, h.id]));
  };

  const redCount = houses.filter((h) => h.status === "red").length;
  const yellowCount = houses.filter((h) => h.status === "yellow").length;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-10">
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: COLORS.redDim, color: COLORS.text }}>
          <AlertTriangle size={12} color={COLORS.red} /> {redCount} active outage{redCount !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: COLORS.yellowDim, color: COLORS.text }}>
          <Wrench size={12} color={COLORS.yellow} /> {yellowCount} scheduled
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-3/5">
          <div className="flex gap-2 mb-2">
            {["status", "line"].map((m) => (
              <button
                key={m}
                onClick={() => setColorMode(m)}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: colorMode === m ? COLORS.accent : COLORS.panelAlt,
                  color: colorMode === m ? "#fff" : COLORS.textDim,
                  border: `1px solid ${colorMode === m ? COLORS.accent : COLORS.line}`,
                }}
              >
                {m === "status" ? "Power status" : "Feeder lines"}
              </button>
            ))}
          </div>
          <GridMap houses={houses} colorMode={colorMode} selectedIds={selected} onHouseClick={toggleSelect} />

          <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: COLORS.textDim }}>
            {colorMode === "line"
              ? LINES.map((l) => (
                  <span key={l.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} /> {l.name}
                  </span>
                ))
              : (
                <>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS.normalFill }} /> Power on</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS.red }} /> Reported cut</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS.yellow }} /> Maintenance</span>
                </>
              )}
          </div>
        </div>

        <div className="md:w-2/5">
          <div className="rounded-xl p-3 mb-3" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
            <p className="text-xs mb-2" style={{ color: COLORS.textDim }}>
              {selected.length === 0 ? "Tap houses on the map or list to select them." : `${selected.length} house${selected.length > 1 ? "s" : ""} selected`}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!selected.length}
                onClick={() => setScheduling(true)}
                className="flex-1 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={{ background: COLORS.yellowDim, color: COLORS.text, border: `1px solid ${COLORS.yellow}` }}
              >
                <Wrench size={13} /> Schedule maintenance
              </button>
              <button
                disabled={!selected.length}
                onClick={() => {
                  onClear(selected);
                  setSelected([]);
                }}
                className="flex-1 rounded-lg py-2 text-xs font-medium disabled:opacity-40"
                style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
              >
                Clear status
              </button>
            </div>

            {scheduling && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <label className="text-xs" style={{ color: COLORS.textDim }}>Planned outage window</label>
                <input
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder="e.g. 10:00 AM – 1:00 PM, Sat"
                  className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                  style={{ background: COLORS.panelAlt, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (!timeInput.trim()) return;
                      onSchedule(selected, timeInput.trim());
                      setScheduling(false);
                      setTimeInput("");
                      setSelected([]);
                    }}
                    className="flex-1 rounded-lg py-2 text-xs font-medium"
                    style={{ background: COLORS.yellow, color: "#3A2E10" }}
                  >
                    Confirm
                  </button>
                  <button onClick={() => setScheduling(false)} className="rounded-lg py-2 px-3 text-xs" style={{ color: COLORS.textDim }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
            {LINES.map((line) => (
              <div key={line.id}>
                <div className="px-3 py-1.5 text-xs font-mono flex items-center gap-1.5" style={{ background: COLORS.panelAlt, color: line.color }}>
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: line.color }} /> {line.name}
                </div>
                {houses.filter((h) => h.lineId === line.id).map((h) => (
                  <div
                    key={h.id}
                    onClick={() => toggleSelect(h)}
                    className="px-3 py-2 flex items-center justify-between text-sm cursor-pointer"
                    style={{ borderTop: `1px solid ${COLORS.line}`, background: selected.includes(h.id) ? COLORS.panelAlt : "transparent" }}
                  >
                    <span className="flex items-center gap-2" style={{ color: COLORS.text }}>
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: statusFill(h.status), border: `1px solid ${COLORS.line}` }} />
                      {h.name}
                    </span>
                    <span className="flex items-center gap-2">
                      {h.incidents?.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); setViewingIncidentsOf(h.id); }}>
                          <Camera size={13} color={COLORS.accent} />
                        </button>
                      )}
                      {h.status === "red" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSimulateDevice(h.id); }}
                          title="Device already flagged this — demo only"
                          className="text-xs"
                          style={{ color: COLORS.textDim }}
                        >
                          <Radio size={13} />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewingIncidentsOf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000b0" }} onClick={() => setViewingIncidentsOf(null)}>
          <div className="rounded-xl p-4 max-w-sm w-full" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }} onClick={(e) => e.stopPropagation()}>
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
  const [view, setView] = useState("resident");
  const [residentId, setResidentId] = useState("h1");

  const updateHouse = (id, patch) => setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const updateMany = (ids, patch) => setHouses((hs) => hs.map((h) => (ids.includes(h.id) ? { ...h, ...patch } : h)));

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, fontFamily: "ui-sans-serif, system-ui" }}>
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} color={COLORS.accent} />
          <span className="text-lg" style={{ color: COLORS.text }}>GridPulse</span>
        </div>
        <div className="flex rounded-full p-0.5" style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.line}` }}>
          {[
            { id: "resident", label: "Resident" },
            { id: "kseb", label: "KSEB Control Room" },
          ].map((t) => (
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

      {view === "resident" ? (
        <ResidentView
          houses={houses}
          residentId={residentId}
          setResidentId={setResidentId}
          onReport={(id) => updateHouse(id, { status: "red" })}
          onRestore={(id) => updateHouse(id, { status: "normal" })}
          onAddIncident={(id, photo) =>
            setHouses((hs) => hs.map((h) => (h.id === id ? { ...h, incidents: [...(h.incidents || []), photo] } : h)))
          }
        />
      ) : (
        <KsebView
          houses={houses}
          onSchedule={(ids, time) => updateMany(ids, { status: "yellow", maintenanceTime: time })}
          onClear={(ids) => updateMany(ids, { status: "normal", maintenanceTime: undefined })}
          onSimulateDevice={(id) => updateHouse(id, { status: "red" })}
        />
      )}
    </div>
  );
}
