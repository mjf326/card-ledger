import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Transaction {
  id: string;
  cardName: string;
  cardSet: string;
  cardNumber: string;
  cardImage: string | null;
  buyerName: string;
  sellerName: string;
  amount: number;
  buyerSignature: string | null;
  sellerSignature: string | null;
  timestamp: string;
  txHash: string | null;
  status: "pending" | "verified";
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp" | "txHash" | "status">) => Transaction;
  exportCSV: () => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export const useTransactions = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
};

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("vault_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const persist = (txs: Transaction[]) => {
    localStorage.setItem("vault_transactions", JSON.stringify(txs));
    setTransactions(txs);
  };

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "timestamp" | "txHash" | "status">) => {
    const newTx: Transaction = {
      ...tx,
      id: `TXN_${String(Date.now()).slice(-6)}_${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`,
      timestamp: new Date().toISOString(),
      txHash: generateHash(),
      status: "verified",
    };
    const updated = [newTx, ...transactions];
    persist(updated);
    return newTx;
  }, [transactions]);

  const exportCSV = useCallback(() => {
    const headers = ["ID", "Card", "Set", "Number", "Buyer", "Seller", "Amount", "Date", "TX Hash", "Status"];
    const rows = transactions.map(t => [
      t.id, t.cardName, t.cardSet, t.cardNumber, t.buyerName, t.sellerName,
      `$${t.amount.toFixed(2)}`, new Date(t.timestamp).toLocaleDateString(),
      t.txHash?.slice(0, 10) + "..." + t.txHash?.slice(-4), t.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, exportCSV }}>
      {children}
    </TransactionContext.Provider>
  );
}
