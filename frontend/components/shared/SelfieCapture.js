'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, AlertCircle } from 'lucide-react';

/**
 * Composant de capture selfie via la camera du navigateur.
 *
 * Flux d'utilisation :
 * 1. Au montage, on demande l'acces a la camera (getUserMedia)
 * 2. On affiche le flux video EN DIRECT dans une balise video
 * 3. Au clic sur "Capturer", on fige l'image courante sur un canvas cache
 * 4. On convertit ce canvas en fichier (Blob) et on le transmet au parent
 * 5. Le parent (ex: page Pointage) decide quoi en faire (l'envoyer a l'API)
 *
 * @param {function} onCapture - callback appele avec (file: File) une fois la photo prise
 */
export default function SelfieCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Erreur acces camera:', err);
      if (err.name === 'NotAllowedError') {
        setError("Acces a la camera refuse. Autorisez la camera dans les parametres du navigateur.");
      } else if (err.name === 'NotFoundError') {
        setError("Aucune camera detectee sur cet appareil.");
      } else {
        setError("Impossible d'acceder a la camera. " + err.message);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setIsCapturing(false);
        onCapture(file);
      },
      'image/jpeg',
      0.9
    );

    setIsCapturing(true);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    startCamera();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {capturedImage ? (
        <div className="space-y-3">
          <img
            src={capturedImage}
            alt="Selfie capture"
            className="w-full rounded-2xl border border-[var(--card-border)]"
          />
          <button
            type="button"
            onClick={retakePhoto}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-semibold text-[var(--foreground)] hover:border-primary/40 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reprendre la photo
          </button>
        </div>
      ) : (
        <>
          {!cameraReady && !error && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full flex flex-col items-center justify-center gap-3 py-12 bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] rounded-2xl hover:border-primary/40 transition-all"
            >
              <Camera className="w-8 h-8 text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Activer la camera</span>
            </button>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full rounded-2xl border border-[var(--card-border)] ${cameraReady ? 'block' : 'hidden'}`}
          />

          {cameraReady && (
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Capturer la photo
            </button>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
