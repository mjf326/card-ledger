-- Customers table: reusable buyer/seller profiles
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_code text NOT NULL,
  type text NOT NULL CHECK (type IN ('bought', 'sold')),
  card_name text NOT NULL,
  card_set text,
  card_number text,
  card_image text,
  rarity text,
  card_type text,
  condition text,
  edition text,
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_signature text,
  seller_signature text,
  receipt_image text,
  tx_hash text,
  status text NOT NULL DEFAULT 'verified',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);