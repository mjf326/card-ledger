
-- Fix search_path for the content hash function
CREATE OR REPLACE FUNCTION public.compute_content_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  NEW.tx_hash := '0x' || NEW.content_hash;
  RETURN NEW;
END;
$$;
