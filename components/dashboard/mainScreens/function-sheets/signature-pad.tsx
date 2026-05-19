'use client';

/**
 * SignaturePad — vanilla-React canvas signature capture.
 *
 * Pure component, no external deps. Handles mouse + touch with
 * pressure-sensitive line width (lineWidth scales with velocity for
 * a more natural pen feel). Exports the drawing as a base64 PNG
 * data URL via the imperative `getDataUrl()` ref method.
 *
 * Used by SignDialog in two flows:
 *   1. Draw mode (this component used directly)
 *   2. Type mode (the SignDialog renders the typed name in a cursive
 *      font INTO this same canvas, then exports it as a PNG — so the
 *      backend payload shape is identical regardless of capture mode)
 */

import * as React from 'react';
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  /** Returns the canvas PNG as a data:image/png;base64,... URL or null when empty. */
  getDataUrl: () => string | null;
  /** Returns true when the user has actually drawn something. */
  hasDrawing: () => boolean;
  /** Clears the canvas + resets the empty flag. */
  clear: () => void;
  /** Render typed text into the canvas (used by SignDialog 'Type' mode). */
  renderTypedSignature: (name: string) => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  className?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ width = 480, height = 180, className = '' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const [hasInk, setHasInk] = useState(false);

    // ─── canvas setup ──────────────────────────────────────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Hi-DPI scaling.
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      // Fill white background so exported PNG isn't transparent.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1f2937'; // neutral-800
    }, [width, height]);

    // ─── pointer handlers ─────────────────────────────────────────
    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: performance.now(),
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      lastPointRef.current = getPos(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const cur = getPos(e);
      const last = lastPointRef.current;
      if (!last) return;
      const dx = cur.x - last.x;
      const dy = cur.y - last.y;
      const dist = Math.hypot(dx, dy);
      const dt = Math.max(1, cur.t - last.t);
      const velocity = dist / dt;
      // Slower stroke = thicker line, faster = thinner (natural pen feel).
      const lineWidth = Math.min(3.5, Math.max(1.2, 3 - velocity * 1.2));
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(cur.x, cur.y);
      ctx.stroke();
      lastPointRef.current = cur;
      if (!hasInk) setHasInk(true);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      drawingRef.current = false;
      lastPointRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    // ─── imperative API ───────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        if (!hasInk) return null;
        const canvas = canvasRef.current;
        return canvas ? canvas.toDataURL('image/png') : null;
      },
      hasDrawing: () => hasInk,
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        setHasInk(false);
      },
      renderTypedSignature: (name: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (!name || !name.trim()) {
          setHasInk(false);
          return;
        }
        ctx.fillStyle = '#1f2937';
        // Use a cursive-style fallback chain. Browsers without Brush
        // Script fall back to serif italic — still better than nothing.
        ctx.font = "italic 48px 'Brush Script MT', 'Lucida Handwriting', cursive";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.trim(), width / 2, height / 2, width - 30);
        setHasInk(true);
      },
    }));

    return (
      <div
        className={`relative inline-block rounded-md border border-neutral-300 ${className}`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none rounded-md"
          style={{ cursor: 'crosshair' }}
        />
        {/* Baseline guide */}
        <div
          className="pointer-events-none absolute left-4 right-4 border-b border-dashed border-neutral-300"
          style={{ bottom: 28 }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            setHasInk(false);
          }}
          className="absolute right-1 top-1 h-7 px-2 text-xs"
        >
          <Eraser className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>
    );
  },
);
