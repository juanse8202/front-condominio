// /src/components/Topbar.jsx
import { useEffect, useState } from "react";
import { getUser } from "../api/authStorage";

export default function Topbar({ onToggle, collapsed }) {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const handler = () => setUser(getUser());
    window.addEventListener("auth:user", handler);
    window.addEventListener("storage", handler); // cambios entre pestañas
    return () => {
      window.removeEventListener("auth:user", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <header style={wrap}>
      <button aria-label="Toggle menú" onClick={onToggle} style={burger}>
        {collapsed ? (
          <span style={{ fontSize: 20, color: "#fff" }}>☰</span>
        ) : (
          <span style={{ fontSize: 20, color: "#fff" }}>×</span>
        )}
      </button>

      <div style={{ fontWeight: 600 }}>Condominio</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22 }}>
        <span style={{ opacity: .8 }}>
          {user
            ? // Muestra nombre completo si existe; si no, username; si no, "Invitado"
              (user.first_name || user.last_name)
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : user.username || "Invitado"
            : "Invitado"}
        </span>
      </div>
    </header>
  );
}

const wrap = {
  height: 56,
  display: "grid",
  gridTemplateColumns: "56px 1fr 120px",
  alignItems: "center",
  padding: "0 12px",
  background: "#0f172a",
  color: "#fff",
  position: "sticky",
  top: 0,
  zIndex: 40,
  boxShadow: "0 2px 10px rgba(0,0,0,.15)"
};

const burger = {
  width: 40, height: 40, borderRadius: 8, border: "1px solid #334155",
  background: "transparent", display: "grid", placeItems: "center", cursor: "pointer"
};
