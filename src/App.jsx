import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Propietarios from "./pages/Propietarios";
import Expensas from "./pages/Expensas";
import Reservas from "./pages/Reservas";
import Visitas from "./pages/Visitas";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="expensas" element={<Expensas />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="visitas" element={<Visitas />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
