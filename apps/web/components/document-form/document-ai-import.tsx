'use client';

import { documentImportResponseSchema, type DocumentImportResponse } from '@factumation/contracts';
import { Camera, Loader2, Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { browserApiFormRequest, BrowserApiError } from '@/lib/api/browser-api';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 60;

type ImportMode = 'image' | 'voice';

export function DocumentAiImport({
  kind,
  disabled,
  onImported,
}: {
  kind: 'invoice' | 'quote';
  disabled: boolean;
  onImported: (result: DocumentImportResponse) => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmounted = useRef(false);
  const [processing, setProcessing] = useState<ImportMode | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentImportResponse | null>(null);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function upload(mode: ImportMode, file: File): Promise<void> {
    const maximum = mode === 'image' ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
    if (file.size > maximum) {
      setError(
        mode === 'image'
          ? 'La photo dépasse la limite de 8 Mo.'
          : 'L’enregistrement dépasse la limite de 12 Mo.',
      );
      return;
    }
    setError(null);
    setResult(null);
    setProcessing(mode);
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    try {
      const raw = await browserApiFormRequest<unknown>(`/document-imports/${mode}`, form);
      const parsed = documentImportResponseSchema.parse(raw);
      if (unmounted.current) return;
      setResult(parsed);
      onImported(parsed);
    } catch (caught) {
      if (unmounted.current) return;
      setError(
        caught instanceof BrowserApiError
          ? `${caught.message}${caught.requestId ? ` (référence ${caught.requestId})` : ''}`
          : 'La réponse du service d’analyse est invalide.',
      );
    } finally {
      if (!unmounted.current) {
        setProcessing(null);
        if (imageInput.current) imageInput.current.value = '';
      }
    }
  }

  async function startRecording(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('L’enregistrement vocal n’est pas pris en charge par ce navigateur.');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredAudioMimeType();
      const mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      stream.current = mediaStream;
      recorder.current = mediaRecorder;
      chunks.current = [];
      setSeconds(0);
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunks.current.push(event.data);
      });
      mediaRecorder.addEventListener('stop', () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        if (unmounted.current) return;
        setRecording(false);
        const type = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks.current, { type });
        chunks.current = [];
        if (!blob.size) {
          setError('Aucun son n’a été enregistré.');
          return;
        }
        const extension = audioExtension(type);
        void upload('voice', new File([blob], `dictée.${extension}`, { type }));
      });
      mediaRecorder.start(500);
      setRecording(true);
      timer.current = setInterval(() => {
        setSeconds((current) => {
          const next = current + 1;
          if (next >= MAX_RECORDING_SECONDS && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return next;
        });
      }, 1_000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      setError('Autorisez l’accès au microphone pour utiliser la dictée.');
    }
  }

  function stopRecording(): void {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }

  const busy = disabled || processing !== null;
  return (
    <section
      className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5"
      aria-labelledby="ai-import-title"
    >
      <div>
        <h2 id="ai-import-title" className="font-semibold text-slate-900">
          Préremplir avec l’assistant
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Photographiez un document ou dictez ses informations. Vous gardez la validation finale.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          ref={imageInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload('image', file);
          }}
        />
        <button
          type="button"
          disabled={busy || recording}
          onClick={() => imageInput.current?.click()}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50"
        >
          {processing === 'image' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {processing === 'image' ? 'Analyse de la photo…' : 'Prendre une photo'}
        </button>
        <button
          type="button"
          disabled={busy && !recording}
          onClick={recording ? stopRecording : () => void startRecording()}
          className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold disabled:opacity-50 ${recording ? 'border-red-300 bg-red-50 text-red-700' : 'border-blue-200 bg-white text-[var(--primary-900)] hover:bg-blue-50'}`}
        >
          {processing === 'voice' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : recording ? (
            <Square className="size-4 fill-current" />
          ) : (
            <Mic className="size-4" />
          )}
          {processing === 'voice'
            ? 'Transcription…'
            : recording
              ? `Arrêter (${seconds} s)`
              : 'Dicter les informations'}
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Maximum : photo 8 Mo, dictée 60 secondes. Le média est envoyé pour analyse puis supprimé de
        la mémoire ; vérifiez toujours le préremplissage.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <div
          role="status"
          className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <strong>Préremplissage terminé.</strong> Parcourez les étapes pour confirmer les
          informations.
          {result.warnings.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          {result.transcript ? (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">Voir la transcription</summary>
              <p className="mt-1 whitespace-pre-wrap">{result.transcript}</p>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function preferredAudioMimeType(): string | undefined {
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

function audioExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}
