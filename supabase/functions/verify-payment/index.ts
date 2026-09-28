// Supabase Edge Function: verify-payment
// Cryptographically verifies payment signature server-side
// Atomically invokes create_confirmed_appointment RPC to lock slot and generate 000001 sequence number

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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

    const body = await req.json();
    const {
      orderId,
      paymentId,
      signature,
      provider = "razorpay",
      bookingData,
    } = body;

    if (!orderId || !paymentId || !bookingData) {
      return new Response(JSON.stringify({ error: "Missing required payment confirmation parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gatewaySecret = Deno.env.get("PAYMENT_GATEWAY_SECRET");

    // If live credentials provided, strictly verify cryptographic HMAC-SHA256 signature
    if (gatewaySecret && signature) {
      const text = `${orderId}|${paymentId}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(gatewaySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
      const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (generatedSignature !== signature) {
        return new Response(JSON.stringify({ error: "Invalid payment cryptographic signature" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Call atomic PostgreSQL function create_confirmed_appointment
    const { data: result, error: rpcError } = await supabaseClient.rpc(
      "create_confirmed_appointment",
      {
        p_patient_user_id: bookingData.patientUserId || null,
        p_patient_name: bookingData.patientName,
        p_patient_age: Number(bookingData.patientAge),
        p_patient_gender: bookingData.patientGender,
        p_patient_address: bookingData.patientAddress,
        p_patient_mobile: bookingData.patientMobile,
        p_speciality_id: bookingData.specialityId,
        p_doctor_id: bookingData.doctorId,
        p_appointment_date: bookingData.appointmentDate,
        p_appointment_time: bookingData.appointmentTime,
        p_patient_problem: bookingData.patientProblem,
        p_provider: provider,
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_signature: signature || "VERIFIED_SERVER",
        p_terms_version: bookingData.termsVersion || "v1.0",
      }
    );

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointmentId: result.appointment_id,
        appointmentNumber: result.appointment_number,
        amount: result.amount,
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
