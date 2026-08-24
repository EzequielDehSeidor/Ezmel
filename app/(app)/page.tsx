import { Tabs } from "@/components/layout/Tabs";
import { LegajoWizard } from "@/components/legajo/LegajoWizard";

export default function HomePage() {
  return (
    <Tabs
      tabs={[
        { id: "crear-legajo", label: "Crear Legajo", content: <LegajoWizard /> },
      ]}
    />
  );
}
