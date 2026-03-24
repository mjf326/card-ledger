import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void;
  selected: Customer | null;
}

export default function CustomerSelector({ onSelect, selected }: CustomerSelectorProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("user_id", user.id)
        .order("name");
      if (data) setCustomers(data);
    };
    load();
  }, [user]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    const { data, error } = await supabase
      .from("customers")
      .insert({ user_id: user.id, name: newName.trim(), email: newEmail.trim() || null, phone: newPhone.trim() || null })
      .select("id, name, email, phone")
      .single();
    if (data && !error) {
      setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onSelect(data);
      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
    }
  };

  if (selected) {
    return (
      <button
        onClick={() => onSelect(null as any)}
        className="w-full flex items-center gap-3 p-3 border border-border bg-secondary/50 text-left snap-transition hover:bg-secondary"
      >
        <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-mono text-sm">
          {selected.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-foreground truncate">{selected.name}</div>
          {selected.email && <div className="text-[10px] text-muted-foreground truncate">{selected.email}</div>}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Change</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-transparent border-b border-border py-3 pl-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none snap-transition"
        />
      </div>

      {/* List */}
      <div className="max-h-40 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 snap-transition border-b border-border/50"
          >
            <div className="w-7 h-7 bg-muted flex items-center justify-center font-mono text-xs text-muted-foreground">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-mono text-sm text-foreground">{c.name}</span>
          </button>
        ))}
        {filtered.length === 0 && !showCreate && (
          <p className="text-xs text-muted-foreground py-3 text-center font-mono">No contacts found</p>
        )}
      </div>

      {/* Create New */}
      <AnimatePresence>
        {showCreate ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 border border-border p-3"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name *"
              className="w-full bg-transparent border-b border-border py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full bg-transparent border-b border-border py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full bg-transparent border-b border-border py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-wider">Save</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-border text-foreground font-mono text-xs uppercase tracking-wider">Cancel</button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground snap-transition"
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-wider">New Contact</span>
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
