import { FormularioProducto } from "../_components/formulario-producto";

export default function PaginaNuevoProducto() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <FormularioProducto />
    </div>
  );
}
