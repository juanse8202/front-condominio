// /src/layout/AppLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Topbar onToggle={() => setCollapsed(!collapsed)} collapsed={collapsed} />
      <div style={{ display: "grid", gridTemplateColumns: `${collapsed ? "0px" : "220px"} 1fr` }}>
        <Sidebar collapsed={collapsed} />
        <main style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
