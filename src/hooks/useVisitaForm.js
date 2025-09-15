// /src/hooks/useVisitaForm.js
import { useState, useMemo } from "react";
import { toTime } from "../utils/datetime";


const EMPTY = {
    nombre_visitante: "",
    documento_identidad: "",
    telefono: "",
    fecha_visita: "",
    hora_inicio: "",
    hora_fin: "",
    placa_vehiculo: "",
    estado: "programada",
    propietario: "",
};


export default function useVisitaForm(initial) {
    const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
    const [errors, setErrors] = useState({});


    const isEdit = useMemo(() => Boolean(initial?.id || form?.id), [initial, form]);


    function update(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }


    function validate() {
        const e = {};
        if (!form.nombre_visitante?.trim()) e.nombre_visitante = "Requerido";
        if (!form.fecha_visita) e.fecha_visita = "Requerido";
        if (!form.hora_inicio) e.hora_inicio = "Requerido";
        if (!form.hora_fin) e.hora_fin = "Requerido";
        if (!form.propietario) e.propietario = "Requerido";
        // Normaliza horas
        form.hora_inicio = toTime(form.hora_inicio);
        form.hora_fin = toTime(form.hora_fin);
        setErrors(e);
        return Object.keys(e).length === 0;
    }


    function reset(next = EMPTY) {
        setForm({ ...EMPTY, ...(next || {}) });
        setErrors({});
    }


    return { form, setForm, update, errors, validate, reset, isEdit };
}