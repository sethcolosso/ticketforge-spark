import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, userEmail, eventTitle, eventDate, eventVenue, tickets, total } = await req.json();

    const ticketLines = tickets.map((t: { quantity: number; name: string; price: number }) => 
      `${t.quantity}x ${t.name} - $${(t.price * t.quantity).toFixed(2)}`
    ).join('\n');
    
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    console.log(`
      === TICKET CONFIRMATION EMAIL ===
      To: ${userEmail}
      Subject: Your URBANPUNK Tickets - ${eventTitle}
      
      Event: ${eventTitle}
      Date: ${formattedDate}
      Venue: ${eventVenue}
      
      Tickets:
      ${ticketLines}
      
      Total: $${total.toFixed(2)}
      Order ID: ${orderId}
      
      — URBANPUNK Team
      ================================
    `);

    return new Response(
      JSON.stringify({ success: true, message: 'Confirmation logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
