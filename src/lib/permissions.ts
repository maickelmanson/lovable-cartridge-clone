export type AppRole = "admin" | "gerente" | "vendedor" | "tecnico";

export type Permission =
  | "pedido.criar"
  | "pedido.editar"
  | "pedido.finalizar"
  | "pedido.reabrir"
  | "pedido.deletar"
  | "cartucho.status"
  | "cartucho.editar"
  | "cliente.criar"
  | "cliente.editar"
  | "cliente.deletar"
  | "modelo.gerenciar"
  | "empresa.editar"
  | "reman.finalizar"
  | "usuarios.gerenciar"
  | "auditoria.ver";

const MATRIX: Record<AppRole, Permission[] | "*"> = {
  admin: "*",
  gerente: [
    "pedido.criar",
    "pedido.editar",
    "pedido.finalizar",
    "pedido.reabrir",
    "cartucho.status",
    "cartucho.editar",
    "cliente.criar",
    "cliente.editar",
    "modelo.gerenciar",
    "empresa.editar",
    "reman.finalizar",
    "auditoria.ver",
  ],
  vendedor: [
    "pedido.criar",
    "pedido.editar",
    "cartucho.status",
    "cartucho.editar",
    "cliente.criar",
    "modelo.gerenciar",
  ],
  tecnico: ["cartucho.status"],
};

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowed = MATRIX[role];
  if (!allowed) return false;
  return allowed === "*" || allowed.includes(permission);
}

export const PERMISSION_LABEL: Partial<Record<Permission, string>> = {
  "pedido.criar": "criar pedidos",
  "pedido.editar": "editar pedidos",
  "pedido.finalizar": "finalizar pedidos",
  "pedido.reabrir": "reabrir pedidos",
  "pedido.deletar": "excluir pedidos",
  "cliente.criar": "cadastrar clientes",
  "cliente.editar": "editar clientes",
  "cliente.deletar": "excluir clientes",
  "empresa.editar": "alterar os dados da empresa",
  "reman.finalizar": "finalizar remanufatura",
  "usuarios.gerenciar": "gerenciar usuários",
  "auditoria.ver": "ver a auditoria",
};
