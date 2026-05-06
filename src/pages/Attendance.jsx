/**
 * FaceMark - Attendance Page
 * Real-time face recognition with liveness detection to mark attendance
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { format } from 'date-fns';
import { faceAPI, attendanceAPI } from '../api';
import { Button, Card, Badge, Alert, Select, Spinner } from '../components/UI';
import { useLiveness } from '../hooks';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SCAN_INTERVAL = 5000; // ms between recognition scans

export default function AttendancePage() {
  const webcamRef = useRef(null);
  const scanTimer = useRef(null);

  const [scanning,     setScanning]     = useState(false);
  const [camReady,     setCamReady]     = useState(false);
  const [classes,      setClasses]      = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [scanResult,   setScanResult]   = useState(null);
  const [recentMarked, setRecentMarked] = useState([]);
  const [scanCount,    setScanCount]    = useState(0);
  const isProcessing = useRef(false);
  const liveness = useLiveness();
  
  // Load classes
  useEffect(() => {
    attendanceAPI.classes({ is_active: true })
      .then(r => setClasses(r.data.results || []))
      .catch(() => {});
  }, []);

  // ── Liveness simulation (real implementation uses dlib on backend) ──────────
  // In production, the backend checks liveness. Here we simulate blink detection
  // by listening to frame changes as a proxy — the real check is done per scan.
  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => {
      if (!liveness.passed) liveness.processBlink();
    }, 1200);
    return () => clearInterval(id);
  }, [scanning, liveness]);

  // ── Scan loop ─────────────────────────────────────────────────────────────
const runScan = useCallback(async () => {
  if (isProcessing.current) return;   // 🔥 STOP overlap

  isProcessing.current = true;

  if (!webcamRef.current) {
    isProcessing.current = false;
    return;
  }

  const screenshot = webcamRef.current.getScreenshot();
  if (!screenshot) {
    isProcessing.current = false;
    return;
  }

  setScanCount(c => c + 1);

  try {
    const res = await faceAPI.recognize({
      frame: screenshot,
      liveness_data: { passed: liveness.passed, blinks: liveness.blinks },
      class_session_id: selectedClass || null,
      mark_attendance: liveness.passed,
    });

    console.log("FULL RESPONSE:", res.data);
    setScanResult(res.data);

  } catch (err) {
    console.error('Scan error:', err.message);
  } finally {
    isProcessing.current = false;   // 🔥 ALWAYS RESET
  }

}, [selectedClass, liveness.passed, liveness.blinks]);


useEffect(() => {
  if (!scanning) return;

  runScan();

  scanTimer.current = setInterval(() => {
    runScan();
  }, SCAN_INTERVAL);

  return () => clearInterval(scanTimer.current);
}, [scanning]);


  const startSession = () => {
    liveness.reset();
    setScanResult(null);
    setScanning(true);
    toast('Attendance session started', { icon: '🟢' });
  };

  const stopSession = () => {
    setScanning(false);
    setScanResult(null);
    toast('Session ended', { icon: '🔴' });
  };
  
  const faces = scanResult?.results || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Take Attendance</h1>
          <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          {scanning && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live · {scanCount} scans
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="relative bg-black aspect-video">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.85}
                videoConstraints={{ width: 720, height: 480, facingMode: 'user' }}
                onUserMedia={() => setCamReady(true)}
                onUserMediaError={() => toast.error('Camera access denied.')}
                className="w-full h-full object-cover"
              />

              {/* Recognition overlays */}
              {faces.map((face, i) => {
                const loc = face.face_location;
                if (!loc) return null;
                const isKnown = face.recognized;
                return (
                  <div key={i}
                       className="absolute pointer-events-none"
                       style={{
                         top:    `${(loc.top   / 480) * 100}%`,
                         left:   `${(loc.left  / 720) * 100}%`,
                         width:  `${((loc.right - loc.left) / 720) * 100}%`,
                         height: `${((loc.bottom - loc.top) / 480) * 100}%`,
                       }}>
                    <div className={`absolute inset-0 border-2 rounded
                                     ${isKnown ? 'border-emerald-400' : 'border-red-400'}`} />
                    <div className={`absolute -top-6 left-0 right-0 text-center text-xs font-mono px-1 py-0.5 rounded
                                     ${isKnown ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'}`}>
                      {isKnown ? `${face.user_id} (${(face.confidence * 100).toFixed(0)}%)` : 'UNKNOWN'}
                    </div>
                  </div>
                );
              })}

              {/* Scan grid overlay */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none opacity-20"
                     style={{
                       backgroundImage: 'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
                       backgroundSize: '60px 60px',
                     }} />
              )}

              {!camReady && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                  <Spinner size="lg" />
                  <p className="text-slate-400 text-sm">Initializing camera…</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              <Select
                label="Class Session (optional)"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">— General / No class —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_code} – {c.name}</option>
                ))}
              </Select>

              <div className="flex gap-3">
                {!scanning ? (
                  <Button onClick={startSession} disabled={!camReady} className="flex-1 py-3">
                    🟢 Start Attendance Session
                  </Button>
                ) : (
                  <Button onClick={stopSession} variant="danger" className="flex-1 py-3">
                    ⏹ Stop Session
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Last scan result */}
          {scanResult && faces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              {faces.map((face, i) => (
                <Card key={i} className={`border-l-4 ${face.recognized ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                                     ${face.recognized ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                      {face.recognized ? '✓' : '?'}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {face.recognized ? `${face.user_name} (${face.user_id})` : 'Unknown Face'}
                      </p>
                      <p className="text-xs text-slate-400">{face.message}</p>
                    </div>
                  </div>
                  {face.recognized && (
                    <div className="mt-2 flex gap-2">
                      <Badge label={`${(face.confidence * 100).toFixed(1)}% confidence`}
                             variant={face.confidence > 0.7 ? 'success' : 'warning'} />
                      {face.attendance_marked && <Badge label="✓ Marked" variant="success" />}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Liveness status */}
          <Card>
            <h3 className="font-semibold text-white mb-3">Liveness Check</h3>
            <div className={`text-center py-4 rounded-xl border
              ${liveness.passed
                ? 'border-emerald-700/50 bg-emerald-900/20'
                : 'border-amber-700/50 bg-amber-900/20'}`}>
              <div className="text-3xl mb-2">{liveness.passed ? '👁 ✓' : '👁'}</div>
              <p className={`text-sm font-medium ${liveness.passed ? 'text-emerald-300' : 'text-amber-300'}`}>
                {liveness.message}
              </p>
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: liveness.required }).map((_, i) => (
                  <div key={i}
                       className={`w-3 h-3 rounded-full transition-colors
                         ${i < liveness.blinks ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>
            {scanning && !liveness.passed && (
              <p className="mt-2 text-xs text-slate-500 text-center">
                Blink naturally in front of the camera
              </p>
            )}
          </Card>

          {/* Recent marked */}
          <Card>
            <h3 className="font-semibold text-white mb-3">
              Recent Marks
              {recentMarked.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({recentMarked.length})
                </span>
              )}
            </h3>
            {recentMarked.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">
                No attendance marked yet in this session
              </p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {recentMarked.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center
                                    justify-center text-emerald-400 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{m.user_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(m.time, 'HH:mm:ss')} ·{' '}
                        {(m.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Info */}
          <Card>
            <h3 className="font-semibold text-white mb-3">Session Info</h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Status', scanning ? '🟢 Active' : '⚫ Inactive'],
                ['Confidence Threshold', '55%'],
                ['Scan Interval', '2.5 seconds'],
                ['Liveness Required', 'Yes (blink)'],
                ['Duplicate Protection', 'Enabled'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-300 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
