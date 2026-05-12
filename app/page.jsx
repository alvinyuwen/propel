"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./home-client"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading dashboard...</div>,
});

export default function Page() {
  return <HomeClient />;
}
