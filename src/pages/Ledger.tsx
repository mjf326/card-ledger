import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Download } from "lucide-react";
import { useTransactions } from "@/context/TransactionContext";
import TransactionRow from "@/components/TransactionRow";
import TransactionDetail from "@/components/TransactionDetail";
import NewTransaction from "@/components/NewTransaction";
import { Transaction } from "@/context/TransactionContext";

type View = "ledger" | "new" | "detail";

export default function Ledger() {
  const { transactions, exportCSV } = useTransactions();
  const [view, setView] = useState<View>("ledger");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  if (view === "new") {
    return <NewTransaction onComplete={() => setView("ledger")} onBack={() => setView("ledger")} />;
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
          {transactions.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground snap-transition"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Export</span>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">Physical Assets. Immutable Proof.</p>
      </div>

      {/* Transactions */}
      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 px-4"
        >
          <p className="font-mono text-sm text-muted-foreground mb-2">NO TRANSACTIONS</p>
          <p className="text-xs text-muted-foreground text-center">Tap the button below to record your first trade.</p>
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
              transaction={tx}
              onClick={() => { setSelectedTx(tx); setView("detail"); }}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setView("new")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-foreground text-background flex items-center justify-center shadow-tight"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
