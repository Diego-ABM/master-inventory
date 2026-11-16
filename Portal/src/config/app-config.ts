import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Master Inventory",
  version: packageJson.version,
  copyright: `© ${currentYear}, Master Inventory.`,
  meta: {
    title: "Master Inventory - Inventario y ventas",
    description: "Sistema local de inventario y ventas para tienda de mascotas.",
  },
};
