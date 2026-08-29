import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { formatCNPJ, formatPhone } from "@/lib/masks";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  X,
  ShoppingBag,
  Package,
  User,
  ChevronRight,
  Hash,
  Phone,
  CreditCard,
  Building2,
  FileText,
} from "lucide-react";

type TipoBusca = "geral" | "codigo" | "cliente" | "telefone" | "cpf" | "cnpj" | "pedido";

const TIPOS_BUSCA: { value: TipoBusca; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { value: "geral", label: "Geral", icon: <Search className="h-4 w-4" />, placeholder: "Buscar em tudo..." },
  { value: "codigo", label: "Código do Cartucho", icon: <Hash className="h-4 w-4" />, placeholder: "Ex: ABC123..." },
  { value: "cliente", label: "Nome do Cliente", icon: <User className="h-4 w-4" />, placeholder: "Nome do cliente..." },
  { value: "telefone", label: "Telefone", icon: <Phone className="h-4 w-4" />, placeholder: "Ex: (11) 99999-9999..." },
  { value: "cpf", label: "CPF", icon: <CreditCard className="h-4 w-4" />, placeholder: "Ex: 000.000.000-00..." },
  { value: "cnpj", label: "CNPJ", icon: <Building2 className="h-4 w-4" />, placeholder: "Ex: 00.000.000/0001-00..." },
  { value: "pedido", label: "Nº do Pedido", icon: <FileText className="h-4 w-4" />, placeholder: "Ex: PD0001..." },
];

export default function BuscaAvancada() {
  const [, setLocation] = useLocation();
  const [tipoBusca, setTipoBusca] = useState<TipoBusca>("geral");
  const [termoBusca, setTermoBusca] = useState("");
  const [termoAtivo, setTermoAtivo] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState<TipoBusca>("geral");
  const inputRef = useRef<HTMLInputElement>(null);

  const buscaQuery = trpc.busca.avancada.useQuery(
    { tipo: tipoAtivo, termo: termoAtivo },
    { enabled: termoAtivo.length >= 1 }
  );

  const handleBuscar = () => {
    const termo = termoBusca.trim();
    if (!termo) return;
    setTermoAtivo(termo);
    setTipoAtivo(tipoBusca);
  };

  const handleLimpar = () => {
    setTermoBusca("");
    setTermoAtivo("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBuscar();
  };

  const tipoSelecionado = TIPOS_BUSCA.find(t => t.value === tipoBusca)!;

  const resultados = buscaQuery.data;
  const totalResultados = (resultados?.pedidos?.length || 0) + (resultados?.cartuchos?.length || 0) + (resultados?.clientes?.length || 0);
  const semResultados = termoAtivo && !buscaQuery.isLoading && totalResultados === 0;

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-7 w-7 text-primary" />
          Busca Avançada
        </h1>
        <p className="text-muted-foreground mt-1">
          Pesquise por código de cartucho, cliente, telefone, CPF/CNPJ ou número de pedido.
        </p>
      </div>

      {/* Formulário de busca */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Linha de filtros */}
          <div className="flex gap-3 flex-wrap">
            {/* Tipo de busca */}
            <Select value={tipoBusca} onValueChange={(v) => setTipoBusca(v as TipoBusca)}>
              <SelectTrigger className="w-52">
                <div className="flex items-center gap-2">
                  {tipoSelecionado.icon}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_BUSCA.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      {t.icon}
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campo de busca */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={tipoSelecionado.placeholder}
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9"
                autoFocus
              />
              {termoBusca && (
                <button
                  onClick={handleLimpar}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Botões */}
            <Button onClick={handleBuscar} disabled={!termoBusca.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            {termoAtivo && (
              <Button variant="outline" onClick={handleLimpar}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {/* Chips de tipo rápido */}
          <div className="flex gap-2 flex-wrap">
            {TIPOS_BUSCA.map(t => (
              <button
                key={t.value}
                onClick={() => setTipoBusca(t.value)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  tipoBusca === t.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Estado de carregamento */}
      {buscaQuery.isLoading && termoAtivo && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-3 animate-pulse" />
          <p>Buscando por "<strong>{termoAtivo}</strong>"...</p>
        </div>
      )}

      {/* Sem resultados */}
      {semResultados && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhum resultado encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Não encontramos nada para "<strong>{termoAtivo}</strong>" no tipo <strong>{TIPOS_BUSCA.find(t => t.value === tipoAtivo)?.label}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mt-1">Tente outro termo ou mude o tipo de busca.</p>
        </Card>
      )}

      {/* Resultados */}
      {resultados && totalResultados > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>{totalResultados}</strong> resultado(s) para "<strong>{termoAtivo}</strong>"
          </p>

          {/* Resultados: Clientes */}
          {resultados.clientes && resultados.clientes.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/50 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Clientes</h3>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {resultados.clientes.length}
                </span>
              </div>
              <div className="divide-y">
                {resultados.clientes.map((cliente: any) => (
                  <div
                    key={cliente.id}
                    className="px-6 py-4 hover:bg-accent cursor-pointer flex items-center gap-4 group"
                    onClick={() => setLocation(`/clientes/${cliente.id}`)}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{cliente.nome}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-0.5 flex-wrap">
                        {cliente.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(cliente.telefone)}</span>}
                        {cliente.cpf && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />CPF: {cliente.cpf}</span>}
                        {cliente.cnpj && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />CNPJ: {formatCNPJ(cliente.cnpj)}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cliente.commercialProfile === "REVENDA" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {cliente.commercialProfile === "REVENDA" ? "Revenda" : "Cliente Final"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resultados: Pedidos */}
          {resultados.pedidos && resultados.pedidos.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/50 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Pedidos</h3>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {resultados.pedidos.length}
                </span>
              </div>
              <div className="divide-y">
                {resultados.pedidos.map((p: any) => (
                  <div
                    key={p.id}
                    className="px-6 py-4 hover:bg-accent cursor-pointer flex items-center gap-4 group"
                    onClick={() => setLocation(`/pedidos/${p.id}`)}
                  >
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-base">#{p.numero}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.status === "finalizado"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {p.status === "finalizado" ? "Finalizado" : "Aberto"}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.clienteNome || "—"}</span>
                        <span>Criado em {new Date(p.dataCriacao).toLocaleDateString("pt-BR")}</span>
                        {p.dataFinalizacao && (
                          <span>Finalizado em {new Date(p.dataFinalizacao).toLocaleDateString("pt-BR")}</span>
                        )}
                        {p.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(p.telefone)}</span>}
                        {p.cpf && <span>CPF: {p.cpf}</span>}
                        {p.cnpj && <span>CNPJ: {formatCNPJ(p.cnpj)}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resultados: Cartuchos */}
          {resultados.cartuchos && resultados.cartuchos.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/50 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Cartuchos</h3>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {resultados.cartuchos.length}
                </span>
              </div>
              <div className="divide-y">
                {resultados.cartuchos.map((c: any) => (
                  <div
                    key={c.id}
                    className="px-6 py-4 hover:bg-accent cursor-pointer flex items-center gap-4 group"
                    onClick={() => setLocation(`/pedidos/${c.pedidoId}`)}
                  >
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold">{c.codigo || "—"}</span>
                        {c.modelo02 && <span className="text-sm font-medium">{c.modelo02}</span>}
                        {c.modelo01 && <span className="text-sm text-muted-foreground">{c.modelo01}</span>}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-0.5 flex-wrap">
                        {c.clienteNome && <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.clienteNome}</span>}
                        {c.pedidoNumero && <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Pedido #{c.pedidoNumero}</span>}
                        {c.dataInclusao && <span>Incluído em {new Date(c.dataInclusao).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">Ver pedido</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Estado inicial (sem busca ativa) */}
      {!termoAtivo && !buscaQuery.isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg font-semibold text-muted-foreground">Pronto para buscar</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Selecione o tipo de busca e digite o termo acima. Você pode buscar por nome de cliente,
            código de cartucho, telefone, CPF, CNPJ ou número de pedido.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {TIPOS_BUSCA.filter(t => t.value !== "geral").map(t => (
              <button
                key={t.value}
                onClick={() => { setTipoBusca(t.value); inputRef.current?.focus(); }}
                className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-sm"
              >
                <span className="text-primary">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
