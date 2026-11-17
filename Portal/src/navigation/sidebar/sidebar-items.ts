import {
  Bell,
  DatabaseBackup,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ReceiptText,
  ScrollText,
  ShoppingBag,
} from "lucide-react";

export type NavBadge = "new" | "updated" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Secciones",
    items: [
      {
        id: "panel",
        title: "Panel",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "inventario",
        title: "Inventario",
        url: "/dashboard/inventario",
        icon: Package,
      },
      {
        id: "favoritos",
        title: "Favoritos",
        url: "/dashboard/favoritos",
        icon: Heart,
      },
      {
        id: "alertas",
        title: "Alertas",
        url: "/dashboard/alertas",
        icon: Bell,
      },
      {
        id: "pedidos",
        title: "Pedidos",
        url: "/dashboard/pedidos",
        icon: ShoppingBag,
      },
      {
        id: "ventas",
        title: "Ventas",
        url: "/dashboard/ventas",
        icon: ReceiptText,
      },
    ],
  },
  {
    id: 2,
    label: "Sistema",
    items: [
      {
        id: "reportes",
        title: "Reportes",
        url: "/dashboard/reportes",
        icon: ScrollText,
      },
      {
        id: "respaldo",
        title: "Respaldo",
        url: "/dashboard/respaldo",
        icon: DatabaseBackup,
      },
    ],
  },
];
