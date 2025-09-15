// /src/pages/Reportes.jsx

import { useEffect, useMemo, useState } from "react";
import {
  fetchReportes,
  createReporte,
  updateReporte,
  deleteReporte,
} from "../api/reportesAPI";
import { fetchPropietarios } from "../api/propietariosAPI";

const ESTADOS = ["pendiente", "en_proceso", "resuelto", "rechazado"];
const TIPOS = ["mantenimiento", "limpieza", "seguridad", "incumplimiento", "otro"];

export default function Reportes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filtros/orden
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [ordering, setOrdering] = useState("-fecha_reporte");

  // modal form
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // confirm delete
  const [confirm, setConfirm] = useState(null);

  // propietarios (selector)
  const [owners, setOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownerQuery, setOwnerQuery] = useState("");

  const loadOwners = async () => {
    try {
      setOwnersLoading(true);
      const data = await fetchPropietarios();
      setOwners(Array.isArray(data) ? data : []);
    } finally {
      setOwnersLoading(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const params = {};
      if (ordering) params.ordering = ordering;
      if (fEstado) params.estado = fEstado;
      if (fTipo) params.tipo = fTipo;
      if (fPrioridad) params.prioridad = fPrioridad;
      const data = await fetchReportes(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ordering, fEstado, fTipo, fPrioridad]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((it) => {
      const nombre = (it?.titulo || "").toLowerCase();
      const desc = (it?.descripcion || "").toLowerCase();
      const ubic = (it?.ubicacion || "").toLowerCase();
      const tipo = (it?.tipo || "").toLowerCase();
      const estado = (it?.estado || "").toLowerCase();
      const prio = String(it?.prioridad || "");
      const prop = String(it?.propietario || "");
      return (
        nombre.includes(s) ||
        desc.includes(s) ||
        ubic.includes(s) ||
        tipo.includes(s) ||
        estado.includes(s) ||
        prio.includes(s) ||
        prop.includes(s)
      );
    });
  }, [items, q]);

  const startCreate = () => {
    setEditing({
      id: null,
      tipo: "",
      titulo: "",
      descripcion: "",
      ubicacion: "",
      foto_file: null,     // File
      foto_url: "",        // por si quieres URL directa
      fecha_reporte: new Date().toISOString().slice(0, 16), // input datetime-local
      estado: "pendiente",
      prioridad: 3,
      propietario_id: "",
    });
    setOpenForm(true);
    loadOwners();
  };

  const startEdit = (it) => {
    setEditing({
      id: it.id,
      tipo: it.tipo || "",
      titulo: it.titulo || "",
      descripcion: it.descripcion || "",
      ubicacion: it.ubicacion || "",
      foto_file: null,
      foto_url: it.foto || "",
      // fecha_reporte viene ISO con Z; normalizamos a yyyy-MM-ddTHH:mm para input
      fecha_reporte: toDatetimeLocal(it.fecha_reporte),
      estado: it.estado || "pendiente",
      prioridad: it.prioridad ?? 3,
      propietario_id: it.propietario ?? "",
    });
    setOpenForm(true);
    loadOwners();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { payload, hasFile } = mapFormToPayload(editing);
      if (editing.id) {
        await updateReporte(editing.id, payload, hasFile);
      } else {
        await createReporte(payload, hasFile);
      }
      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const quickEstado = async (it) => {
    const next = nextEstado(it.estado);
    try {
      await updateReporte(it.id, { estado: next });
      await load();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReporte(id);
      setConfirm(null);
      await load();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <div className="flex flex-wrap gap-2">
          <input
            className="input"
            placeholder="Buscar: título, tipo, estado, ubicación…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Estado: todos</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{capital(s)}</option>)}
          </select>
          <select className="input" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Tipo: todos</option>
            {TIPOS.map((t) => <option key={t} value={t}>{capital(t)}</option>)}
          </select>
          <select className="input" value={fPrioridad} onChange={(e) => setFPrioridad(e.target.value)}>
            <option value="">Prioridad: todas</option>
            {[1,2,3,4,5].map((n)=> <option key={n} value={n}>Prioridad {n}</option>)}
          </select>
          <select className="input" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
            <option value="-fecha_reporte">Más recientes</option>
            <option value="fecha_reporte">Más antiguas</option>
            <option value="-prioridad">Prioridad alta→baja</option>
            <option value="prioridad">Prioridad baja→alta</option>
          </select>
          <button className="btn-primary" onClick={startCreate}>+ Nuevo</button>
        </div>
      </header>

      {err && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {err}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <Th>ID</Th>
              <Th>Título</Th>
              <Th>Tipo</Th>
              <Th>Ubicación</Th>
              <Th>Propietario</Th>
              <Th>Prioridad</Th>
              <Th>Estado</Th>
              <Th>Fecha</Th>
              <Th>Foto</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={10} className="p-6 text-center text-slate-500">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="p-6 text-center text-slate-500">Sin resultados</td></tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <Td>{it.id}</Td>
                  <Td className="max-w-[260px]">
                    <div className="font-medium">{it.titulo}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{it.descripcion}</div>
                  </Td>
                  <Td>{chip(it.tipo, "tipo")}</Td>
                  <Td>{it.ubicacion}</Td>
                  <Td>#{it.propietario}</Td>
                  <Td>{chip(`P${it.prioridad}`, "prio", it.prioridad)}</Td>
                  <Td>{estadoBadge(it.estado)}</Td>
                  <Td title={it.fecha_reporte}>{formatFecha(it.fecha_reporte)}</Td>
                  <Td>
                    {it.foto ? (
                      <a className="text-slate-700 underline" href={it.foto} target="_blank">ver</a>
                    ) : <span className="text-slate-400">—</span>}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost" title="Cambiar estado" onClick={() => quickEstado(it)}>🔄</button>
                      <button className="btn-ghost" title="Editar" onClick={() => startEdit(it)}>✏️</button>
                      <button className="btn-danger" title="Eliminar" onClick={() => setConfirm(it)}>🗑️</button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {openForm && (
        <Modal title={editing?.id ? "Editar reporte" : "Nuevo reporte"} onClose={() => setOpenForm(false)}>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Título" value={editing.titulo} onChange={(v)=> setEditing(s=>({...s, titulo:v}))} required />
              <Select label="Tipo" value={editing.tipo} onChange={(v)=> setEditing(s=>({...s, tipo:v}))} required>
                <option value="" disabled>Selecciona tipo</option>
                {TIPOS.map(t => <option key={t} value={t}>{capital(t)}</option>)}
              </Select>
              <Field label="Ubicación" value={editing.ubicacion} onChange={(v)=> setEditing(s=>({...s, ubicacion:v}))} />
            </div>

            <div>
              <label className="block text-sm">
                <span className="text-slate-700">Descripción</span>
                <textarea
                  className="input mt-1 w-full"
                  rows={3}
                  value={editing.descripcion}
                  onChange={(e)=> setEditing(s=>({...s, descripcion: e.target.value}))}
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Select label="Estado" value={editing.estado} onChange={(v)=> setEditing(s=>({...s, estado:v}))}>
                {ESTADOS.map(s => <option key={s} value={s}>{capital(s)}</option>)}
              </Select>
              <Select label="Prioridad" value={editing.prioridad} onChange={(v)=> setEditing(s=>({...s, prioridad: Number(v)}))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Prioridad {n}</option>)}
              </Select>
              <Field
                label="Fecha reporte"
                type="datetime-local"
                value={editing.fecha_reporte}
                onChange={(v)=> setEditing(s=>({...s, fecha_reporte: v}))}
              />
            </div>

            {/* Propietario */}
            <SelectPropietario
              value={editing.propietario_id}
              onChange={(v)=> setEditing(s=>({...s, propietario_id: v}))}
              owners={owners}
              query={ownerQuery}
              setQuery={setOwnerQuery}
              loading={ownersLoading}
            />

            {/* Foto: archivo o URL */}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-slate-700">Foto (archivo)</span>
                <input
                  className="input mt-1 w-full"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setEditing((s) => ({ ...s, foto_file: f }));
                  }}
                />
              </label>
              <Field
                label="Foto (URL)"
                placeholder="https://…"
                value={editing.foto_url}
                onChange={(v)=> setEditing(s=>({...s, foto_url:v}))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={()=> setOpenForm(false)}>Cancelar</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirm && (
        <Modal title="Eliminar reporte" onClose={()=> setConfirm(null)}>
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar el reporte <b>#{confirm.id}</b> — <b>{confirm.titulo}</b>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost" onClick={()=> setConfirm(null)}>Cancelar</button>
            <button className="btn-danger" onClick={()=> handleDelete(confirm.id)}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- helpers UI ---------- */
const Th = ({ children, className = "" }) => (
  <th className={`px-3 py-2 text-xs font-semibold text-slate-600 ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-2 align-top ${className}`}>{children}</td>
);
const Field = ({ label, value, onChange, type="text", placeholder, required }) => (
  <label className="block text-sm">
    <span className="text-slate-700">{label}</span>
    <input
      className="input mt-1 w-full"
      value={value ?? ""}
      onChange={(e)=> onChange(type==="number" ? Number(e.target.value) : e.target.value)}
      type={type}
      placeholder={placeholder}
      required={required}
    />
  </label>
);
const Select = ({ label, value, onChange, children }) => (
  <label className="block text-sm">
    <span className="text-slate-700">{label}</span>
    <select className="input mt-1 w-full" value={value ?? ""} onChange={(e)=> onChange(e.target.value)}>
      {children}
    </select>
  </label>
);

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
        <button className="btn-ghost" onClick={onClose}>✖</button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* ---------- helpers de dominio ---------- */
function estadoBadge(estado) {
  const styles = {
    pendiente: "bg-amber-100 text-amber-700 border border-amber-200",
    en_proceso: "bg-blue-100 text-blue-700 border border-blue-200",
    resuelto: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    rechazado: "bg-rose-100 text-rose-700 border border-rose-200",
  }[estado] || "bg-slate-100 text-slate-700 border border-slate-200";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${styles}`}>{capital(estado)}</span>;
}

function chip(text, kind, prio=0) {
  let styles = "bg-slate-100 text-slate-700 border border-slate-200";
  if (kind === "tipo") styles = "bg-indigo-100 text-indigo-700 border border-indigo-200";
  if (kind === "prio") {
    styles =
      prio >= 4
        ? "bg-rose-100 text-rose-700 border border-rose-200"
        : prio === 3
        ? "bg-amber-100 text-amber-700 border border-amber-200"
        : "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${styles}`}>{text}</span>;
}

function capital(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace("_"," ") : s;
}

function formatFecha(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const f = new Intl.DateTimeFormat("es-BO", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).format(d);
    return f;
  } catch { return iso; }
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth()+1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function nextEstado(e) {
  const order = ["pendiente", "en_proceso", "resuelto", "rechazado"];
  const idx = Math.max(0, order.indexOf(e));
  return order[(idx + 1) % order.length];
}

function formatApiError(e) {
  if (e?.response?.data) {
    try { return JSON.stringify(e.response.data, null, 2); } catch {}
    return String(e.response.data);
  }
  return e?.message || "Error";
}

/* ------ Selector de Propietario (mismo patrón que en Expensas) ------ */
function SelectPropietario({ value, onChange, owners, query, setQuery, loading }) {
  const list = useMemo(() => {
    const s = (query || "").toLowerCase();
    return owners.filter((p) => {
      const u = p?.user || {};
      const nombre = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const unidad = `${p?.unidad?.numero || ""} ${p?.unidad?.edificio || ""}`.toLowerCase();
      const ci = `${p?.documento_identidad || ""}`.toLowerCase();
      return !s || nombre.includes(s) || unidad.includes(s) || ci.includes(s);
    });
  }, [owners, query]);

  return (
    <div className="space-y-1">
      <span className="text-slate-700 text-sm">Propietario</span>
      <input
        className="input w-full"
        placeholder="Buscar por nombre, unidad o CI…"
        value={query}
        onChange={(e)=> setQuery(e.target.value)}
      />
      <select
        className="input mt-2 w-full"
        value={value || ""}
        onChange={(e)=> onChange(Number(e.target.value))}
      >
        <option value="" disabled>
          {loading ? "Cargando propietarios…" : "Selecciona un propietario"}
        </option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {labelPropietario(p)}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-slate-500">
          Seleccionado: {labelPropietario(owners.find((o)=> o.id === value))}
        </p>
      )}
    </div>
  );
}
function labelPropietario(p) {
  if (!p) return "";
  const u = p?.user || {};
  const nombre = `${u.first_name || ""} ${u.last_name || ""}`.trim();
  const unidad = `${p?.unidad?.numero || ""} - ${p?.unidad?.edificio || ""}`.trim();
  const ci = p?.documento_identidad || "";
  return `${nombre} · ${unidad} · CI ${ci}`;
}

/* ------ mapeo form → payload (maneja archivo) ------ */
function mapFormToPayload(form) {
  const hasFile = !!form.foto_file;
  if (hasFile) {
    const fd = new FormData();
    fd.append("tipo", form.tipo || "");
    fd.append("titulo", form.titulo || "");
    fd.append("descripcion", form.descripcion || "");
    fd.append("ubicacion", form.ubicacion || "");
    fd.append("estado", form.estado || "pendiente");
    fd.append("prioridad", String(form.prioridad ?? 3));
    // Normalizamos fecha a ISO (agregar ":00Z" si fuera necesario)
    const iso = toISO(form.fecha_reporte);
    if (iso) fd.append("fecha_reporte", iso);
    // backend espera propietario (id)
    fd.append("propietario", String(form.propietario_id || ""));
    fd.append("foto", form.foto_file); // campo "foto" en tu serializer
    // si además quieres enviar una URL alternativa, podrías tener otro campo como foto_url en el backend
    return { payload: fd, hasFile: true };
  }
  // JSON
  return {
    payload: {
      tipo: form.tipo || "",
      titulo: form.titulo || "",
      descripcion: form.descripcion || "",
      ubicacion: form.ubicacion || "",
      estado: form.estado || "pendiente",
      prioridad: form.prioridad ?? 3,
      fecha_reporte: toISO(form.fecha_reporte),
      propietario: form.propietario_id || null,
      // si tu backend acepta string URL en 'foto', lo mandamos
      ...(form.foto_url ? { foto: form.foto_url } : {}),
    },
    hasFile: false,
  };
}
function toISO(dtLocal) {
  if (!dtLocal) return null;
  // dtLocal viene yyyy-MM-ddTHH:mm (sin zona); creamos ISO con Z
  const d = new Date(dtLocal);
  return d.toISOString();
}
