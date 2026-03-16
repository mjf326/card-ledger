import { useAuth } from "@/context/AuthContext";
import { TransactionProvider } from "@/context/TransactionContext";
import Ledger from "@/pages/Ledger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, CreditCard } from "lucide-react";

export default function Dashboard() {
  const { user, subscription, signOut, checkSubscription } = useAuth();

  const handleCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Not subscribed — show paywall
  if (!subscription.subscribed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <h1 className="font-mono text-lg tracking-tighter font-bold text-foreground mb-2">CARDVAULT</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
          Subscribe to CardVault Pro to access your vault. $9.99/month — full access to all features.
        </p>
        <button
          onClick={handleCheckout}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-sm font-mono uppercase tracking-widest hover:opacity-90 snap-transition"
        >
          <CreditCard className="w-4 h-4" /> Subscribe — $9.99/mo
        </button>
        <button
          onClick={checkSubscription}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground snap-transition"
        >
          Already subscribed? Refresh status
        </button>
        <button
          onClick={signOut}
          className="mt-6 text-xs text-muted-foreground hover:text-destructive snap-transition"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Subscribed — show app
  return (
    <TransactionProvider>
      <div className="relative">
        {/* Top bar with account actions */}
        <div className="absolute top-0 right-0 p-4 flex items-center gap-3 z-10">
          <button
            onClick={handleManageSubscription}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground snap-transition"
          >
            Manage Plan
          </button>
          <button onClick={signOut} className="text-muted-foreground hover:text-destructive snap-transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <Ledger />
      </div>
    </TransactionProvider>
  );
}
