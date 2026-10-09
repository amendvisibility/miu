"use client";

import { useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";

export default function AdminAuthGuard({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [user, loading, isLoginPage, router]);

  // Always allow the login page to render freely
  if (isLoginPage) {
    return children;
  }

  // Show authenticating state while checking session
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          fontFamily: "inherit",
          fontSize: "1.1rem",
          color: "#4a5568",
        }}
      >
        Authenticating...
      </div>
    );
  }

  // If not logged in and not on login page, prevent flash of content
  if (!user) {
    return null;
  }

  return children;
}

