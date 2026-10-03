"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import API from "@/lib/api";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div style={{ padding: "160px 20px", textAlign: "center" }}>
        Authenticating...
      </div>
    );
  }

  if (!user) return null;

  const validate = () => {
    const e = {};
    if (!form.currentPassword.trim()) {
      e.currentPassword = "Current password is required.";
    }
    if (!form.newPassword.trim()) {
      e.newPassword = "New password is required.";
    } else if (form.newPassword.length < 6) {
      e.newPassword = "New password must be at least 6 characters.";
    } else if (form.currentPassword && form.currentPassword === form.newPassword) {
      e.newPassword = "New password must be different from current password.";
    }
    if (!form.confirmPassword.trim()) {
      e.confirmPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccessMsg("");
  };

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      const message = data.message || "Password changed successfully!";
      toast.success(message);
      setSuccessMsg(message);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to change password. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("current password")) {
        setErrors((prev) => ({ ...prev, currentPassword: msg }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "130px 20px 60px",
        minHeight: "100vh",
        background: "#f8f9fa",
      }}
    >
      <div className="container" style={{ maxWidth: "520px", margin: "0 auto" }}>
        {/* Navigation link */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/admin/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#555",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 6px 30px rgba(0,0,0,0.08)",
            overflow: "hidden",
            border: "1px solid #eaeaea",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              background: "#111",
              padding: "32px 36px 28px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.6rem", marginBottom: "8px" }}>🔑</div>
            <h1
              style={{
                color: "white",
                fontSize: "1.6rem",
                fontWeight: "800",
                margin: "0 0 6px",
              }}
            >
              Change Password
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.88rem",
                margin: 0,
              }}
            >
              Logged in as: <strong>{user?.name || user?.email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "32px 36px" }} noValidate>
            {successMsg && (
              <div
                style={{
                  background: "#e8f5e9",
                  border: "1px solid #c8e6c9",
                  color: "#2e7d32",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            {errors.general && (
              <div
                style={{
                  background: "#ffebee",
                  border: "1px solid #ffcdd2",
                  color: "#c62828",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                }}
              >
                {errors.general}
              </div>
            )}

            {/* Current Password Field */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>
                Current Password <span style={{ color: "#e53935" }}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  style={{
                    ...inputStyle,
                    borderColor: errors.currentPassword ? "#e53935" : "#ddd",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("current")}
                  style={eyeButtonStyle}
                  aria-label="Toggle current password visibility"
                >
                  {showPasswords.current ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.currentPassword && (
                <span style={errorTextStyle}>{errors.currentPassword}</span>
              )}
            </div>

            {/* New Password Field */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>
                New Password <span style={{ color: "#e53935" }}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  style={{
                    ...inputStyle,
                    borderColor: errors.newPassword ? "#e53935" : "#ddd",
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("new")}
                  style={eyeButtonStyle}
                  aria-label="Toggle new password visibility"
                >
                  {showPasswords.new ? "🙈" : "👁️"}
                </button>
              </div>
              {form.newPassword && (
                <PasswordStrengthIndicator password={form.newPassword} />
              )}
              {errors.newPassword && (
                <span style={errorTextStyle}>{errors.newPassword}</span>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div style={{ marginBottom: "28px" }}>
              <label style={labelStyle}>
                Confirm New Password <span style={{ color: "#e53935" }}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  style={{
                    ...inputStyle,
                    borderColor: errors.confirmPassword ? "#e53935" : "#ddd",
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("confirm")}
                  style={eyeButtonStyle}
                  aria-label="Toggle confirm password visibility"
                >
                  {showPasswords.confirm ? "🙈" : "👁️"}
                </button>
              </div>
              {form.confirmPassword && form.newPassword && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    margin: "5px 0 0",
                    fontWeight: "600",
                    color:
                      form.newPassword === form.confirmPassword
                        ? "#2e7d32"
                        : "#e53935",
                  }}
                >
                  {form.newPassword === form.confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
              {errors.confirmPassword && (
                <span style={errorTextStyle}>{errors.confirmPassword}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-orange"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: "700",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s",
              }}
            >
              {loading ? "Updating Password..." : "🔒 Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Password Strength Indicator ──────────────────────────────────────────────
function PasswordStrengthIndicator({ password }) {
  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const score = calculateStrength(password);
  const tiers = [
    { label: "Too Weak", color: "#e53935" },
    { label: "Weak", color: "#f57c00" },
    { label: "Fair", color: "#fbc02d" },
    { label: "Good", color: "#7cb342" },
    { label: "Strong", color: "#2e7d32" },
  ];
  const tier = tiers[Math.min(score, 4)];

  return (
    <div style={{ marginTop: "7px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {tiers.map((t, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "4px",
              background: idx < score ? tier.color : "#e0e0e0",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: tier.color, margin: 0, fontWeight: "600" }}>
        Strength: {tier.label}
      </p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "0.88rem",
  fontWeight: "700",
  color: "#333",
  fontFamily: "var(--font-heading)",
};

const inputWrapperStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputStyle = {
  width: "100%",
  padding: "12px 44px 12px 14px",
  border: "1.5px solid #ddd",
  borderRadius: "10px",
  fontSize: "0.95rem",
  outline: "none",
  background: "#fafafa",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const eyeButtonStyle = {
  position: "absolute",
  right: "12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "1.1rem",
  padding: "4px",
  lineHeight: 1,
};

const errorTextStyle = {
  color: "#e53935",
  fontSize: "0.78rem",
  marginTop: "5px",
  display: "block",
};
