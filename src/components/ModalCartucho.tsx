import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUsuariosAtivos } from "@/lib/usuariosAtivos";

const formatarPesoComVirgula = (valor: string) => {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, "");
  
  // Se tem menos de 3 dígitos, retorna com padding
  if (apenasNumeros.length <= 2) {
    return apenasNumeros.padStart(2, "0");
  }
  
  // Se tem 3 ou 4 dígitos, coloca virgula no meio (XX,YY)
  if (apenasNumeros.length <= 4) {
    const parte1 = apenasNumeros.slice(0, -2).padStart(2, "0");
    const parte2 = apenasNumeros.slice(-2);
    return `${parte1},${parte2}`;
  }
  
  // Se tem mais de 4 dígitos, limita a 4 e formata
  const limitado = apenasNumeros.slice(-4);
  const parte1 = limitado.slice(0, -2).padStart(2, "0");
  const parte2 = limitado.slice(-2);
  return `${parte1},${parte2}`;
};

interface Props {
  pedidoId: number;
  cartucho?: any;
  onSalvar: () => void;
  onFechar: () => void;
}

export default function ModalCartucho({ pedidoId, cartucho, onSalvar, onFechar }: Props) {
  const { user } = useAuth();
  const usuariosQuery = useUsuariosAtivos();
  const [form, setForm] = React.useState({
    cartuchoId: cartucho?.cartuchoId || null,
    codigo: cartucho?.codigo || "",
    pesoChegada: cartucho?.pesoChegada || "",
    pesoSaida: cartucho?.pesoSaida || "",
    protegido: cartucho?.protegido === 1,
    observacoes: cartucho?.observacoes || "",
    usuarioId: cartucho?.usuarioId || "",
  });

  // Ao criar um cartucho, o usuário logado vem pré-selecionado (pode ser trocado).
  React.useEffect(() => {
    if (!cartucho?.id && !form.usuarioId && user?.id) {
      setForm((prev) => (prev.usuarioId ? prev : { ...prev, usuarioId: user.id }));
    }
  }, [user?.id, cartucho?.id]);

  const [modalCriarAberto, setModalCriarAberto] = React.useState(false);
  const [novoModelo, setNovoModelo] = React.useState({ modelo01: "", modelo02: "" });
  const [modeloPopoverAberto, setModeloPopoverAberto] = React.useState(false);

  const modelosQuery = trpc.cartuchos.listar.useQuery();
  const criarMutation = trpc.pedidoCartuchos.adicionar.useMutation();
  const atualizarMutation = trpc.pedidoCartuchos.atualizar.useMutation();
  const criarModeloMutation = trpc.cartuchos.criar.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "pesoChegada" || name === "pesoSaida") {
      setForm(prev => ({
        ...prev,
        [name]: formatarPesoComVirgula(value)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: name === "codigo" ? value.toUpperCase() : value
      }));
    }
  };

  const handleProtegidoChange = (checked: boolean) => {
    setForm(prev => ({ ...prev, protegido: checked }));
  };

  const handleSalvar = async () => {
    if (!form.cartuchoId) {
      alert("Selecione um modelo de cartucho");
      return;
    }
    if (!form.codigo) {
      alert("Digite o código do cartucho");
      return;
    }

    try {
      const pesoChegada = form.pesoChegada ? parseFloat(form.pesoChegada.replace(",", ".")) : 0;
      const pesoSaida = form.pesoSaida ? parseFloat(form.pesoSaida.replace(",", ".")) : 0;

      if (cartucho?.id) {
        await atualizarMutation.mutateAsync({
          id: cartucho.id,
          cartuchoId: form.cartuchoId,
          codigo: form.codigo,
          pesoChegada,
          pesoSaida,
          protegido: form.protegido,
          observacoes: form.observacoes,
          usuarioId: form.usuarioId || null,
        });
      } else {
        await criarMutation.mutateAsync({
          pedidoId,
          cartuchoId: form.cartuchoId,
          codigo: form.codigo,
          pesoChegada,
          pesoSaida,
          protegido: form.protegido,
          observacoes: form.observacoes,
          usuarioId: form.usuarioId || null,
        });
      }
      onSalvar();
      onFechar();
    } catch (error) {
      console.error("Erro ao salvar cartucho:", error);
      alert("Erro ao salvar cartucho");
    }
  };

  const handleCriarModelo = async () => {
    if (!novoModelo.modelo01 || !novoModelo.modelo02) {
      alert("Preencha os campos de modelo");
      return;
    }

    try {
      const resultado = await criarModeloMutation.mutateAsync({
        modelo01: novoModelo.modelo01.toUpperCase(),
        modelo02: novoModelo.modelo02.toUpperCase(),
      });
      
      setForm(prev => ({ ...prev, cartuchoId: (resultado as any).insertId }));
      setNovoModelo({ modelo01: "", modelo02: "" });
      setModalCriarAberto(false);
      await modelosQuery.refetch();
    } catch (error) {
      console.error("Erro ao criar modelo:", error);
      alert("Erro ao criar modelo");
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onFechar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{cartucho ? "Editar Cartucho" : "Adicionar Cartucho"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Modelo Cadastrado</label>
              <div className="flex gap-2">
                <Popover open={modeloPopoverAberto} onOpenChange={setModeloPopoverAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modeloPopoverAberto}
                      className="flex-1 justify-between font-normal"
                    >
                      <span className="truncate">
                        {(() => {
                          const sel = modelosQuery.data?.find((m: any) => m.id === form.cartuchoId);
                          return sel ? `${sel.modelo02} - ${sel.modelo01}` : "Selecione um modelo...";
                        })()}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digite o número ou modelo do cartucho..." />
                      <CommandList>
                        <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {modelosQuery.data?.map((m: any) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.modelo02} ${m.modelo01}`}
                              onSelect={() => {
                                setForm((prev) => ({ ...prev, cartuchoId: m.id }));
                                setModeloPopoverAberto(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.cartuchoId === m.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {m.modelo02} - {m.modelo01}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button 
                  size="icon" 
                  onClick={() => setModalCriarAberto(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Código</label>
              <Input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                placeholder="Código do cartucho"
              />
            </div>

            <div>
                  <label className="text-sm font-medium">Peso de Chegada (g)</label>
              <Input
                name="pesoChegada"
                type="text"
                value={form.pesoChegada}
                onChange={handleChange}
                placeholder="00,00"
              />
            </div>

            <div>
                  <label className="text-sm font-medium">Peso de Saída (g)</label>
              <Input
                name="pesoSaida"
                type="text"
                value={form.pesoSaida}
                onChange={handleChange}
                placeholder="00,00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Usuário responsável</label>
              <Select
                value={form.usuarioId || ""}
                onValueChange={(value) => setForm((prev) => ({ ...prev, usuarioId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável..." />
                </SelectTrigger>
                <SelectContent>
                  {(usuariosQuery.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="protegido"
                checked={form.protegido}
                onCheckedChange={handleProtegidoChange}
              />
              <label htmlFor="protegido" className="text-sm font-medium cursor-pointer">
                Protegido
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                placeholder="Observações sobre este cartucho..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button onClick={handleSalvar} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalCriarAberto} onOpenChange={setModalCriarAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Modelo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Modelo 01 (Nome Completo)</label>
              <Input
                value={novoModelo.modelo01}
                onChange={(e) => setNovoModelo(prev => ({ ...prev, modelo01: e.target.value.toUpperCase() }))}
                placeholder="Ex: EPS 667 BK"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Modelo 02 (Abreviação)</label>
              <Input
                value={novoModelo.modelo02}
                onChange={(e) => setNovoModelo(prev => ({ ...prev, modelo02: e.target.value.toUpperCase() }))}
                placeholder="Ex: EPS667BK"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCriarAberto(false)}>Cancelar</Button>
            <Button onClick={handleCriarModelo} className="bg-blue-600 hover:bg-blue-700">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
