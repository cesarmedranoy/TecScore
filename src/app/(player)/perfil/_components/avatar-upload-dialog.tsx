/**
 * AvatarUploadDialog — flujo subir + recortar + guardar foto custom.
 *
 * Inspirado en TikTok: el usuario sube → zoom y arrastra para centrar →
 * preview circular → guardar. Internamente el output es un JPEG cuadrado
 * 256×256 q=0.85 (~30KB), el círculo lo aplica CSS al renderizar.
 */

"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Upload, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getCroppedDataUrl,
  readFileAsDataUrl,
} from "@/lib/effects/crop-image";
import {
  uploadCustomAvatarAction,
  removeCustomAvatarAction,
} from "../actions";

interface AvatarUploadDialogProps {
  hasCurrent: boolean;
}

export function AvatarUploadDialog({ hasCurrent }: AvatarUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen válida");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Máximo 10 MB");
      return;
    }
    setError(null);
    const dataUrl = await readFileAsDataUrl(file);
    setImgSrc(dataUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  async function save() {
    if (!imgSrc || !croppedArea) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedDataUrl(imgSrc, croppedArea, 256);
      const res = await uploadCustomAvatarAction(dataUrl);
      if (res.error) {
        setError(res.error);
        return;
      }
      startTransition(() => {
        setOpen(false);
        setImgSrc(null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar imagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await removeCustomAvatarAction();
      if (res.error) {
        setError(res.error);
        return;
      }
      startTransition(() => setOpen(false));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setImgSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button variant="accent" onClick={() => setOpen(true)}>
        <Camera />
        Subir mi foto
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir tu foto</DialogTitle>
          <DialogDescription>
            Selecciona una imagen, ajustá el zoom y posición. El círculo es
            cómo se va a ver tu avatar.
          </DialogDescription>
        </DialogHeader>

        {!imgSrc ? (
          <div className="flex flex-col gap-4 py-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg py-10 px-4 flex flex-col items-center gap-2 hover:bg-muted hover:border-primary/40 transition-colors"
            >
              <Upload className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click para elegir imagen
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG hasta 10MB
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {hasCurrent && (
              <Button
                type="button"
                variant="outline"
                onClick={remove}
                disabled={busy}
              >
                <Trash2 />
                Eliminar foto actual
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={busy}
              >
                Cambiar
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          {imgSrc && (
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? "Guardando..." : "Guardar foto"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
