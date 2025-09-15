// /src/pages/Expensas.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchExpensas,
  createExpensa,
  updateExpensa,
  deleteExpensa,
} from "../api/expensasAPI";

const money = (v) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(
    Number(v ?? 0)
  );

const today = () => new Date().toISOString().slice(0, 10);

export default function Expensas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState(""); // búsqueda simple por mes o nombre
  const [ordering, setOrdering] = useState("-fecha_emision");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null); // objeto para editar
  const [confirm, setConfirm] = useState(null); // id a confirmar borrado
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      // Si tu backend soporta filtros/ordering, envíalos
      const params = {};
      if (ordering) params.ordering = ordering;
      // Si no tienes filtro de búsqueda en backend, filtramos en front
      const data = await fetchExpensas(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ordering]);

  // Filtro en front (por mes_referencia, nombre, unidad, estado)
  const filtered = useMemo(() => {
    if (!q?.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((it) => {
      const p = it?.propietario;
      const nombre =
        `${p?.user?.first_name || ""} ${p?.user?.last_name || ""}`.toLowerCase();
      const unidad = `${p?.unidad?.numero || ""} ${p?.unidad?.edificio || ""}`.toLowerCase();
      const estado = it?.pagada ? "pagada" : "pendiente";
      return (
        (it?.mes_referencia || "").toLowerCase().includes(s) ||
        nombre.includes(s) ||
        unidad.includes(s) ||
        estado.includes(s)
      );
    });
  }, [items, q]);

  const startCreate = () => {
    setEditing({
      propietario_id: "", // pedirás el ID del propietario
      mes_referencia: "", // YYYY-MM
      monto_total: "",
      cuota_basica: "",
      multas: "",
      reservas: "",
      otros: "",
      fecha_emision: today(),
      fecha_vencimiento: today(),
      pagada: false,
      fecha_pago: null,
    });
    setOpenForm(true);
  };

  const startEdit = (it) => {
    setEditing({
      id: it.id,
      propietario_id: it?.propietario?.id ?? "",
      mes_referencia: it?.mes_referencia ?? "",
      monto_total: it?.monto_total ?? "",
      cuota_basica: it?.cuota_basica ?? "",
      multas: it?.multas ?? "",
      reservas: it?.reservas ?? "",
      otros: it?.otros ?? "",
      fecha_emision: it?.fecha_emision ?? today(),
      fecha_vencimiento: it?.fecha_vencimiento ?? today(),
      pagada: !!it?.pagada,
      fecha_pago: it?.fecha_pago,
    });
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpensa(id);
      setConfirm(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.detail || e.message);
    }
  };

  const togglePagada = async (it) => {
    try {
      await updateExpensa(it.id, {
        pagada: !it.pagada,
        // si se marca como pagada, setea fecha_pago hoy; si no, null
        fecha_pago: !it.pagada ? today() : null,
      });
      await load();
    } catch (e) {
      alert(e?.response?.data?.detail || e.message);
    }
  };

  const onSubmit = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    try {
      const payload = mapFormToPayload(editing);
      if (editing.id) {
        await updateExpensa(editing.id, payload);
      } else {
        await createExpensa(payload);
      }
      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Expensas</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: mes, nombre, unidad, estado…"
            className="input"
          />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="input"
            title="Ordenar"
          >
            <option value="-fecha_emision">Más recientes</option>
            <option value="fecha_emision">Más antiguas</option>
            <option value="-monto_total">Monto: mayor a menor</option>
            <option value="monto_total">Monto: menor a mayor</option>
          </select>
          <button onClick={startCreate} className="btn-primary">
            + Nueva
          </button>
        </div>
      </header>

      {err && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {err}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <Th>Mes</Th>
              <Th>Propietario</Th>
              <Th>Unidad</Th>
              <Th className="text-right">Cuota</Th>
              <Th className="text-right">Multas</Th>
              <Th className="text-right">Reservas</Th>
              <Th className="text-right">Otros</Th>
              <Th className="text-right">Total</Th>
              <Th>Vence</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-slate-500">
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <Td>{it.mes_referencia}</Td>
                  <Td>
                    {it?.propietario?.user?.first_name} {it?.propietario?.user?.last_name}
                  </Td>
                  <Td>
                    {it?.propietario?.unidad?.numero} — {it?.propietario?.unidad?.edificio}
                  </Td>
                  <Td className="text-right">{money(it.cuota_basica)}</Td>
                  <Td className="text-right">{money(it.multas)}</Td>
                  <Td className="text-right">{money(it.reservas)}</Td>
                  <Td className="text-right">{money(it.otros)}</Td>
                  <Td className="text-right font-medium">{money(it.monto_total)}</Td>
                  <Td>{it.fecha_vencimiento}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        it.pagada
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {it.pagada ? "Pagada" : "Pendiente"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-ghost"
                        title="Editar"
                        onClick={() => startEdit(it)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-ghost"
                        title={it.pagada ? "Marcar como pendiente" : "Marcar como pagada"}
                        onClick={() => togglePagada(it)}
                      >
                        {it.pagada ? "↩️" : "✅"}
                      </button>
                      <button
                        className="btn-danger"
                        title="Eliminar"
                        onClick={() => setConfirm(it)}
                      >
                        🗑️
                      </button>
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
        <Modal onClose={() => setOpenForm(false)} title={editing?.id ? "Editar expensa" : "Nueva expensa"}>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field
                label="Propietario ID"
                type="number"
                value={editing.propietario_id}
                onChange={(v) => setEditing((s) => ({ ...s, propietario_id: v }))}
                required
              />
              <Field
                label="Mes referencia (YYYY-MM)"
                placeholder="2024-06"
                value={editing.mes_referencia}
                onChange={(v) => setEditing((s) => ({ ...s, mes_referencia: v }))}
                required
              />
              <Field
                label="Fecha emisión"
                type="date"
                value={editing.fecha_emision}
                onChange={(v) => setEditing((s) => ({ ...s, fecha_emision: v }))}
                required
              />
              <Field
                label="Fecha vencimiento"
                type="date"
                value={editing.fecha_vencimiento}
                onChange={(v) => setEditing((s) => ({ ...s, fecha_vencimiento: v }))}
                required
              />
            </div>

            <div className="grid sm:grid-cols-5 gap-3">
              <MoneyField label="Cuota básica" value={editing.cuota_basica} onChange={(v) => setEditing((s) => ({ ...s, cuota_basica: v }))} />
              <MoneyField label="Multas" value={editing.multas} onChange={(v) => setEditing((s) => ({ ...s, multas: v }))} />
              <MoneyField label="Reservas" value={editing.reservas} onChange={(v) => setEditing((s) => ({ ...s, reservas: v }))} />
              <MoneyField label="Otros" value={editing.otros} onChange={(v) => setEditing((s) => ({ ...s, otros: v }))} />
              <MoneyField label="Total" value={editing.monto_total} onChange={(v) => setEditing((s) => ({ ...s, monto_total: v }))} />
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editing.pagada}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      pagada: e.target.checked,
                      fecha_pago: e.target.checked ? s.fecha_pago || today() : null,
                    }))
                  }
                />
                <span>Pagada</span>
              </label>
              {editing.pagada && (
                <Field
                  label="Fecha de pago"
                  type="date"
                  value={editing.fecha_pago ?? today()}
                  onChange={(v) => setEditing((s) => ({ ...s, fecha_pago: v }))}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setOpenForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmación de borrado */}
      {confirm && (
        <Modal
          onClose={() => setConfirm(null)}
          title="Eliminar expensa"
        >
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar la expensa del mes <b>{confirm.mes_referencia}</b> de{" "}
            <b>{confirm?.propietario?.user?.first_name} {confirm?.propietario?.user?.last_name}</b>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => handleDelete(confirm.id)}>Eliminar</button>
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

const Field = ({ label, value, onChange, type = "text", placeholder, required }) => (
  <label className="block text-sm">
    <span className="text-slate-700">{label}</span>
    <input
      className="input mt-1 w-full"
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      type={type}
      placeholder={placeholder}
      required={required}
    />
  </label>
);

const MoneyField = ({ label, value, onChange }) => (
  <Field label={label} value={value} onChange={(v) => onChange(v)} type="number" />
);

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-ghost" onClick={onClose}>✖</button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* ---------- estilos utilitarios (Tailwind) ---------- */
/* Puedes mover estas clases a tu CSS global si prefieres */
