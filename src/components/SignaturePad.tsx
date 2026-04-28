import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";

interface SignaturePadProps {
  label: string;
  onSignatureChange?: (dataUrl: string | null) => void;
}

export interface SignaturePadRef {
  clear: () => void;
  getDataUrl: () => string | null;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ label, onSignatureChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onSignatureChange?.(null);
    },
    getDataUrl: () => {
      if (!hasSignature) return null;
      return canvasRef.current?.toDataURL("image/png") ?? null;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      const fg = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
      ctx.strokeStyle = fg ? `hsl(${fg})` : "hsl(0, 0%, 5%)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasSignature(true);
      const dataUrl = canvasRef.current?.toDataURL("image/png") ?? null;
      onSignatureChange?.(dataUrl);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      className="relative h-48 w-full border border-dashed border-border bg-secondary/50"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {hasSignature && (
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            onSignatureChange?.(null);
          }}
          className="absolute right-2 top-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground snap-transition"
        >
          Clear
        </button>
      )}
    </motion.div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
