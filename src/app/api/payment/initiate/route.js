import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, amount, purpose } = body;

    if (!name || !email || !phone || !amount || !purpose) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    const key = process.env.EASEBUZZ_KEY;
    const salt = process.env.EASEBUZZ_SALT;

    if (!key || !salt) {
      return NextResponse.json(
        { message: "Payment gateway credentials not configured" },
        { status: 500 },
      );
    }

    // Generate unique transaction ID
    const txnid =
      "MIU" +
      Date.now() +
      Math.random().toString(36).substring(2, 7).toUpperCase();

    // Format amount to 2 decimal places (Easebuzz standard)
    const formattedAmount = parseFloat(amount).toFixed(2);
    const productinfo = purpose
      .trim()
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const firstname = name.trim();
    const emailTrimmed = email.trim();

    // Easebuzz SHA-512 Hash format:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt)
    const hashString = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${emailTrimmed}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://miu.edu.in";

    const splitPayments = JSON.stringify({
      "Edtech Innovate Pvt. Ltd": parseFloat(formattedAmount),
    });

    const params = new URLSearchParams({
      key,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email: emailTrimmed,
      phone: phone.trim(),
      surl: `${baseUrl}/payonline/success`,
      furl: `${baseUrl}/payonline/failed`,
      hash,
      udf1: "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      split_payments: splitPayments,
    });

    // Determine environment (production or test)
    const easebuzzEnv =
      process.env.EASEBUZZ_ENV === "test" ? "testpay" : "pay";
    const initiateUrl = `https://${easebuzzEnv}.easebuzz.in/payment/initiateLink`;

    const response = await fetch(initiateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    const rawText = await response.text();
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error("Easebuzz returned non-JSON response:", rawText);
      return NextResponse.json(
        {
          success: false,
          message: "Payment gateway response error. Please try again.",
        },
        { status: 502 },
      );
    }

    if (result.status !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error_desc || result.data || "Payment initiation failed",
        },
        { status: 400 },
      );
    }

    // Direct Easebuzz payment checkout URL
    const redirectUrl = `https://${easebuzzEnv}.easebuzz.in/pay/${result.data}`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      data: result,
    });
  } catch (error) {
    console.error("Payment initiate error:", error);
    const isTimeout =
      error?.cause?.code === "ETIMEDOUT" || error?.name === "TimeoutError";
    return NextResponse.json(
      {
        message: isTimeout
          ? "Payment gateway timed out. Please try again or contact support."
          : "Server error",
        success: false,
      },
      { status: 500 },
    );
  }
}
