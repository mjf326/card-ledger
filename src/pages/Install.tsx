import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, Share, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 p-2 text-muted-foreground hover:text-foreground snap-transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <img
          src="/pwa-icon-512.png"
          alt="Cardinal"
          width={96}
          height={96}
          className="mx-auto rounded-2xl"
        />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Install Cardinal</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Add to your home screen for quick access, camera scanning, and offline use.
          </p>
        </div>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-primary font-mono text-sm uppercase tracking-wider">
            <Check className="w-5 h-5" />
            Already Installed
          </div>
        ) : isIOS ? (
          <div className="space-y-4 text-left bg-secondary p-6 border border-border">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Install on iPhone
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="font-mono text-primary">1.</span>
                <span>
                  Tap the <Share className="w-4 h-4 inline -mt-0.5" /> Share button in Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-primary">2.</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-primary">3.</span>
                <span>Tap "Add" to confirm</span>
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
        ) : (
          <div className="space-y-4 text-left bg-secondary p-6 border border-border">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Install from browser
            </p>
            <p className="text-sm text-muted-foreground">
              Open this page in Chrome or Edge, then use the browser menu → "Install app" or "Add to Home Screen".
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { label: "Camera", desc: "Scan cards" },
            { label: "Offline", desc: "Works anywhere" },
            { label: "Fast", desc: "Instant load" },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <p className="font-mono text-xs uppercase tracking-wider">{f.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
