import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X } from "lucide-react";

interface CardScannerProps {
  onCapture: (imageData: string, cardInfo: { name: string; set: string; number: string }) => void;
}

const SAMPLE_CARDS = [
  { name: "Charizard", set: "Base Set", number: "4/102" },
  { name: "Pikachu", set: "Jungle", number: "60/64" },
  { name: "Blastoise", set: "Base Set", number: "2/102" },
  { name: "Dark Magician", set: "LOB", number: "LOB-005" },
  { name: "Blue-Eyes White Dragon", set: "SDK", number: "SDK-001" },
];

export default function CardScanner({ onCapture }: CardScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const simulateOCR = () => SAMPLE_CARDS[Math.floor(Math.random() * SAMPLE_CARDS.length)];

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setPreview(data);
      onCapture(data, simulateOCR());
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(mediaStream);
      setIsCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch {
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL("image/webp", 0.9);
    setPreview(data);
    onCapture(data, simulateOCR());
    stopCamera();
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsCamera(false);
  };

  const clear = () => {
    setPreview(null);
    stopCamera();
  };

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full"
      >
        <img src={preview} alt="Captured card" className="w-full aspect-[2.5/3.5] object-cover bg-secondary" />
        <button
          onClick={clear}
          className="absolute top-2 right-2 p-2 bg-background/80 text-foreground hover:bg-background snap-transition"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  if (isCamera) {
    return (
      <div className="relative w-full aspect-[2.5/3.5] bg-secondary overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-4 border border-foreground/30 pointer-events-none" style={{ borderWidth: "0.5px" }} />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          <button onClick={capturePhoto} className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
            Capture
          </button>
          <button onClick={stopCamera} className="px-6 py-3 border border-border text-foreground font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full aspect-[2.5/3.5] bg-secondary border border-dashed border-border flex flex-col items-center justify-center gap-6"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={startCamera}
        className="flex items-center gap-3 px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition"
      >
        <Camera className="w-4 h-4" />
        Scan Card
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-3 px-6 py-3 border border-border text-foreground font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition"
      >
        <Upload className="w-4 h-4" />
        Upload Image
      </button>
    </motion.div>
  );
}
