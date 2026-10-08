"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "@/styles/ImportantNoticePopup.css";

export default function ImportantNoticePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Do not show on admin panel routes
    if (pathname?.startsWith("/admin")) return;

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("miu_notice_closed");
    if (!dismissed) {
      setIsOpen(true);
    }
  }, [pathname]);

  const handleClose = () => {
    sessionStorage.setItem("miu_notice_closed", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="notice-overlay"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="notice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-heading"
      >
        <button
          className="notice-close-btn"
          onClick={handleClose}
          aria-label="Close Notice"
        >
          ✕
        </button>

        <div className="notice-header">
          <div className="notice-badge">⚠️ OFFICIAL ADVISORY</div>
          <h2 id="notice-heading">IMPORTANT NOTICE</h2>
        </div>

        <div className="notice-body">
          <p className="notice-intro">
            This is to inform all students, parents, stakeholders, and the general
            public that the <strong>ONLY</strong> official website/domain of Manipur
            International University (MIU) is:
          </p>

          <div className="notice-official-box">
            <span className="notice-check-icon">✓</span>
            <a
              href="https://miu.edu.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://miu.edu.in/
            </a>
          </div>

          <p className="notice-warning-intro">
            The following websites/domains are <strong>fake, unauthorized, and not associated</strong> with Manipur International University:
          </p>

          <ul className="notice-fake-list">
            <li>
              <span className="fake-cross">✕</span>
              <code>https://www.miuonline.org/</code>
            </li>
            <li>
              <span className="fake-cross">✕</span>
              <code>https://miu.exam-portal.in/auth/</code>
            </li>
            <li>
              <span className="fake-cross">✕</span>
              <code>https://apprenticeship.miuskill.in/</code>
            </li>
          </ul>

          <div className="notice-alert-box">
            <p>
              It has come to the notice of the University Management that certain
              persons may be using these websites to misrepresent Manipur
              International University (MIU) and collect student information,
              conducting online exam, and/or Collecting Fees.
            </p>
            <p>
              <strong>
                All students and stakeholders are strictly advised not to share
                personal information, documents, login credentials, or make any
                payments through these unauthorized websites.
              </strong>
            </p>
            <p>
              For all official information and services, please visit only{" "}
              <a
                href="https://miu.edu.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://miu.edu.in/
              </a>.
            </p>
          </div>

          <p className="notice-disclaimer">
            Manipur International University shall not be liable or responsible for
            any financial loss, disclosure or misuse of personal information, or any
            other loss/damage arising from dealings with these unauthorized websites
            or persons.
          </p>

          <div className="notice-footer-authority">
            MANIPUR INTERNATIONAL UNIVERSITY
          </div>
        </div>

        <div className="notice-actions">
          <button className="notice-acknowledge-btn" onClick={handleClose}>
            I Understand &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
