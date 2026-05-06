/**
 * FaceMark - Custom Hooks
 */
import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { reportsAPI } from '../api';

/** Generic async action with loading + error state */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.message
        || Object.values(err.response?.data || {})?.[0]?.[0]
        || err.message
        || 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}

/** Download a blob as a file */
export function useDownload() {
  const download = useCallback((blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const exportExcel = useCallback(async (params) => {
    const tid = toast.loading('Generating Excel report…');
    try {
      const res = await reportsAPI.exportExcel(params);
      const start = params.start || 'report';
      const end   = params.end   || '';
      download(res.data, `attendance_${start}_${end}.xlsx`);
      toast.success('Excel downloaded!', { id: tid });
    } catch {
      toast.error('Export failed.', { id: tid });
    }
  }, [download]);

  const exportPDF = useCallback(async (params) => {
    const tid = toast.loading('Generating PDF report…');
    try {
      const res = await reportsAPI.exportPDF(params);
      const start = params.start || 'report';
      download(res.data, `attendance_${start}.pdf`);
      toast.success('PDF downloaded!', { id: tid });
    } catch {
      toast.error('PDF export failed.', { id: tid });
    }
  }, [download]);

  return { exportExcel, exportPDF };
}

/** Webcam frame capture helper */
export function useWebcamCapture(webcamRef) {
  const capture = useCallback(() => {
    return webcamRef.current?.getScreenshot() || null;
  }, [webcamRef]);

  const captureMultiple = useCallback((count = 15, interval = 500) => {
    return new Promise((resolve) => {
      const frames = [];
      let captured = 0;
      const id = setInterval(() => {
        const frame = webcamRef.current?.getScreenshot();
        if (frame) {
          frames.push(frame);
          captured++;
        }
        if (captured >= count) {
          clearInterval(id);
          resolve(frames);
        }
      }, interval);
    });
  }, [webcamRef]);

  return { capture, captureMultiple };
}

/** Liveness detection state machine */
export function useLiveness() {
  const [blinks,  setBlinks]  = useState(0);
  const [passed,  setPassed]  = useState(false);
  const [message, setMessage] = useState('Please blink naturally to verify you are live');
  const REQUIRED = 3;

  const processBlink = useCallback(() => {
    setBlinks(prev => {
      const next = prev + 1;
      if (next >= REQUIRED) {
        setPassed(true);
        setMessage('✓ Liveness verified!');
      } else {
        setMessage(`Blink ${REQUIRED - next} more time(s)…`);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setBlinks(0);
    setPassed(false);
    setMessage('Please blink naturally to verify you are live');
  }, []);

  return { blinks, passed, message, processBlink, reset, required: REQUIRED };
}
