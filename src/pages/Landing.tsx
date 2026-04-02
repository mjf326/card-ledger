import { motion } from "framer-motion";
import { Shield, Zap, Camera, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4">
          <h1 className="font-mono text-lg tracking-tighter font-bold text-foreground">VAULT</h1>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground snap-transition">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 snap-transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-mono mb-4">Trading Card Ledger</p>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 max-w-3xl mx-auto">
            Physical Assets.<br />
            <span className="text-primary">Immutable Proof.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
            Track every buy, sell, and trade with photo evidence, digital signatures, and exportable records. Your vault for real-world transactions.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-mono uppercase tracking-widest hover:opacity-90 snap-transition"
          >
            Start Your Vault <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono mb-12 text-center">
            Why Vault
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, title: "Photo Evidence", desc: "Snap front and back of every card. Visual proof of condition at time of transaction." },
              { icon: Shield, title: "Digital Signatures", desc: "Capture buyer and seller signatures on every deal. Legally defensible records." },
              { icon: Zap, title: "Instant Export", desc: "One-tap CSV export of your entire transaction history. Tax season made simple." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="border border-border p-8"
              >
                <f.icon className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-mono text-sm uppercase tracking-widest text-foreground mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-20">
        <div className="container mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono mb-4">Pricing</p>
          <h3 className="text-3xl font-bold text-foreground mb-12">One plan. Full access.</h3>
          <div className="max-w-sm mx-auto border border-primary p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Vault Pro</p>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-5xl font-bold text-foreground">$9.99</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              {["Unlimited transactions", "Photo evidence capture", "Digital signatures", "CSV export", "Cloud-synced vault"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full bg-primary text-primary-foreground py-3 text-sm font-mono uppercase tracking-widest text-center hover:opacity-90 snap-transition"
            >
              Subscribe Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground font-mono">© 2026 Vault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
