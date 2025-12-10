// @ts-nocheck
// Deno (Supabase Edge Function)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { booking_id } = await req.json();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('transport_bookings')
    .select('id, pickup_location, pickup_time, driver_profiles ( expo_push_token, full_name )')
    .eq('id', booking_id)
    .single();

  if (error || !data?.driver_profiles?.expo_push_token) {
    console.error('Booking/driver not found', error);
    return new Response('No token', { status: 200 });
  }

  const token = data.driver_profiles.expo_push_token as string;

  const message = {
    to: token,
    sound: 'default',
    title: 'New ride assigned',
    body: `${data.pickup_location ?? 'Pickup'} at ${data.pickup_time ?? ''}`,
    data: { booking_id },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  return new Response('ok', { status: 200 });
});
