/**
 * FaceMark - Face Registration Page
 * Captures 15-20 frames and registers face encodings
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { usersAPI, faceAPI } from '../api';
import { Button, Input, Select, Card, Alert, ProgressBar, Spinner } from '../components/UI';
import toast from 'react-hot-toast';

const REQUIRED_FRAMES = 15;
const CAPTURE_INTERVAL = 400; // ms between auto-captures

export default function RegisterFacePage() {
  const webcamRef = useRef(null);

  // Form state
  const [userId,    setUserId]    = useState('');
  const [users,     setUsers]     = useState([]);
  const [searchQ,   setSearchQ]   = useState('');

  // Capture state
  const [capturing,  setCapturing]  = useState(false);
  const [frames,     setFrames]     = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [camReady,   setCamReady]   = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [overwrite,  setOverwrite]  = useState(false);

  // Instruction overlay
  const [instruction, setInstruction] = useState('Select a user and click "Start Capture"');

  // Load user list
  useEffect(() => {
    usersAPI.list({ role: 'student', is_face_registered: false, page_size: 100 })
      .then(res => setUsers(res.data.results || []))
      .catch(() => {});
  }, []);

  // Auto-capture loop
useEffect(() => {
  if (!capturing) return;

  if (frameCount >= 15) {
    setCapturing(false);
    console.log("✅ Capture Complete");
    return;
  }

  const timer = setTimeout(() => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      setFrames(prev => [...prev, imageSrc]);
      setFrameCount(prev => prev + 1);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [capturing, frameCount]);

  const startCapture = () => {
    if (!userId) {
      alert("Select user first");
      return;
    }

  setFrames([]);
  setFrameCount(0);

  setTimeout(() => {
    setCapturing(true);
  }, 500);
};

  const stopCapture = () => {
    setCapturing(false);
    setInstruction(`Stopped. ${frameCount} frames captured.`);
  }


 function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];

  const bstr = atob(arr[1]);   // base64 → binary string
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
const handleSubmit = async () => {
  if (frames.length === 0) {
    alert("No frames captured!");
    return;
  }

  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("overwrite", overwrite);

  frames.forEach((frame, i) => {
    const blob = fetch(frame)
      .then(res => res.blob())
      .then(blob => {
        formData.append("frames", blob, `frame_${i}.jpg`);
      });
  });

  // wait for all blobs
  await Promise.all(
    frames.map(async (frame, i) => {
      const res = await fetch(frame);
      const blob = await res.blob();
      formData.append("frames", blob, `frame_${i}.jpg`);
    })
  );

  try {
    await faceAPI.register(formData);
    alert("✅ Face Registered Successfully");
  } catch (err) {
    console.error(err.response?.data);
    alert("❌ Error: " + JSON.stringify(err.response?.data));
  }
};

  const filteredUsers = users.filter(u =>
    `${u.user_id} ${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Face Registration</h1>
        <p className="text-slate-400 mt-1">Capture 15–20 images to register a user's face</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webcam panel */}
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            {/* Webcam */}
            <div className="relative bg-black aspect-video">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.85}
                videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                onUserMedia={() => setCamReady(true)}
                onUserMediaError={() => toast.error('Camera access denied.')}
                className="w-full h-full object-cover"
              />

              {/* Scan overlay while capturing */}
              {capturing && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-8 h-8 border-primary-400`}
                         style={{
                           borderTopWidth:    i < 2 ? 2 : 0,
                           borderBottomWidth: i >= 2 ? 2 : 0,
                           borderLeftWidth:   i % 2 === 0 ? 2 : 0,
                           borderRightWidth:  i % 2 === 1 ? 2 : 0,
                         }} />
                  ))}
                  {/* Scanning line */}
                  <div className="absolute left-4 right-4 h-0.5 bg-primary-400/70 animate-scan
                                  shadow-lg shadow-primary-400/50" />
                </div>
              )}

              {/* Instruction banner */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm
                              px-4 py-2 text-center">
                <p className="text-sm text-white font-medium">{instruction}</p>
              </div>

              {/* Camera not ready */}
              {!camReady && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                  <Spinner size="lg" />
                  <p className="text-slate-400 text-sm">Initializing camera…</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="p-4">
              <ProgressBar
                value={frameCount}
                max={REQUIRED_FRAMES}
                color={frameCount >= REQUIRED_FRAMES ? 'green' : 'primary'}
                label={`Frames captured: ${frameCount} / ${REQUIRED_FRAMES}`}
              />
              <div className="flex gap-3 mt-4">
                {!capturing ? (
                  <Button onClick={startCapture} disabled={!userId || !camReady}
                          className="flex-1">
                    📸 Start Capture
                  </Button>
                ) : (
                  <Button onClick={stopCapture} variant="secondary" className="flex-1">
                    ⏹ Stop Capture
                  </Button>
                )}
                <Button
                  onClick={() => { setFrames([]); setFrameCount(0); setResult(null); }}
                  variant="ghost"
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Frame thumbnails */}
          {frames.length > 0 && (
            <Card>
              <p className="text-sm text-slate-400 mb-3">Captured frames ({frames.length})</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.slice(-10).map((f, i) => (
                  <img key={i} src={f} alt={`Frame ${i}`}
                       className="rounded-md aspect-square object-cover border border-border" />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Config panel */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-white mb-4">Select User</h3>

            <Input
              placeholder="Search by ID or name…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="mb-3"
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2">
              {filteredUsers.length === 0 && (
                <p className="text-slate-500 text-sm p-3 text-center">
                  {searchQ ? 'No users match your search' : 'All students are registered'}
                </p>
              )}
              {filteredUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => setUserId(u.user_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${userId === u.user_id
                      ? 'bg-primary-600/30 border border-primary-600/50 text-white'
                      : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span className="font-mono text-xs text-slate-500 mr-2">{u.user_id}</span>
                  {u.first_name} {u.last_name}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={overwrite}
                     onChange={e => setOverwrite(e.target.checked)}
                     className="rounded" />
              <span className="text-sm text-slate-400">Overwrite existing face data</span>
            </label>
          </Card>

          {/* Instructions */}
          <Card>
            <h3 className="font-semibold text-white mb-3">Registration Guide</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                'Ensure good, even lighting on your face',
                'Remove glasses if possible for best results',
                'Follow the on-screen angle instructions',
                'Keep face within the bracket frame',
                'Avoid blinking excessively during capture',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary-400 font-mono">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={frames.length < REQUIRED_FRAMES || !userId}
            className="w-full py-3"
            variant="success"
          >
            ✓ Register Face Data ({frames.length} frames)
          </Button>

          {/* Result */}
          {result && (
            <div className="animate-fade-in">
              {result.type === 'success' && (
                <Alert type="success"
                       message={`Successfully registered ${result.data.valid_frames} face encodings for ${userId}. Average quality score: ${result.data.avg_quality_score?.toFixed(0)}.`} />
              )}
              {result.type === 'conflict' && (
                <div className="space-y-2">
                  <Alert type="warning" message="Face data already exists for this user." />
                  <Button variant="secondary" className="w-full"
                          onClick={() => { setOverwrite(true); handleSubmit(); }}>
                    Re-register (overwrite)
                  </Button>
                </div>
              )}
              {result.type === 'error' && (
                <div>
                  <Alert type="error"
                         message={result.data?.detail || 'Registration failed.'} />
                  {result.data?.frame_errors?.length > 0 && (
                    <div className="mt-2 p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Frame errors:</p>
                      {result.data.frame_errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-400">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
