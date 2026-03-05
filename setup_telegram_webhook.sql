-- Enable pg_net
create extension if not exists "pg_net" with schema extensions;

-- Create function to notify Telegram
create or replace function public.notify_telegram_on_appointment()
returns trigger
language plpgsql
security definer
as $$
declare
  v_bearer_token text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2dhZWZic3ZxZWJqa2VqYnhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxODM3MywiZXhwIjoyMDg4Mjk0MzczfQ.IK26ljRdYH2iAS7Bvvlscn9Gk_osnQ1t3uaxvtV46q0'; -- Service role key
  v_webhook_url text := 'https://bmsgaefbsvqebjkejbxe.supabase.co/functions/v1/telegram-notify';
begin
  perform net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_bearer_token
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'appointments',
      'schema', 'public',
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$;

-- Connect trigger
drop trigger if exists on_appointment_inserted on public.appointments;
create trigger on_appointment_inserted
  after insert on public.appointments
  for each row
  execute function public.notify_telegram_on_appointment();
