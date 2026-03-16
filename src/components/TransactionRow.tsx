import { motion } from "framer-motion";
import { Transaction } from "@/context/TransactionContext";

interface TransactionRowProps {
  transaction: Transaction;
  onClick: () => void;
}

export default function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="w-full text-left border-b border-border p-4 hover:bg-secondary/50 snap-transition"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm tracking-tighter font-medium text-foreground">
          {transaction.cardName}
        </span>
        <span className="font-mono text-sm tabular text-foreground">
          ${transaction.amount.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {transaction.id}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono ${
          transaction.status === "verified" ? "text-primary" : "text-accent"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            transaction.status === "verified" ? "bg-primary" : "bg-accent"
          }`} />
          {transaction.status === "verified" ? "Verified" : "Pending"}
        </span>
      </div>
    </motion.button>
  );
}
