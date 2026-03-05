import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    // 1. Get the JSON body from the POST request
    const payload = await req.json();
    
    // 2. Extract the 'record' object (inserted row from PostgreSQL)
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record found in payload. Ensure this is triggered by a Supabase Webhook." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Destructure the exact fields from the record
    const { name, mobile_number, service_required, preferred_date } = record;

    // 4. Create the URL-encoded message formatted string
    const rawMessage = `New Lead Received! 🚀\nName: ${name || 'N/A'}\nMobile: ${mobile_number || 'N/A'}\nService: ${service_required || 'N/A'}\nDate: ${preferred_date || 'N/A'}`;
    const encodedMessage = encodeURIComponent(rawMessage);

    // 5. Fetch environment variables securely
    const callmebotPhone = Deno.env.get("CALLMEBOT_PHONE");
    const callmebotApiKey = Deno.env.get("CALLMEBOT_API_KEY");

    if (!callmebotPhone || !callmebotApiKey) {
      console.error("Missing CALLMEBOT_PHONE or CALLMEBOT_API_KEY environment variables.");
      return new Response(JSON.stringify({ error: "Server Configuration Error" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
       });
    }

    // 6. Make GET request to CallMeBot API
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${callmebotPhone}&text=${encodedMessage}&apikey=${callmebotApiKey}`;
    
    console.log("Sending WhatsApp notification to", callmebotPhone);
    const response = await fetch(apiUrl);

    // 7. Standard Error Handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CallMeBot API Error (Status: ${response.status}):`, errorText);
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp message through CallMeBot API." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Success
    console.log("WhatsApp notification sent successfully!");
    return new Response(JSON.stringify({ success: true, message: "WhatsApp notification sent successfully!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing edge function request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
});
