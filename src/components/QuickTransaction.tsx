import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, DollarSign, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CardScanner from "@/components/CardScanner";
import CustomerSelector, { Customer } from "@/components/CustomerSelector";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import { toast } from "sonner";

type Step = "scan" | "type" | "price" | "person" | "sign" | "done";

interface QuickTransactionProps {
  onComplete: () => void;
  onBack: () => void;
}

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

export default function QuickTransaction({ onComplete, onBack }: QuickTransactionProps) {
  const { user } = useAuth();
  const sigRef = useRef<SignaturePadRef>(null);

  const [step, setStep] = useState<Step>("scan");
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [rarity, setRarity] = useState("");
  const [cardType, setCardType] = useState("");
  const [conditionVal, setConditionVal] = useState("");
  const [edition, setEdition] = useState("");
  const [txType, setTxType] = useState<"bought" | "sold" | null>(null);
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
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
    // Auto-advance to type selection once card is scanned
    setTimeout(() => setStep("type"), 300);
  };

  const handleTypeSelect = (type: "bought" | "sold") => {
    setTxType(type);
    setStep("price");
  };

  const handlePriceNext = () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid price");
    setStep("person");
  };

  const handlePersonNext = () => {
    if (!customer) return toast.error("Select or create a contact");
    setStep("sign");
  };

  const handleFinalize = async () => {
    if (!signature) return toast.error("Signature is required");
    if (!user || !txType || !customer) return;

    setSaving(true);
    try {
      const code = `TXN_${String(Date.now()).slice(-6)}_${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        transaction_code: code,
        type: txType,
        card_name: cardName.trim() || "Unknown Card",
        card_set: cardSet.trim() || null,
        card_number: cardNumber.trim() || null,
        card_image: cardImage,
        rarity: rarity || null,
        card_type: cardType || null,
        condition: conditionVal || null,
        edition: edition || null,
        customer_id: customer.id,
        customer_name: customer.name,
        amount: parseFloat(amount),
        transaction_date: new Date().toISOString().split("T")[0],
        buyer_signature: txType === "bought" ? signature : null,
        seller_signature: txType === "sold" ? signature : null,
        tx_hash: generateHash(),
        status: "verified",
      });

      if (error) throw error;
      toast.success(`${txType === "bought" ? "Purchase" : "Sale"} recorded!`);
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels: Record<Step, string> = {
    scan: "Scan Card",
    type: "Bought or Sold?",
    price: "Enter Price",
    person: "Select Contact",
    sign: "Sign to Confirm",
    done: "Done",
  };

  const stepNumber = ["scan", "type", "price", "person", "sign"].indexOf(step) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-4">
        <button
          onClick={step === "scan" ? onBack : () => {
            const steps: Step[] = ["scan", "type", "price", "person", "sign"];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}
          className="text-muted-foreground hover:text-foreground snap-transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Quick Transaction
          </span>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 ${n <= stepNumber ? "bg-foreground" : "bg-border"} snap-transition`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* STEP 1: Scan */}
          {step === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Step 1 — {stepLabels.scan}</div>
              <CardScanner onCapture={handleCapture} />
              {cardName && (
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Detected <span className="text-primary">• tap to edit</span>
                  </div>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-transparent border-b border-border py-2 font-mono text-sm text-foreground focus:border-foreground focus:outline-none" />
                  <div className="flex gap-2">
                    <input value={cardSet} onChange={(e) => setCardSet(e.target.value)} placeholder="Set"
                      className="flex-1 bg-transparent border-b border-border py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none" />
                    <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="#"
                      className="w-20 bg-transparent border-b border-border py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none" />
                  </div>
                  <button onClick={() => setStep("type")}
                    className="w-full mt-3 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                    Continue
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Bought or Sold */}
          {step === "type" && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Step 2 — {stepLabels.type}</div>
              {cardName && (
                <div className="text-center mb-6">
                  <span className="font-mono text-lg text-foreground">{cardName}</span>
                  {cardSet && <span className="block text-xs text-muted-foreground mt-1">{cardSet} {cardNumber}</span>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTypeSelect("bought")}
                  className="flex flex-col items-center gap-3 p-8 border border-border hover:bg-secondary/50 hover:border-foreground snap-transition active:scale-[0.98]"
                >
                  <ShoppingCart className="w-8 h-8 text-foreground" />
                  <span className="font-mono text-sm uppercase tracking-wider">Bought</span>
                  <span className="text-[10px] text-muted-foreground">I purchased this card</span>
                </button>
                <button
                  onClick={() => handleTypeSelect("sold")}
                  className="flex flex-col items-center gap-3 p-8 border border-border hover:bg-secondary/50 hover:border-foreground snap-transition active:scale-[0.98]"
                >
                  <DollarSign className="w-8 h-8 text-foreground" />
                  <span className="font-mono text-sm uppercase tracking-wider">Sold</span>
                  <span className="text-[10px] text-muted-foreground">I sold this card</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Price */}
          {step === "price" && (
            <motion.div key="price" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Step 3 — {stepLabels.price}</div>
              <div className="flex items-center justify-center gap-2 py-8">
                <span className="font-mono text-4xl text-muted-foreground">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="bg-transparent font-mono text-4xl text-foreground w-40 text-center focus:outline-none placeholder:text-muted-foreground/30"
                />
              </div>
              <button onClick={handlePriceNext}
                className="w-full py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 4: Select Person */}
          {step === "person" && (
            <motion.div key="person" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Step 4 — {txType === "bought" ? "Who did you buy from?" : "Who did you sell to?"}
              </div>
              <CustomerSelector onSelect={setCustomer} selected={customer} />
              {customer && (
                <button onClick={handlePersonNext}
                  className="w-full mt-4 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                  Continue
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 5: Sign */}
          {step === "sign" && (
            <motion.div key="sign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Step 5 — {stepLabels.sign}</div>

              {/* Summary */}
              <div className="mb-4 p-3 border border-border space-y-1">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">{txType === "bought" ? "Bought" : "Sold"}</span>
                  <span className="text-foreground">{cardName}</span>
                </div>
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground">${parseFloat(amount || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">{txType === "bought" ? "From" : "To"}</span>
                  <span className="text-foreground">{customer?.name}</span>
                </div>
              </div>

              <SignaturePad ref={sigRef} label="Sign to confirm" onSignatureChange={setSignature} />

              <button
                onClick={handleFinalize}
                disabled={saving || !signature}
                className="w-full mt-4 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Finalize"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
