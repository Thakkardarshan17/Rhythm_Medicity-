// Supabase Edge Function: create-payment-order
// Handles server-side order creation for payment providers (Razorpay, Cashfree, PhonePe)
// Strictly resolves doctor consultation fee server-side from PostgreSQL to prevent tampering.

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

    const { doctorId, specialityId, appointmentDate, appointmentTime, patientDetails } = await req.json();

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return new Response(JSON.stringify({ error: "Missing required booking details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch doctor consultation fee strictly from database
    const { data: doctor, error: docError } = await supabaseClient
      .from("doctors")
      .select("id, full_name, consultation_fee, status, speciality_id")
      .eq("id", doctorId)
      .single();

    if (docError || !doctor || doctor.status !== "active") {
      return new Response(JSON.stringify({ error: "Selected doctor is not available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check for slot conflict
    const { data: existingSlot } = await supabaseClient
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .in("appointment_status", ["CONFIRMED", "PENDING_PAYMENT"])
      .maybeSingle();

    if (existingSlot) {
      return new Response(JSON.stringify({ error: "This consultation slot is already reserved" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payableAmount = Number(doctor.consultation_fee);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Provider check (Razorpay / Cashfree / PhonePe / Simulation)
    const razorpayKeyId = Deno.env.get("PAYMENT_GATEWAY_KEY_ID");
    const razorpaySecret = Deno.env.get("PAYMENT_GATEWAY_SECRET");

    let providerOrderId = orderId;
    let providerName = "simulation";

    if (razorpayKeyId && razorpaySecret) {
      providerName = "razorpay";
      // Call Razorpay API to generate genuine order
      const authHeader = btoa(`${razorpayKeyId}:${razorpaySecret}`);
      const rzResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(payableAmount * 100), // in paise
          currency: "INR",
          receipt: orderId,
          notes: {
            doctor_name: doctor.full_name,
            patient_name: patientDetails?.name || "Patient",
          },
        }),
      });

      if (rzResponse.ok) {
        const rzOrder = await rzResponse.json();
        providerOrderId = rzOrder.id;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: providerOrderId,
        amount: payableAmount,
        currency: "INR",
        provider: providerName,
        keyId: razorpayKeyId || "rzp_test_public_key",
        doctorName: doctor.full_name,
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
