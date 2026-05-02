'use client'
import { useState } from "react";
import { Toast } from "./dashboard/ui";
import SectionCitas from "./dashboard/SectionCitas";
import SectionEquipo from "./dashboard/SectionEquipo";
import SectionServicios from "./dashboard/SectionServicios";
import SectionHorarios from "./dashboard/SectionHorarios";
import SectionAusencias from "./dashboard/SectionAusencias";
import SectionAnalitica from "./dashboard/SectionAnalitica";

export default function Dashboard({ empresaId, seccion }: { empresaId: string; seccion: string }) {
  const [toastState, setToastState] = useState({ msg: "", type: "success" });

  function showToast(msg: string, type = "success") {
    setToastState({ msg, type });
    setTimeout(() => setToastState({ msg: "", type: "success" }), 3000);
  }

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      {seccion === "citas"     && <SectionCitas     toast={showToast} empresaId={empresaId} />}
      {seccion === "equipo"    && <SectionEquipo    toast={showToast} empresaId={empresaId} />}
      {seccion === "servicios" && <SectionServicios toast={showToast} empresaId={empresaId} />}
      {seccion === "horarios"  && <SectionHorarios  toast={showToast} empresaId={empresaId} />}
      {seccion === "ausencias" && <SectionAusencias toast={showToast} empresaId={empresaId} />}
      {seccion === "analitica" && <SectionAnalitica empresaId={empresaId} />}
      <Toast message={toastState.msg} type={toastState.type} />
    </div>
  );
}
