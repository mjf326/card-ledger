
-- Enable pgcrypto for SHA-256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Merkle batches table to track anchored roots
CREATE TABLE public.merkle_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merkle_root text NOT NULL,
  transaction_count integer NOT NULL,
  tx_ids uuid[] NOT NULL,
  polygon_tx_hash text,
  polygon_block_number bigint,
  chain text NOT NULL DEFAULT 'polygon',
  status text NOT NULL DEFAULT 'pending',
  anchored_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.merkle_batches ENABLE ROW LEVEL SECURITY;

-- Anyone can read batches for verification purposes
CREATE POLICY "Public read access for verification"
  ON public.merkle_batches
  FOR SELECT
  TO authenticated
  USING (true);

-- Add content_hash and merkle_batch_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS merkle_batch_id uuid REFERENCES public.merkle_batches(id),
  ADD COLUMN IF NOT EXISTS merkle_proof jsonb;

-- Function to compute SHA-256 content hash from transaction data
CREATE OR REPLACE FUNCTION public.compute_content_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content_hash := encode(
    digest(
      concat(
        NEW.user_id::text,
        NEW.card_name,
        COALESCE(NEW.card_set, ''),
        COALESCE(NEW.card_number, ''),
        NEW.type,
        NEW.customer_name,
        NEW.amount::text,
        NEW.transaction_date::text,
        NEW.transaction_code,
        NEW.created_at::text
      ),
      'sha256'
    ),
    'hex'
  );
  -- Also set tx_hash to the content hash (replacing the random one)
  NEW.tx_hash := '0x' || NEW.content_hash;
  RETURN NEW;
END;
$$;

-- Trigger to auto-compute content hash on insert
CREATE TRIGGER compute_content_hash_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_content_hash();
