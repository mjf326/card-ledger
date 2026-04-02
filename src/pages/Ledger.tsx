import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Download, BarChart3, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import TransactionRow from "@/components/TransactionRow";
import TransactionDetail from "@/components/TransactionDetail";
import NewTransaction from "@/components/NewTransaction";
import QuickTransaction from "@/components/QuickTransaction";
import { Transaction } from "@/context/TransactionContext";

type View = "ledger" | "new" | "quick" | "detail";

interface DbTransaction {
  id: string;
  transaction_code: string;
  type: string;
  card_name: string;
  card_set: string | null;
  card_number: string | null;
  card_image: string | null;
  customer_name: string;
  amount: number;
  transaction_date: string;
  buyer_signature: string | null;
  seller_signature: string | null;
  tx_hash: string | null;
  status: string;
  created_at: string;
}

function toDisplayTx(db: DbTransaction): Transaction {
  return {
    id: db.transaction_code,
    cardName: db.card_name,
    cardSet: db.card_set || "",
    cardNumber: db.card_number || "",
    cardImage: db.card_image,
    buyerName: db.type === "bought" ? "You" : db.customer_name,
    sellerName: db.type === "sold" ? "You" : db.customer_name,
    amount: Number(db.amount),
    buyerSignature: db.buyer_signature,
    sellerSignature: db.seller_signature,
    timestamp: db.created_at,
    txHash: db.tx_hash,
    status: db.status as "pending" | "verified",
  };
}

export default function Ledger({ onShowAnalytics }: { onShowAnalytics?: () => void }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [view, setView] = useState<View>("ledger");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { loadTransactions(); }, [user]);

  const exportCSV = () => {
    const headers = ["Code", "Type", "Card", "Set", "Number", "Customer", "Amount", "Date", "Status"];
    const rows = transactions.map(t => [
      t.transaction_code, t.type, t.card_name, t.card_set || "", t.card_number || "",
      t.customer_name, `$${Number(t.amount).toFixed(2)}`, t.transaction_date, t.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === "new") {
    return <NewTransaction onComplete={() => { setView("ledger"); loadTransactions(); }} onBack={() => setView("ledger")} />;
  }

  if (view === "quick") {
    return <QuickTransaction onComplete={() => { setView("ledger"); loadTransactions(); }} onBack={() => setView("ledger")} />;
  }

  if (view === "detail" && selectedTx) {
    return <TransactionDetail transaction={selectedTx} onBack={() => { setView("ledger"); setSelectedTx(null); }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-1">
          <h1 className="font-mono text-lg tracking-tighter font-medium text-foreground">VAULT</h1>
          <div className="flex items-center gap-3">
            {onShowAnalytics && (
              <button onClick={onShowAnalytics} className="text-muted-foreground hover:text-foreground snap-transition">
                <BarChart3 className="w-4 h-4" />
              </button>
            )}
            {transactions.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-2 text-muted-foreground hover:text-foreground snap-transition">
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Physical Assets. Immutable Proof.</p>
      </div>

      {/* Transactions */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="font-mono text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      ) : transactions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 px-4">
          <p className="font-mono text-sm text-muted-foreground mb-2">NO TRANSACTIONS</p>
          <p className="text-xs text-muted-foreground text-center">Tap Quick Trade below to record your first deal.</p>
        </motion.div>
      ) : (
        <div>
          <div className="px-4 py-2 border-b border-border">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {transactions.length} Record{transactions.length !== 1 ? "s" : ""}
            </span>
          </div>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={toDisplayTx(tx)}
              onClick={() => { setSelectedTx(toDisplayTx(tx)); setView("detail"); }}
            />
          ))}
        </div>
      )}

      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView("new")}
          className="w-12 h-12 bg-muted text-foreground flex items-center justify-center shadow-tight border border-border"
          title="Full Transaction"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView("quick")}
          className="w-14 h-14 bg-foreground text-background flex items-center justify-center shadow-tight"
          title="Quick Trade"
        >
          <Zap className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
