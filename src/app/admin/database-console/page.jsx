"use client";

import React, { useState, useContext, useEffect } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import API from "@/lib/api";
import toast from "react-hot-toast";

const TEMPLATES = [
  {
    name: "⚡ Fix Course Canonical URLs (remove www.)",
    query: `await db.courses.updateMany(
  { "seo.canonicalUrl": /www\\.miu\\.edu\\.in/ },
  [
    {
      $set: {
        "seo.canonicalUrl": {
          $replaceOne: {
            input: "$seo.canonicalUrl",
            find: "https://www.miu.edu.in",
            replacement: "https://miu.edu.in"
          }
        }
      }
    }
  ]
);`,
  },
  {
    name: "📁 List All Collections",
    query: `await db.listCollections().toArray();`,
  },
  {
    name: "🔍 Find Latest 5 Courses",
    query: `await db.courses.find({}, { projection: { title: 1, slug: 1, "seo.canonicalUrl": 1 } })
  .sort({ updatedAt: -1 })
  .limit(5)
  .toArray();`,
  },
  {
    name: "📊 Count Documents in Collections",
    query: `const collections = await db.listCollections().toArray();
const counts = {};
for (const col of collections) {
  counts[col.name] = await db.collection(col.name).countDocuments();
}
return counts;`,
  },
  {
    name: "➕ Create New Collection",
    query: `await db.createCollection("my_new_collection");`,
  },
  {
    name: "✏️ Update One Document Template",
    query: `await db.courses.updateOne(
  { slug: "b-a-in-manipuri" },
  { $set: { "seo.canonicalUrl": "https://miu.edu.in/courses/b-a-in-manipuri" } }
);`,
  },
  {
    name: "📥 Insert Document Template",
    query: `await db.collection("my_collection").insertOne({
  title: "Example Title",
  createdAt: new Date(),
  status: "active"
});`,
  },
];

export default function DatabaseConsole() {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState(TEMPLATES[0].query);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(null);
  const [dbName, setDbName] = useState(null);

  const handleRunQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query to execute");
      return;
    }

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await API.post("/admin/query", { query });
      if (response.data.success) {
        setOutput(response.data.result);
        setDuration(response.data.durationMs);
        setDbName(response.data.dbName);
        toast.success(`Query executed in ${response.data.durationMs}ms`);
      } else {
        setError(response.data.message || "Query failed");
      }
    } catch (err) {
      console.error("Query error:", err);
      const errMsg = err.response?.data?.message || err.message || "Execution error";
      setError(errMsg);
      toast.error("Execution failed: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
      toast.success("Result copied to clipboard!");
    }
  };

  return (
    <div
      style={{
        padding: "130px 20px 60px",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.9rem", fontWeight: "800", color: "#1a202c", margin: 0 }}>
                💻 Database Query Console
              </h1>
              {dbName && (
                <span
                  style={{
                    backgroundColor: "#e6fffa",
                    color: "#234e52",
                    border: "1px solid #38b2ac",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  DB: {dbName}
                </span>
              )}
            </div>
            <p style={{ color: "#718096", margin: "5px 0 0", fontSize: "0.95rem" }}>
              Execute arbitrary MongoDB queries, migrations, updates, and collection operations.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="btn btn-black"
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Template Selector */}
        <div
          style={{
            background: "white",
            padding: "16px 20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.9rem" }}>
            Query Presets:
          </span>
          <select
            onChange={(e) => {
              const selected = TEMPLATES.find((t) => t.name === e.target.value);
              if (selected) setQuery(selected.query);
            }}
            style={{
              flex: "1",
              minWidth: "260px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
              fontSize: "0.9rem",
              background: "#fafafa",
              cursor: "pointer",
            }}
          >
            {TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>
            Tip: Press <strong>Ctrl + Enter</strong> to run query
          </span>
        </div>

        {/* Query Input Editor */}
        <div
          style={{
            background: "#1e1e1e",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#2d2d2d",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #3d3d3d",
            }}
          >
            <span style={{ color: "#9cdcfe", fontFamily: "monospace", fontSize: "0.85rem" }}>
              MongoDB / JavaScript Query Editor (<code>db</code> and <code>mongoose</code> available)
            </span>
            <button
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#888",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Clear
            </button>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`// Write any MongoDB command, e.g.:\nawait db.courses.find({}).limit(5).toArray();`}
            rows={10}
            style={{
              width: "100%",
              padding: "16px",
              background: "#1e1e1e",
              color: "#d4d4d4",
              fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              border: "none",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              backgroundColor: "#252526",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "12px",
              borderTop: "1px solid #333",
            }}
          >
            <button
              onClick={handleRunQuery}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#718096" : "#2b6cb0",
                color: "white",
                border: "none",
                padding: "10px 24px",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Executing Query..." : "▶ Run Query"}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        {(output !== null || error !== null) && (
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: error ? "#fff5f5" : "#f7fafc",
                borderBottom: `1px solid ${error ? "#fed7d7" : "#e2e8f0"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    color: error ? "#c53030" : "#2f855a",
                  }}
                >
                  {error ? "❌ Execution Error" : "✅ Query Result"}
                </span>
                {duration !== null && (
                  <span style={{ fontSize: "0.8rem", color: "#718096" }}>
                    Execution Time: <strong>{duration} ms</strong>
                  </span>
                )}
              </div>

              {output !== null && (
                <button
                  onClick={handleCopy}
                  style={{
                    background: "#edf2f7",
                    border: "1px solid #cbd5e0",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                  }}
                >
                  📋 Copy JSON
                </button>
              )}
            </div>

            <div style={{ padding: "16px", maxHeight: "450px", overflowY: "auto" }}>
              {error ? (
                <pre
                  style={{
                    color: "#e53e3e",
                    fontFamily: "monospace",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontSize: "0.9rem",
                  }}
                >
                  {error}
                </pre>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontSize: "0.88rem",
                    color: "#2d3748",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(output, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

