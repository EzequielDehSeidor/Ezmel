import { Tabs } from "@/components/layout/Tabs";
import { LegajoWizard } from "@/components/legajo/LegajoWizard";
import { ContratoWizard } from "@/components/contrato/ContratoWizard";

export default function HomePage() {
  return (
    <Tabs
      tabs={[
        { id: "crear-legajo", label: "Crear Legajo", content: <LegajoWizard /> },
        { id: "crear-contrato", label: "Crear Contrato", content: <ContratoWizard /> },
      ]}
    />
  );
}
