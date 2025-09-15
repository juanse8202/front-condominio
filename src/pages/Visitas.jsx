import { useEffect, useMemo, useState } from "react";
import {
  fetchVisitas,
  createVisita,
  updateVisita,
  deleteVisita,
} from "../api/visitasAPI";

// Helpers
const ESTADOS = ["programada", "en_progreso", "finalizada", "cancelada"];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function EstadoBadge({ value }) {
  const map = {
    programada: "bg-blue-100 text-blue-700 ring-blue-200",
    en_progreso: "bg-amber-100 text-amber-700 ring-amber-200",
    finalizada: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    cancelada: "bg-rose-100 text-rose-700 ring-rose-200",
  };
  const styles = map[value] || "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span className={classNames(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ring-1",
      styles
    )}>
      {value}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  } catch { return d; }
}
function formatTime(t) {
  // admite "HH:MM:SS.ssssss" del backend -> "HH:MM"
  if (!t) return "";
  const [hh, mm] = t.split(":");
  return `${hh}:${mm}`;
}

const emptyForm = {
  nombre_visitante: "",
  documento_identidad: "",
  telefono: "",
  fecha_visita: "",
  hora_inicio: "",
  hora_fin: "",
  placa_vehiculo: "",
  propietario: "",
  estado: "programada",
};

export default function Visitas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Modales
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Paginación simple en cliente
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchVisitas();
        setItems(data);
      } catch (e) {
        setErr(e?.response?.data?.detail || e.message || "Error al cargar visitas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((v) =>
        (v.nombre_visitante || "").toLowerCase().includes(s) ||
        (v.documento_identidad || "").toLowerCase().includes(s) ||
        (v.telefono || "").toLowerCase().includes(s) ||
        (v.placa_vehiculo || "").toLowerCase().includes(s) ||
        String(v.propietario || "").toLowerCase().includes(s)
      );
    }
    if (estadoFilter) {
      list = list.filter((v) => v.estado === estadoFilter);
    }
    if (from) list = list.filter((v) => formatDate(v.fecha_visita) >= from);
    if (to) list = list.filter((v) => formatDate(v.fecha_visita) <= to);

    // orden por fecha_visita desc, luego hora_inicio
    list.sort((a, b) => {
      const aD = formatDate(a.fecha_visita);
      const bD = formatDate(b.fecha_visita);
      if (aD === bD) {
        return (b.hora_inicio || "").localeCompare(a.hora_inicio || "");
      }
      return bD.localeCompare(aD);
    });

    return list;
  }, [items, q, estadoFilter, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, fecha_visita: formatDate(new Date()) });
    setOpenForm(true);
  }
  function openEdit(v) {
    setEditing(v);
    setForm({
      nombre_visitante: v.nombre_visitante || "",
      documento_identidad: v.documento_identidad || "",
      telefono: v.telefono || "",
      fecha_visita: formatDate(v.fecha_visita),
      hora_inicio: formatTime(v.hora_inicio),
      hora_fin: formatTime(v.hora_fin),
      placa_vehiculo: v.placa_vehiculo || "",
      propietario: String(v.propietario ?? ""),
      estado: v.estado || "programada",
    });
    setOpenForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr("");

    // validaciones mínimas
    if (!form.nombre_visitante?.trim()) {
      setErr("El nombre del visitante es obligatorio.");
      setSubmitting(false);
      return;
    }
    if (!form.fecha_visita) {
      setErr("La fecha de visita es obligatoria.");
      setSubmitting(false);
      return;
    }
    if (!form.hora_inicio) {
      setErr("La hora de inicio es obligatoria.");
      setSubmitting(false);
      return;
    }
    if (!form.hora_fin) {
      setErr("La hora de fin es obligatoria.");
      setSubmitting(false);
      return;
    }
    if (!form.propietario) {
      setErr("El propietario es obligatorio (ID).");
      setSubmitting(false);
      return;
    }

    // payload acorde a tu API (hora con segundos)
    const payload = {
      nombre_visitante: form.nombre_visitante.trim(),
      documento_identidad: form.documento_identidad?.trim() || "",
      telefono: form.telefono?.trim() || "",
      fecha_visita: form.fecha_visita, // YYYY-MM-DD
      hora_inicio: form.hora_inicio.length === 5 ? `${form.hora_inicio}:00` : form.hora_inicio,
      hora_fin: form.hora_fin.length === 5 ? `${form.hora_fin}:00` : form.hora_fin,
      placa_vehiculo: form.placa_vehiculo?.trim() || "",
      propietario: Number(form.propietario),
      estado: form.estado,
    };

    try {
      if (editing) {
        const updated = await updateVisita(editing.id, payload);
        setItems((prev) => prev.map((x) => (x.id === editing.id ? updated : x)));
      } else {
        const created = await createVisita(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpenForm(false);
    } catch (e) {
      setErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id) {
    const ok = confirm("¿Eliminar esta visita? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await deleteVisita(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e?.response?.data?.detail || e.message || "Error al eliminar");
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Visitas</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v16m8-8H4"/></svg>
          Nueva visita
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, CI, teléfono, placa, propietario..."
          className="md:col-span-2 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tabla */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Visitante</th>
              <th className="px-4 py-3">CI / Tel.</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Horario</th>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Prop.</th>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-500">Cargando…</td></tr>
            )}
            {err && !loading && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-rose-600">{err}</td></tr>
            )}
            {!loading && !err && pageData.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-500">Sin resultados</td></tr>
            )}
            {pageData.map((v) => (
              <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{v.id}</td>
                <td className="px-4 py-3 font-medium">{v.nombre_visitante}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{v.documento_identidad || "-"}</div>
                  <div className="text-gray-500">{v.telefono || "-"}</div>
                </td>
                <td className="px-4 py-3">{formatDate(v.fecha_visita)}</td>
                <td className="px-4 py-3">
                  {formatTime(v.hora_inicio)} - {formatTime(v.hora_fin)}
                </td>
                <td className="px-4 py-3">{v.placa_vehiculo || "-"}</td>
                <td className="px-4 py-3"><EstadoBadge value={v.estado} /></td>
                <td className="px-4 py-3">{v.propietario}</td>
                <td className="px-4 py-3">
                  {v.qr_code ? (
                    <a
                      href={v.qr_code}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline"
                      title="Ver QR"
                    >
                      Ver QR
                    </a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(v)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-gray-100"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-gray-100"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {pageData.length} de {filtered.length} resultados
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >Anterior</button>
          <span className="text-sm">Página {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >Siguiente</button>
        </div>
      </div>

      {/* Modal Form */}
      {openForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Editar visita" : "Nueva visita"}
              </h2>
              <button onClick={() => setOpenForm(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            {err && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Nombre del visitante *</label>
                <input
                  value={form.nombre_visitante}
                  onChange={(e) => setForm({ ...form, nombre_visitante: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Documento de identidad</label>
                <input
                  value={form.documento_identidad}
                  onChange={(e) => setForm({ ...form, documento_identidad: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Propietario (ID) *</label>
                <input
                  type="number"
                  value={form.propietario}
                  onChange={(e) => setForm({ ...form, propietario: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Fecha de visita *</label>
                <input
                  type="date"
                  value={form.fecha_visita}
                  onChange={(e) => setForm({ ...form, fecha_visita: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Hora inicio (HH:MM) *</label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Hora fin (HH:MM) *</label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Placa vehículo</label>
                <input
                  value={form.placa_vehiculo}
                  onChange={(e) => setForm({ ...form, placa_vehiculo: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenForm(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
