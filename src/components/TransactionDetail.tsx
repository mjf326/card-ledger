import { motion } from "framer-motion";
import { Transaction } from "@/context/TransactionContext";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";

interface TransactionDetailProps {
  transaction: Transaction;
  onBack: () => void;
}

export default function TransactionDetail({ transaction, onBack }: TransactionDetailProps) {
  const copyHash = () => {
    if (transaction.txHash) {
      navigator.clipboard.writeText(transaction.txHash);
      toast.success("Hash copied to clipboard");
    }
  };

  const rows = [
    ["CARD", transaction.cardName],
    ["SET", transaction.cardSet],
    ["NUMBER", transaction.cardNumber],
    ["BUYER", transaction.buyerName],
    ["SELLER", transaction.sellerName],
    ["AMOUNT", `$${transaction.amount.toFixed(2)}`],
    ["DATE", new Date(transaction.timestamp).toLocaleDateString()],
    ["TIME", new Date(transaction.timestamp).toLocaleTimeString()],
    ["STATUS", transaction.status.toUpperCase()],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-background"
    >
      <div className="p-4 border-b border-border flex items-center gap-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground snap-transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {transaction.id}
        </span>
      </div>

      {transaction.cardImage && (
        <div className="p-4">
          <img src={transaction.cardImage} alt={transaction.cardName} className="w-full aspect-[2.5/3.5] object-cover bg-secondary" />
        </div>
      )}

      <div className="px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-border py-3 font-mono text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`text-foreground ${label === "AMOUNT" ? "tabular" : ""} ${label === "STATUS" && transaction.status === "verified" ? "text-primary" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {transaction.txHash && (
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Transaction Hash</div>
          <button
            onClick={copyHash}
            className="flex items-center gap-2 px-3 py-2 bg-secondary font-mono text-xs text-foreground hover:bg-muted snap-transition"
          >
            <span>{transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-4)}</span>
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {transaction.buyerSignature && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Buyer Signature</div>
            <div className="border border-dashed border-border p-2 bg-secondary/50">
              <img src={transaction.buyerSignature} alt="Buyer signature" className="h-24 w-full object-contain" />
            </div>
          </div>
        )}
        {transaction.sellerSignature && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Seller Signature</div>
            <div className="border border-dashed border-border p-2 bg-secondary/50">
              <img src={transaction.sellerSignature} alt="Seller signature" className="h-24 w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
