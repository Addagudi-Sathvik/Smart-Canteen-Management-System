import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, SwitchCamera, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const READER_ID = 'pickup-qr-camera-reader';

const pickPreferredCamera = (cameras) => {
  if (!cameras?.length) return null;

  const back = cameras.find((c) => {
    const label = (c.label || '').toLowerCase();
    return (
      label.includes('back') ||
      label.includes('rear') ||
      label.includes('environment') ||
      label.includes('facing back')
    );
  });
  if (back) return back.id;

  const front = cameras.find((c) => {
    const label = (c.label || '').toLowerCase();
    return label.includes('front') || label.includes('user') || label.includes('selfie');
  });

  // Android: last device is often rear; iOS labels vary
  if (cameras.length > 1 && !front) return cameras[cameras.length - 1].id;
  return cameras[0].id;
};

const getErrorMessage = (err) => {
  const name = err?.name || '';
  const msg = (err?.message || String(err)).toLowerCase();

  if (name === 'NotAllowedError' || msg.includes('permission')) {
    return 'Camera permission denied. Tap the lock icon in the address bar and allow Camera, then try again.';
  }
  if (msg.includes('notfound') || msg.includes('no camera')) {
    return 'No camera found on this device.';
  }
  if (msg.includes('secure') || msg.includes('https')) {
    return 'Camera only works on HTTPS (or localhost). Your site must be served securely.';
  }
  if (msg.includes('in use') || msg.includes('busy')) {
    return 'Camera is in use by another app. Close other apps and retry.';
  }
  return err?.message || 'Could not start the camera.';
};

/**
 * Mobile-friendly QR scanner using html5-qrcode (Html5Qrcode API).
 * Mount container first, then start camera in useEffect.
 */
const QrCameraScanner = ({ active, onScan, onClose }) => {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const [status, setStatus] = useState('idle'); // idle | loading | scanning | error
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState('');

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (!instance) return;

    try {
      await instance.stop();
    } catch {
      /* not scanning */
    }
    try {
      await instance.clear();
    } catch {
      /* ignore */
    }
  }, []);

  const startWithCamera = useCallback(
    async (deviceId) => {
      if (!deviceId || !active) return;

      await stopScanner();
      scannedRef.current = false;
      setStatus('loading');
      setError('');

      try {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const container = document.getElementById(READER_ID);
        if (!container) {
          throw new Error('Scanner not ready. Please try again.');
        }

        const { Html5Qrcode } = await import('html5-qrcode');
        const html5Qr = new Html5Qrcode(READER_ID, { verbose: false });
        scannerRef.current = html5Qr;

        await html5Qr.start(
          deviceId,
          {
            fps: 10,
            qrbox: (viewW, viewH) => {
              const edge = Math.min(viewW, viewH);
              const size = Math.max(200, Math.floor(edge * 0.75));
              return { width: size, height: size };
            },
            aspectRatio: 1.777778,
            disableFlip: false,
          },
          async (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            setStatus('loading');
            await stopScanner();
            onScan?.(decodedText);
          },
          () => {
            /* per-frame decode miss — normal */
          }
        );

        setCameraId(deviceId);
        setStatus('scanning');
      } catch (err) {
        console.error('[QR Scanner] start failed:', err);
        setError(getErrorMessage(err));
        setStatus('error');
        await stopScanner();
      }
    },
    [active, onScan, stopScanner]
  );

  const initCameras = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();

      if (!devices?.length) {
        setError('No camera found. Use “Paste JSON” below instead.');
        setStatus('error');
        return;
      }

      setCameras(devices);
      const preferred = pickPreferredCamera(devices);
      await startWithCamera(preferred);
    } catch (err) {
      console.error('[QR Scanner] init failed:', err);
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, [startWithCamera]);

  useEffect(() => {
    if (!active) {
      stopScanner();
      setStatus('idle');
      setError('');
      scannedRef.current = false;
      return;
    }

    initCameras();

    return () => {
      stopScanner();
    };
  }, [active, initCameras, stopScanner]);

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex((c) => c.id === cameraId);
    const next = cameras[(idx + 1) % cameras.length];
    await startWithCamera(next.id);
  };

  if (!active) return null;

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-brand-200/50 dark:border-brand-800/40 bg-espresso-950/40 p-3">
      <div className="flex items-start gap-2 text-sm text-espresso-600 dark:text-espresso-400">
        <Camera className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
        <p>
          Point your camera at the student&apos;s QR code. If prompted, tap{' '}
          <strong>Allow</strong> for camera access.
        </p>
      </div>

      {status === 'error' && error && (
        <div className="flex gap-2 p-3 rounded-xl bg-tomato-500/10 text-tomato-700 dark:text-tomato-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        id={READER_ID}
        className="w-full min-h-[260px] sm:min-h-[300px] rounded-xl overflow-hidden bg-black [&_video]:object-cover"
        aria-label="QR camera viewfinder"
      />

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 text-sm text-espresso-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          Starting camera…
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {cameras.length > 1 && status === 'scanning' && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSwitchCamera}
            className="flex items-center gap-2 text-sm"
          >
            <SwitchCamera className="w-4 h-4" />
            Switch camera
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose} className="text-sm">
          Stop camera
        </Button>
        {status === 'error' && (
          <Button type="button" variant="secondary" onClick={initCameras} className="text-sm">
            Retry camera
          </Button>
        )}
      </div>
    </div>
  );
};

export default QrCameraScanner;
