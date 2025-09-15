// /src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/authAPI";

export default function Sidebar({ collapsed }) {
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  return (
    <aside
      style={{
        ...aside,
        width: collapsed ? 0 : 220,
        overflow: "hidden",
        transition: "all .3s ease",
      }}
    >
      <div style={{ padding: 20 }}>
        <h2 style={{ marginBottom: 20 }}>Condominio</h2>
        <nav>
          <ul style={{ listStyle:"none", padding:0, margin:0 }}>
            <li><Item to="/admin" label="🏠 Dashboard" end /></li>
            <li><Item to="/admin/propietarios" label="👥 Propietarios" /></li>
            <li><Item to="/admin/expensas" label="💰 Expensas" /></li>            
            <li><Item to="/admin/visitas" label="📑 Visitas" /></li>
            <li><Item to="/admin/reportes" label="📑 Reportes" /></li>
            {/* <li><Item to="/admin/reservas" label="📅 Reservas" /></li> */}
            {/* <li><Item to="/admin/configuracion" label="⚙️ Configuración" /></li> */}
          </ul>
        </nav>

        <button onClick={handleLogout} style={btnLogout}>Salir</button>
      </div>
    </aside>
  );
}

function Item({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: "#fff",
        fontSize: 14,
        marginBottom: 6,
        background: isActive ? "#334155" : "transparent",
        boxShadow: isActive ? "inset 0 0 0 1px #475569" : "none",
      })}
    >
      {label}
    </NavLink>
  );
}

const aside = { background:"#1e293b", color:"#fff", minHeight:"100vh" };
const btnLogout = {
  marginTop: 16, width:"100%", padding:"10px 12px", border:"none",
  borderRadius:8, background:"#ef4444", color:"#fff", cursor:"pointer"
};
