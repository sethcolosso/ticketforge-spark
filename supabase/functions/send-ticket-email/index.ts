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

    // Format ticket details
    const ticketLines = tickets.map((t: any) => `${t.quantity}x ${t.name} - $${(t.price * t.quantity).toFixed(2)}`).join('\n');
    
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    // Log the email content (in production, integrate with an email service)
    console.log(`
      === TICKET CONFIRMATION EMAIL ===
      To: ${userEmail}
      Subject: Your URBANPUNK Tickets - ${eventTitle}
      
      Hey there! 🎟️
      
      Your tickets have been confirmed!
      
      Event: ${eventTitle}
      Date: ${formattedDate}
      Venue: ${eventVenue}
      
      Tickets:
      ${ticketLines}
      
      Total: $${total.toFixed(2)}
      Order ID: ${orderId}
      
      See you there!
      — URBANPUNK Team
      ================================
    `);

    return new Response(
      JSON.stringify({ success: true, message: 'Confirmation logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
