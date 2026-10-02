"use client";

import React, { useState } from "react";
import "@/styles/PayOnline.css";

export default function PayForSeminarPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    purpose: "",
    amount: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Mobile number is required";
    else if (!/^\d{10}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit mobile number";
    if (!form.email.trim()) e.email = "Email ID is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.purpose.trim()) e.purpose = "Seminar selection is required";
    if (!form.amount.trim()) e.amount = "Amount is required";
    else if (isNaN(form.amount) || parseFloat(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handlePurposeChange = (e) => {
    const selectedPurpose = e.target.value;
    let autoAmount = "";

    if (selectedPurpose === "Seminar A") {
      autoAmount = "100";
    } else if (selectedPurpose === "Seminar B") {
      autoAmount = "200";
    }

    setForm((prev) => ({
      ...prev,
      purpose: selectedPurpose,
      amount: autoAmount,
    }));
    setErrors((prev) => ({
      ...prev,
      purpose: "",
      amount: autoAmount ? "" : prev.amount,
    }));
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(
          data.message || "Something went wrong. Please try again.",
        );
        setLoading(false);
        return;
      }

      // Redirect directly to Easebuzz payment page
      window.location.href = data.redirectUrl;
    } catch {
      setServerError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        {/* Header */}
        <div className="pay-header">
          <div className="pay-logo-wrap">
            <img
              src="/images/MIU_Logo.webp"
              alt="MIU Logo"
              className="pay-logo"
            />
          </div>
          <h1 className="pay-title">Pay for Seminar</h1>
          <p className="pay-subtitle">Manipur International University</p>
        </div>

        {/* Form */}
        <form className="pay-form" onSubmit={handleSubmit} noValidate>
          <div className="pay-field">
            <label htmlFor="name">
              Full Name <span className="pay-req">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
            />
            {errors.name && <span className="pay-error">{errors.name}</span>}
          </div>

          <div className="pay-field">
            <label htmlFor="phone">
              Mobile Number <span className="pay-req">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <span className="pay-error">{errors.phone}</span>}
          </div>

          <div className="pay-field">
            <label htmlFor="email">
              Email ID <span className="pay-req">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="pay-error">{errors.email}</span>}
          </div>

          <div className="pay-field">
            <label htmlFor="purpose">
              Purpose <span className="pay-req">*</span>
            </label>
            <select
              id="purpose"
              name="purpose"
              value={form.purpose}
              onChange={handlePurposeChange}
              className={errors.purpose ? "error" : ""}
            >
              <option value="">-- Select Purpose --</option>
              <option value="Seminar A">Seminar A</option>
              <option value="Seminar B">Seminar B</option>
            </select>
            {errors.purpose && (
              <span className="pay-error">{errors.purpose}</span>
            )}
          </div>

          <div className="pay-field">
            <label htmlFor="amount">
              Amount (₹) <span className="pay-req">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              placeholder="Select purpose to auto-fill amount"
              value={form.amount}
              onChange={handleChange}
              readOnly
              min="1"
              step="1"
              className={errors.amount ? "error" : ""}
            />
            {errors.amount && (
              <span className="pay-error">{errors.amount}</span>
            )}
          </div>

          {serverError && <div className="pay-server-error">{serverError}</div>}

          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? (
              <span className="pay-spinner">Processing...</span>
            ) : (
              <>
                🔒 Pay ₹
                {form.amount
                  ? parseFloat(form.amount).toLocaleString("en-IN")
                  : "0"}
              </>
            )}
          </button>

          <p className="pay-secure-note">
            🔐 Secured by <strong>Easebuzz</strong> Payment Gateway. Your
            payment information is encrypted and secure.
          </p>
        </form>
      </div>
    </div>
  );
}

