-- Ensure pgcrypto is installed in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate function with extensions in search_path so digest() resolves
CREATE OR REPLACE FUNCTION public.compute_content_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  NEW.content_hash := encode(
    extensions.digest(
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
$function$;

-- Attach the trigger if missing
DROP TRIGGER IF EXISTS compute_content_hash_trigger ON public.transactions;
CREATE TRIGGER compute_content_hash_trigger
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.compute_content_hash();