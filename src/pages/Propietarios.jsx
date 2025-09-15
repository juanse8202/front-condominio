// src/pages/Propietarios.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchPropietarios,
  createPropietario,
  updatePropietario,
  deletePropietario,
} from "../api/propietariosAPI";

export default function Propietarios() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // objeto propietario o null
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // {type:'ok'|'err', msg:''}

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    telefono: "",
    unidad_numero: "",
    unidad_edificio: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      telefono: "",
      unidad_numero: "",
      unidad_edificio: "",
    });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      first_name: p?.user?.first_name || "",
      last_name: p?.user?.last_name || "",
      telefono: p?.telefono || "",
      unidad_numero: p?.unidad?.numero || "",
      unidad_edificio: p?.unidad?.edificio || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchPropietarios();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Error al cargar propietarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((p) => {
      const nombre = `${p?.user?.first_name || ""} ${p?.user?.last_name || ""}`.toLowerCase();
      const unidad = `${p?.unidad?.numero || ""} ${p?.unidad?.edificio || ""}`.toLowerCase();
      const tel = (p?.telefono || "").toLowerCase();
      return nombre.includes(t) || unidad.includes(t) || tel.includes(t);
    });
  }, [q, items]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      // Estructura de payload sugerida: ajusta a tu API real.
      const payload = {
        user: {
          first_name: form.first_name,
          last_name: form.last_name,
        },
        telefono: form.telefono || null,
        unidad: {
          numero: form.unidad_numero,
          edificio: form.unidad_edificio,
        },
      };

      if (editing) {
        await updatePropietario(editing.id, payload);
        setToast({ type: "ok", msg: "Propietario actualizado" });
      } else {
        await createPropietario(payload);
        setToast({ type: "ok", msg: "Propietario creado" });
      }
      setModalOpen(false);
      await load();
    } catch (e2) {
      setToast({ type: "err", msg: e2?.response?.data?.detail || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!confirm(`¿Eliminar al propietario ${p?.user?.first_name} ${p?.user?.last_name}?`)) return;
    try {
      await deletePropietario(p.id);
      setToast({ type: "ok", msg: "Eliminado correctamente" });
      await load();
    } catch (e) {
      setToast({ type: "err", msg: e?.response?.data?.detail || "No se pudo eliminar" });
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed z-50 top-4 right-4 rounded-xl px-4 py-3 shadow-lg text-sm ${
            toast.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
          onAnimationEnd={() => {}}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{toast.type === "ok" ? "Listo" : "Error"}</span>
            <span>·</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Propietarios</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 active:scale-[.98] transition"
        >
          <span className="text-lg">＋</span> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, unidad, edificio o teléfono…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">🔎</div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <p className="animate-pulse text-slate-500">Cargando propietarios…</p>
        </div>
      )}

      {err && !loading && (
        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          {err}
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">No se encontraron resultados.</p>
          <p className="text-slate-500 mt-1 text-sm">Prueba con otros términos o crea un nuevo registro.</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !err && filtered.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-600">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Unidad</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Edificio</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-700">{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {p.user?.first_name} {p.user?.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{p.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {p.unidad?.numero || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.unidad?.edificio || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{p.telefono || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => alert(JSON.stringify(p, null, 2))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        title="Ver"
                      >
                        👁 Ver
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
                        title="Eliminar"
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editing ? "Editar propietario" : "Nuevo propietario"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombres</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={onChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Apellidos</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={onChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Unidad (número)</label>
                  <input
                    name="unidad_numero"
                    value={form.unidad_numero}
                    onChange={onChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Edificio</label>
                  <input
                    name="unidad_edificio"
                    value={form.unidad_edificio}
                    onChange={onChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
