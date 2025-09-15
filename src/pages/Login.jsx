// /src/pages/Login.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/authAPI";

const Login = () => {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(username, password);
      nav(from, { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        "Credenciales inválidas";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <form onSubmit={onSubmit} style={card}>
        <h2 style={{ margin: "0 0 12px" }}>Ingresar</h2>
        {err && <p style={{ color: "crimson", marginTop: 0 }}>{err}</p>}
        <label>Usuario</label>
        <input value={username} onChange={(e) => setU(e.target.value)} required style={input}/>
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setP(e.target.value)} required style={input}/>
        <button type="submit" disabled={loading} style={btn}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};

const wrap = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" };
const card = { width: 320, background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.08)" };
const input = { width: "100%", padding: "10px 12px", margin: "6px 0 12px", border: "1px solid #e5e7eb", borderRadius: 8 };
const btn = { width: "100%", padding: "10px 12px", border: "none", borderRadius: 8, background: "#1e293b", color: "#fff", cursor: "pointer" };

export default Login;
