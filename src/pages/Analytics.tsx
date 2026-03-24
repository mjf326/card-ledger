import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CustomerStat {
  id: string;
  name: string;
  totalBought: number;
  totalSold: number;
  txCount: number;
}

interface AnalyticsData {
  totalBought: number;
  totalSold: number;
  totalTransactions: number;
  totalCustomers: number;
  recentTransactions: any[];
  customerStats: CustomerStat[];
}

export default function Analytics({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [txRes, custRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name").eq("user_id", user.id),
      ]);

      const txs = txRes.data || [];
      const custs = custRes.data || [];

      const totalBought = txs.filter((t) => t.type === "bought").reduce((s, t) => s + Number(t.amount), 0);
      const totalSold = txs.filter((t) => t.type === "sold").reduce((s, t) => s + Number(t.amount), 0);

      const custMap = new Map<string, CustomerStat>();
      custs.forEach((c) => custMap.set(c.id, { id: c.id, name: c.name, totalBought: 0, totalSold: 0, txCount: 0 }));

      txs.forEach((tx) => {
        if (tx.customer_id && custMap.has(tx.customer_id)) {
          const stat = custMap.get(tx.customer_id)!;
          stat.txCount++;
          if (tx.type === "bought") stat.totalBought += Number(tx.amount);
          if (tx.type === "sold") stat.totalSold += Number(tx.amount);
        }
      });

      const customerStats = Array.from(custMap.values())
        .filter((c) => c.txCount > 0)
        .sort((a, b) => b.txCount - a.txCount);

      setData({
        totalBought,
        totalSold,
        totalTransactions: txs.length,
        totalCustomers: custs.length,
        recentTransactions: txs.slice(0, 10),
        customerStats,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <div className="p-4 border-b border-border flex items-center gap-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground snap-transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Analytics</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="font-mono text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      ) : data ? (
        <div className="p-4 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Total Spent" value={`$${data.totalBought.toFixed(2)}`} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Total Earned" value={`$${data.totalSold.toFixed(2)}`} />
            <StatCard icon={<Package className="w-4 h-4" />} label="Transactions" value={String(data.totalTransactions)} />
            <StatCard icon={<Users className="w-4 h-4" />} label="Contacts" value={String(data.totalCustomers)} />
          </div>

          {/* Net P/L */}
          <div className="border border-border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Net Profit / Loss</div>
            <div className={`font-mono text-2xl ${data.totalSold - data.totalBought >= 0 ? "text-primary" : "text-destructive"}`}>
              {data.totalSold - data.totalBought >= 0 ? "+" : ""}${(data.totalSold - data.totalBought).toFixed(2)}
            </div>
          </div>

          {/* Customer Breakdown */}
          {data.customerStats.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Contact Breakdown</div>
              <div className="space-y-1">
                {data.customerStats.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-muted flex items-center justify-center font-mono text-xs text-muted-foreground">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-foreground">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{c.txCount} transaction{c.txCount !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {c.totalBought > 0 && <div className="font-mono text-xs text-muted-foreground">Bought: ${c.totalBought.toFixed(2)}</div>}
                      {c.totalSold > 0 && <div className="font-mono text-xs text-primary">Sold: ${c.totalSold.toFixed(2)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {data.recentTransactions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Recent Activity</div>
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 border-b border-border/50">
                  <div>
                    <div className="font-mono text-sm text-foreground">{tx.card_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {tx.type === "bought" ? "Bought from" : "Sold to"} {tx.customer_name} • {new Date(tx.transaction_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`font-mono text-sm ${tx.type === "sold" ? "text-primary" : "text-foreground"}`}>
                    {tx.type === "bought" ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <div className="font-mono text-lg text-foreground">{value}</div>
    </div>
  );
}
