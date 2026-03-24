import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CardScanner from "@/components/CardScanner";
import CustomerSelector, { Customer } from "@/components/CustomerSelector";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import { toast } from "sonner";

interface NewTransactionProps {
  onComplete: () => void;
  onBack: () => void;
}

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

export default function NewTransaction({ onComplete, onBack }: NewTransactionProps) {
  const { user } = useAuth();
  const buyerSigRef = useRef<SignaturePadRef>(null);
  const sellerSigRef = useRef<SignaturePadRef>(null);

  const [cardImage, setCardImage] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [rarity, setRarity] = useState("");
  const [cardType, setCardType] = useState("");
  const [conditionVal, setConditionVal] = useState("");
  const [edition, setEdition] = useState("");
  const [txType, setTxType] = useState<"bought" | "sold">("bought");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [graded, setGraded] = useState(false);
  const [gradingCost, setGradingCost] = useState("");
  const [buyerSig, setBuyerSig] = useState<string | null>(null);
  const [sellerSig, setSellerSig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCapture = (imageData: string, info: any) => {
    setCardImage(imageData);
    if (info.name) setCardName(info.name);
    if (info.set) setCardSet(info.set);
    if (info.number) setCardNumber(info.number);
    if (info.rarity) setRarity(info.rarity);
    if (info.cardType) setCardType(info.cardType);
    if (info.condition) setConditionVal(info.condition);
    if (info.edition) setEdition(info.edition);
  };

  const handleFinalize = async () => {
    if (!cardName.trim()) return toast.error("Card name is required");
    if (!customer) return toast.error("Select a contact");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Valid amount is required");
    if (!buyerSig) return toast.error("Buyer signature is required");
    if (!sellerSig) return toast.error("Seller signature is required");
    if (!user) return;

    setSaving(true);
    try {
      const code = `TXN_${String(Date.now()).slice(-6)}_${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        transaction_code: code,
        type: txType,
        card_name: cardName.trim(),
        card_set: cardSet.trim() || null,
        card_number: cardNumber.trim() || null,
        card_image: cardImage,
        rarity: rarity || null,
        card_type: cardType || null,
        condition: conditionVal || null,
        edition: edition || null,
        graded,
        grading_cost: gradingCost ? parseFloat(gradingCost) : null,
        customer_id: customer.id,
        customer_name: customer.name,
        amount: parseFloat(amount),
        transaction_date: transactionDate,
        buyer_signature: buyerSig,
        seller_signature: sellerSig,
        tx_hash: generateHash(),
        status: "verified",
      });

      if (error) throw error;

      // Send receipt email to customer if they have an email
      if (customer.email) {
        try {
          await supabase.functions.invoke("send-receipt", {
            body: {
              recipientEmail: customer.email,
              recipientName: customer.name,
              cardName: cardName.trim(),
              cardSet: cardSet.trim() || null,
              amount: parseFloat(amount),
              txType,
              transactionCode: code,
              graded,
              gradingCost: gradingCost ? parseFloat(gradingCost) : null,
              date: transactionDate,
            },
          });
        } catch {
          // Don't block on email failure
        }
      }

      toast.success("Transaction finalized and verified");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
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
          Full Transaction
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* Card Scanner */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Card Image</div>
          <CardScanner onCapture={handleCapture} />
        </div>

        {/* Card Info — editable after scan */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Card Details
            <span className="ml-2 text-primary normal-case">AI-populated • edit if incorrect</span>
          </div>
          <InputField label="Card Name" value={cardName} onChange={setCardName} />
          <InputField label="Set / Expansion" value={cardSet} onChange={setCardSet} />
          <InputField label="Card Number" value={cardNumber} onChange={setCardNumber} />
          <InputField label="Rarity" value={rarity} onChange={setRarity} />
          <InputField label="Card Type" value={cardType} onChange={setCardType} />
          <InputField label="Condition" value={conditionVal} onChange={setConditionVal} />
          <InputField label="Edition" value={edition} onChange={setEdition} />
        </div>

        {/* Grading Status */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Grading Status</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setGraded(false)}
              className={`flex items-center justify-center gap-2 py-3 font-mono text-sm uppercase tracking-wider border snap-transition ${!graded ? "bg-foreground text-background border-foreground" : "border-border text-foreground"}`}
            >
              <Shield className="w-4 h-4" />
              Raw
            </button>
            <button
              onClick={() => setGraded(true)}
              className={`flex items-center justify-center gap-2 py-3 font-mono text-sm uppercase tracking-wider border snap-transition ${graded ? "bg-foreground text-background border-foreground" : "border-border text-foreground"}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Graded
            </button>
          </div>
          <InputField
            label={graded ? "Grading Cost ($)" : "Estimated Grading Cost ($)"}
            value={gradingCost}
            onChange={setGradingCost}
            type="number"
          />
        </div>

        {/* Transaction Type */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Transaction Type</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTxType("bought")}
              className={`py-3 font-mono text-sm uppercase tracking-wider border snap-transition ${txType === "bought" ? "bg-foreground text-background border-foreground" : "border-border text-foreground"}`}
            >Bought</button>
            <button
              onClick={() => setTxType("sold")}
              className={`py-3 font-mono text-sm uppercase tracking-wider border snap-transition ${txType === "sold" ? "bg-foreground text-background border-foreground" : "border-border text-foreground"}`}
            >Sold</button>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {txType === "bought" ? "Bought From" : "Sold To"}
          </div>
          <CustomerSelector onSelect={setCustomer} selected={customer} />
        </div>

        {/* Amount & Date */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Transaction Details</div>
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
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signatures (Both Required)</div>
          <SignaturePad ref={buyerSigRef} label="Buyer Signature Required" onSignatureChange={setBuyerSig} />
          <SignaturePad ref={sellerSigRef} label="Seller Signature Required" onSignatureChange={setSellerSig} />
        </div>

        {/* Finalize */}
        <button
          onClick={handleFinalize}
          disabled={saving}
          className="w-full py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Finalize Transaction"}
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
