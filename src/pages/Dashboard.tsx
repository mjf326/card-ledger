import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransactionProvider } from "@/context/TransactionContext";
import Ledger from "@/pages/Ledger";
import Analytics from "@/pages/Analytics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, subscription, signOut } = useAuth();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (showAnalytics) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 p-4 flex items-center gap-3 z-10">
          <button onClick={signOut} className="text-muted-foreground hover:text-destructive snap-transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <Analytics onBack={() => setShowAnalytics(false)} />
      </div>
    );
  }

  return (
    <TransactionProvider>
      <div className="relative">
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
        <Ledger onShowAnalytics={() => setShowAnalytics(true)} />
      </div>
    </TransactionProvider>
  );
}
