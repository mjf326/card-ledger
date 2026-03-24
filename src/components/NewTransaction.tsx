import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useTransactions } from "@/context/TransactionContext";
import CardScanner from "@/components/CardScanner";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import { toast } from "sonner";

interface NewTransactionProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function NewTransaction({ onComplete, onBack }: NewTransactionProps) {
  const { addTransaction } = useTransactions();
  const buyerSigRef = useRef<SignaturePadRef>(null);
  const sellerSigRef = useRef<SignaturePadRef>(null);

  const [cardImage, setCardImage] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [rarity, setRarity] = useState("");
  const [cardType, setCardType] = useState("");
  const [condition, setCondition] = useState("");
  const [edition, setEdition] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerSig, setBuyerSig] = useState<string | null>(null);
  const [sellerSig, setSellerSig] = useState<string | null>(null);

  const handleCapture = (imageData: string, info: { name: string; set: string; number: string; rarity?: string; cardType?: string; condition?: string; edition?: string }) => {
    setCardImage(imageData);
    if (info.name) setCardName(info.name);
    if (info.set) setCardSet(info.set);
    if (info.number) setCardNumber(info.number);
    if (info.rarity) setRarity(info.rarity);
    if (info.cardType) setCardType(info.cardType);
    if (info.condition) setCondition(info.condition);
    if (info.edition) setEdition(info.edition);
  };

  const handleFinalize = () => {
    if (!cardName.trim()) return toast.error("Card name is required");
    if (!buyerName.trim()) return toast.error("Buyer name is required");
    if (!sellerName.trim()) return toast.error("Seller name is required");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Valid amount is required");
    if (!buyerSig) return toast.error("Buyer signature is required");
    if (!sellerSig) return toast.error("Seller signature is required");

    addTransaction({
      cardName: cardName.trim(),
      cardSet: cardSet.trim(),
      cardNumber: cardNumber.trim(),
      cardImage,
      buyerName: buyerName.trim(),
      sellerName: sellerName.trim(),
      amount: parseFloat(amount),
      buyerSignature: buyerSig,
      sellerSignature: sellerSig,
    });

    toast.success("Transaction finalized and verified on-chain");
    onComplete();
  };

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
          New Transaction
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* Card Scanner */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Card Image</div>
          <CardScanner onCapture={handleCapture} />
        </div>

        {/* Card Info — AI populated, manually editable */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Card Details
            <span className="ml-2 text-primary normal-case">AI-populated • edit if incorrect</span>
          </div>
          <InputField label="Card Name" value={cardName} onChange={setCardName} />
          <InputField label="Set / Expansion" value={cardSet} onChange={setCardSet} />
          <InputField label="Card Number" value={cardNumber} onChange={setCardNumber} />
          <InputField label="Rarity" value={rarity} onChange={setRarity} />
          <InputField label="Card Type (Pokemon, Yu-Gi-Oh, etc)" value={cardType} onChange={setCardType} />
          <InputField label="Condition" value={condition} onChange={setCondition} />
          <InputField label="Edition" value={edition} onChange={setEdition} />
        </div>

        {/* Transaction Details */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Transaction Details</div>
          <InputField label="Buyer Name" value={buyerName} onChange={setBuyerName} />
          <InputField label="Seller Name" value={sellerName} onChange={setSellerName} />
          <InputField label="Amount ($)" value={amount} onChange={setAmount} type="number" />
          <div className="relative">
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full bg-transparent border-b border-border py-3 font-mono text-sm text-foreground focus:border-foreground focus:outline-none snap-transition"
            />
            <label className="absolute left-0 -top-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              Transaction Date
            </label>
          </div>
        </div>

        {/* Signatures */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signatures</div>
          <SignaturePad ref={buyerSigRef} label="Buyer Signature Required" onSignatureChange={setBuyerSig} />
          <SignaturePad ref={sellerSigRef} label="Seller Signature Required" onSignatureChange={setSellerSig} />
        </div>

        {/* Finalize */}
        <button
          onClick={handleFinalize}
          className="w-full py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition"
        >
          Finalize Transaction
        </button>

        <div className="pb-8" />
      </div>
    </motion.div>
  );
}

function InputField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full bg-transparent border-b border-border py-3 font-mono text-sm text-foreground placeholder-transparent focus:border-foreground focus:outline-none snap-transition"
        autoComplete="off"
        autoCorrect="off"
      />
      <label className="absolute left-0 top-3 text-xs text-muted-foreground snap-transition peer-focus:-translate-y-5 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:text-[10px] uppercase tracking-wider">
        {label}
      </label>
    </div>
  );
}
