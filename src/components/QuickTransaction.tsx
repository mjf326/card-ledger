import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, DollarSign, Shield, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CardScanner from "@/components/CardScanner";
import CustomerSelector, { Customer } from "@/components/CustomerSelector";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import { toast } from "sonner";

type Step = "scan" | "edit" | "type" | "price" | "grading" | "person" | "sign" | "done";

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
  const buyerSigRef = useRef<SignaturePadRef>(null);
  const sellerSigRef = useRef<SignaturePadRef>(null);

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
  const [graded, setGraded] = useState(false);
  const [gradingCost, setGradingCost] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
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
    setTimeout(() => setStep("edit"), 300);
  };

  const handleTypeSelect = (type: "bought" | "sold") => {
    setTxType(type);
    setStep("price");
  };

  const handlePriceNext = () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid price");
    setStep("grading");
  };

  const handleGradingNext = () => {
    setStep("person");
  };

  const handlePersonNext = () => {
    if (!customer) return toast.error("Select or create a contact");
    setStep("sign");
  };

  const handleFinalize = async () => {
    if (!buyerSig) return toast.error("Buyer signature is required");
    if (!sellerSig) return toast.error("Seller signature is required");
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
        graded,
        grading_cost: gradingCost ? parseFloat(gradingCost) : null,
        customer_id: customer.id,
        customer_name: customer.name,
        amount: parseFloat(amount),
        transaction_date: new Date().toISOString().split("T")[0],
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
              cardName: cardName.trim() || "Unknown Card",
              cardSet: cardSet.trim() || null,
              amount: parseFloat(amount),
              txType,
              transactionCode: code,
              graded,
              gradingCost: gradingCost ? parseFloat(gradingCost) : null,
              date: new Date().toISOString().split("T")[0],
            },
          });
        } catch {
          // Don't block on email failure
        }
      }

      toast.success(`${txType === "bought" ? "Purchase" : "Sale"} recorded!`);
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const steps: Step[] = ["scan", "edit", "type", "price", "grading", "person", "sign"];
  const stepNumber = steps.indexOf(step) + 1;

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
            {steps.map((_, n) => (
              <div
                key={n}
                className={`h-1 flex-1 ${n < stepNumber ? "bg-foreground" : "bg-border"} snap-transition`}
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
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Step 1 — Scan Card</div>
              <CardScanner onCapture={handleCapture} />
            </motion.div>
          )}

          {/* STEP 2: Edit Card Details */}
          {step === "edit" && (
            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Step 2 — Verify & Edit Card Details
              </div>
              <div className="space-y-3">
                <EditField label="Card Name" value={cardName} onChange={setCardName} />
                <div className="flex gap-2">
                  <EditField label="Set" value={cardSet} onChange={setCardSet} />
                  <EditField label="#" value={cardNumber} onChange={setCardNumber} className="w-24" />
                </div>
                <div className="flex gap-2">
                  <EditField label="Rarity" value={rarity} onChange={setRarity} />
                  <EditField label="Type" value={cardType} onChange={setCardType} />
                </div>
                <div className="flex gap-2">
                  <EditField label="Condition" value={conditionVal} onChange={setConditionVal} />
                  <EditField label="Edition" value={edition} onChange={setEdition} />
                </div>
                <button onClick={() => setStep("type")}
                  className="w-full mt-3 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Bought or Sold */}
          {step === "type" && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Step 3 — Bought or Sold?</div>
              {cardName && (
                <div className="text-center mb-6">
                  <span className="font-mono text-lg text-foreground">{cardName}</span>
                  {cardSet && <span className="block text-xs text-muted-foreground mt-1">{cardSet} {cardNumber}</span>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleTypeSelect("bought")}
                  className="flex flex-col items-center gap-3 p-8 border border-border hover:bg-secondary/50 hover:border-foreground snap-transition active:scale-[0.98]">
                  <ShoppingCart className="w-8 h-8 text-foreground" />
                  <span className="font-mono text-sm uppercase tracking-wider">Bought</span>
                  <span className="text-[10px] text-muted-foreground">I purchased this card</span>
                </button>
                <button onClick={() => handleTypeSelect("sold")}
                  className="flex flex-col items-center gap-3 p-8 border border-border hover:bg-secondary/50 hover:border-foreground snap-transition active:scale-[0.98]">
                  <DollarSign className="w-8 h-8 text-foreground" />
                  <span className="font-mono text-sm uppercase tracking-wider">Sold</span>
                  <span className="text-[10px] text-muted-foreground">I sold this card</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Price */}
          {step === "price" && (
            <motion.div key="price" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Step 4 — Enter Price</div>
              <div className="flex items-center justify-center gap-2 py-8">
                <span className="font-mono text-4xl text-muted-foreground">$</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus
                  className="bg-transparent font-mono text-4xl text-foreground w-40 text-center focus:outline-none placeholder:text-muted-foreground/30" />
              </div>
              <button onClick={handlePriceNext}
                className="w-full py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 5: Grading */}
          {step === "grading" && (
            <motion.div key="grading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Step 5 — Grading Status</div>
              <div className="flex gap-4 mb-6">
                <button onClick={() => setGraded(false)}
                  className={`flex-1 flex flex-col items-center gap-3 p-6 border snap-transition active:scale-[0.98] ${!graded ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:bg-secondary/50"}`}>
                  <Shield className="w-8 h-8" />
                  <span className="font-mono text-sm uppercase tracking-wider">Raw</span>
                  <span className="text-[10px] opacity-70">Not graded</span>
                </button>
                <button onClick={() => setGraded(true)}
                  className={`flex-1 flex flex-col items-center gap-3 p-6 border snap-transition active:scale-[0.98] ${graded ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:bg-secondary/50"}`}>
                  <ShieldCheck className="w-8 h-8" />
                  <span className="font-mono text-sm uppercase tracking-wider">Graded</span>
                  <span className="text-[10px] opacity-70">Professionally graded</span>
                </button>
              </div>

              {graded && (
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Grading Cost</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl text-muted-foreground">$</span>
                    <input type="number" value={gradingCost} onChange={(e) => setGradingCost(e.target.value)} placeholder="0.00"
                      className="bg-transparent font-mono text-2xl text-foreground w-32 focus:outline-none placeholder:text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Estimated or actual cost of grading</p>
                </div>
              )}

              {!graded && (
                <div className="mb-6 p-3 border border-dashed border-border">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Estimated Grading Cost</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl text-muted-foreground">$</span>
                    <input type="number" value={gradingCost} onChange={(e) => setGradingCost(e.target.value)} placeholder="0.00"
                      className="bg-transparent font-mono text-2xl text-foreground w-32 focus:outline-none placeholder:text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Optional — rough estimate if you plan to grade</p>
                </div>
              )}

              <button onClick={handleGradingNext}
                className="w-full py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider active:scale-[0.98] snap-transition">
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 6: Select Person */}
          {step === "person" && (
            <motion.div key="person" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Step 6 — {txType === "bought" ? "Who did you buy from?" : "Who did you sell to?"}
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

          {/* STEP 7: Dual Signatures */}
          {step === "sign" && (
            <motion.div key="sign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Step 7 — Signatures Required</div>

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
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Graded</span>
                  <span className="text-foreground">{graded ? "Yes" : "No"}</span>
                </div>
                {gradingCost && (
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-muted-foreground">Grading Cost</span>
                    <span className="text-foreground">${parseFloat(gradingCost).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <SignaturePad ref={buyerSigRef} label="Buyer Signature" onSignatureChange={setBuyerSig} />
                <SignaturePad ref={sellerSigRef} label="Seller Signature" onSignatureChange={setSellerSig} />
              </div>

              <button
                onClick={handleFinalize}
                disabled={saving || !buyerSig || !sellerSig}
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

function EditField({ label, value, onChange, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      className={`flex-1 bg-transparent border-b border-border py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none ${className}`}
    />
  );
}
