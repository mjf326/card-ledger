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

  // TODO: Re-enable subscription paywall before launch
  // if (!subscription.subscribed) { ... }

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
