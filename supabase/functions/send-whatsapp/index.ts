// Supabase Edge Function: send-whatsapp
// Configurable WhatsApp notification service (Meta Cloud API / Twilio / Custom provider)
// Exposes zero API secrets to frontend.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "Missing appointmentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch appointment details
    const { data: apt, error } = await supabaseClient
      .from("appointments")
      .select("*, doctors(full_name), specialities(name)")
      .eq("id", appointmentId)
      .single();

    if (error || !apt) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = Deno.env.get("WHATSAPP_PROVIDER"); // e.g. 'meta', 'twilio'
    const apiUrl = Deno.env.get("WHATSAPP_API_URL");
    const apiToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const messageBody = 
`*RHYTHM MEDICITY*
*Appointment Confirmed*

📋 *Appointment No:* ${apt.appointment_number}
👤 *Patient:* ${apt.patient_name}
🩺 *Doctor:* ${apt.doctor_name_snapshot}
🏥 *Speciality:* ${apt.speciality_name_snapshot}
📅 *Date:* ${apt.appointment_date}
⏰ *Time:* ${apt.appointment_time}
💵 *Amount Paid:* ₹${apt.consultation_fee}
✅ *Status:* Confirmed & Paid

_Please arrive 15 minutes before your scheduled appointment time._
*Rhythm Medicity - One Stop Solution For Complete Care*`;

    // If real WhatsApp API credentials exist, dispatch via Meta Cloud API or provider
    if (apiToken && phoneNumberId) {
      const formattedPhone = apt.patient_mobile.replace(/\D/g, "");
      const recipientPhone = formattedPhone.startsWith("91") ? formattedPhone : `91${formattedPhone}`;

      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: messageBody },
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ status: "Failed", error: resData }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: "Sent", messageId: resData?.messages?.[0]?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Provider not configured - return honest fallback
    return new Response(
      JSON.stringify({
        status: "Fallback",
        message: "WhatsApp API credentials not configured in environment. Use client-side direct link.",
        text: messageBody,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
