import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mascaraCPF, mascaraCNPJ, validarCPF, validarCNPJ, mascaraTelefone, validarTelefone } from "@/lib/cpfCnpjValidation";
import { formatCNPJ, formatPhone } from "@/lib/masks";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  cliente?: any;
  onSalvar: (data: any) => void;
  onFechar: () => void;
}

export default function ModalCliente({ cliente, onSalvar, onFechar }: Props) {
  const [form, setForm] = useState({
    nome: "",
    tipoPessoa: "FISICA" as "FISICA" | "JURIDICA",
    primeiroNome: "",
    sobrenome: "",
    razaoSocial: "",
    nomeFantasia: "",
    responsavelNome: "",
    telefone: "",
    telefone2: "",
    endereco: "",
    cpf: "",
    cnpj: "",
    inscricaoEstadual: "",
    commercialProfile: "CLIENTE_FINAL" as "CLIENTE_FINAL" | "REVENDA",
    observacoes: "",
    creditoPendente: "",
    creditoObservacao: "",
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || "",
        tipoPessoa: (cliente.tipoPessoa === "JURIDICA" || (!cliente.tipoPessoa && cliente.cnpj)) ? "JURIDICA" : "FISICA",
        primeiroNome: cliente.primeiroNome || (cliente.tipoPessoa ? "" : cliente.nome || ""),
        sobrenome: cliente.sobrenome || "",
        razaoSocial: cliente.razaoSocial || "",
        nomeFantasia: cliente.nomeFantasia || "",
        responsavelNome: cliente.responsavelNome || "",
        telefone: cliente.telefone || "",
        telefone2: cliente.telefone2 || "",
        endereco: cliente.endereco || "",
        cpf: cliente.cpf || "",
        cnpj: cliente.cnpj || "",
        inscricaoEstadual: cliente.inscricaoEstadual || "",
        commercialProfile: cliente.commercialProfile || "CLIENTE_FINAL",
        observacoes: cliente.observacoes || "",
        creditoPendente: cliente.creditoPendente ? String(cliente.creditoPendente).replace(".", ",") : "",
        creditoObservacao: cliente.creditoObservacao || "",
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let valorFormatado = value;
    
    // Aplicar máscara para CPF, CNPJ e Telefone
    if (name === "cpf") {
      valorFormatado = mascaraCPF(value);
    } else if (name === "cnpj") {
      valorFormatado = formatCNPJ(value);
    } else if (name === "telefone" || name === "telefone2") {
      valorFormatado = formatPhone(value);
    } else if (name === "creditoPendente") {
      valorFormatado = value.replace(/[^\d.,]/g, "");
    } else if (name !== "observacoes" && name !== "creditoObservacao") {
      // Maiúsculas para todos os campos exceto observações
      valorFormatado = value.toUpperCase();
    }
    
    setForm(f => ({ ...f, [name]: valorFormatado }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pj = form.tipoPessoa === "JURIDICA";
    if (pj && !form.razaoSocial.trim()) {
      alert("A razão social é obrigatória.");
      return;
    }
    if (!pj && !form.primeiroNome.trim()) {
      alert("O primeiro nome do cliente é obrigatório.");
      return;
    }
    
    // Validar CPF se preenchido
    if (!pj && form.cpf.trim() && !validarCPF(form.cpf)) {
      alert("CPF inválido. Verifique os dígitos verificadores.");
      return;
    }
    
    // Validar CNPJ se preenchido
    if (pj && form.cnpj.trim() && !validarCNPJ(form.cnpj)) {
      alert("CNPJ inválido. Verifique os dígitos verificadores.");
      return;
    }
    
    const nomeExibicao = pj
      ? (form.nomeFantasia.trim() || form.razaoSocial.trim())
      : [form.primeiroNome.trim(), form.sobrenome.trim()].filter(Boolean).join(" ");
    const creditoNumero = Number(String(form.creditoPendente).replace(/\./g, "").replace(",", ".")) || 0;
    onSalvar({
      ...form,
      creditoPendente: creditoNumero,
      creditoObservacao: form.creditoObservacao,
      nome: nomeExibicao || form.nome,
      cpf: pj ? "" : form.cpf,
      cnpj: pj ? form.cnpj : "",
      inscricaoEstadual: pj ? form.inscricaoEstadual : "",
      razaoSocial: pj ? form.razaoSocial : "",
      nomeFantasia: pj ? form.nomeFantasia : "",
      responsavelNome: pj ? form.responsavelNome : "",
      primeiroNome: pj ? "" : form.primeiroNome,
      sobrenome: pj ? "" : form.sobrenome,
    });
  };
  
  // Função para verificar se CPF é válido
  const isCPFValido = !form.cpf.trim() || validarCPF(form.cpf);
  
  // Função para verificar se CNPJ é válido
  const isCNPJValido = !form.cnpj.trim() || validarCNPJ(form.cnpj);

  return (
    <Dialog open={true} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Tipo de Pessoa</label>
              <select
                name="tipoPessoa"
                value={form.tipoPessoa}
                onChange={(e) => setForm(f => ({ ...f, tipoPessoa: e.target.value as "FISICA" | "JURIDICA" }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="FISICA">Pessoa Física (CPF)</option>
                <option value="JURIDICA">Pessoa Jurídica (CNPJ)</option>
              </select>
            </div>

            {form.tipoPessoa === "FISICA" ? (
              <>
                <div>
                  <label className="text-sm font-medium">Primeiro Nome *</label>
                  <Input
                    name="primeiroNome"
                    value={form.primeiroNome}
                    onChange={handleChange}
                    placeholder="PRIMEIRO NOME"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sobrenome</label>
                  <Input
                    name="sobrenome"
                    value={form.sobrenome}
                    onChange={handleChange}
                    placeholder="SOBRENOME"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Razão Social *</label>
                  <Input
                    name="razaoSocial"
                    value={form.razaoSocial}
                    onChange={handleChange}
                    placeholder="RAZÃO SOCIAL"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nome Fantasia</label>
                  <Input
                    name="nomeFantasia"
                    value={form.nomeFantasia}
                    onChange={handleChange}
                    placeholder="NOME FANTASIA"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Responsável (Primeiro Nome)</label>
                  <Input
                    name="responsavelNome"
                    value={form.responsavelNome}
                    onChange={handleChange}
                    placeholder="PRIMEIRO NOME DO RESPONSÁVEL"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Celular / Telefone 2</label>
              <Input
                name="telefone2"
                value={form.telefone2}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Perfil Comercial</label>
              <select
                name="commercialProfile"
                value={form.commercialProfile}
                onChange={(e) => setForm(f => ({ ...f, commercialProfile: e.target.value as "CLIENTE_FINAL" | "REVENDA" }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="CLIENTE_FINAL">Cliente Final</option>
                <option value="REVENDA">Revenda</option>
              </select>
            </div>

            {form.tipoPessoa === "FISICA" ? (
              <>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                CPF
                {form.cpf.trim() && (
                  isCPFValido ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )
                )}
              </label>
              <Input
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className={form.cpf.trim() && !isCPFValido ? "border-red-500" : ""}
              />
              {form.cpf.trim() && !isCPFValido && (
                <p className="text-xs text-red-600 mt-1">CPF inválido</p>
              )}
            </div>

              </>
            ) : (
              <>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                CNPJ
                {form.cnpj.trim() && (
                  isCNPJValido ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )
                )}
              </label>
              <Input
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className={form.cnpj.trim() && !isCNPJValido ? "border-red-500" : ""}
              />
              {form.cnpj.trim() && !isCNPJValido && (
                <p className="text-xs text-red-600 mt-1">CNPJ inválido</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Inscrição Estadual</label>
              <Input
                name="inscricaoEstadual"
                value={form.inscricaoEstadual}
                onChange={handleChange}
                placeholder="INSCRIÇÃO ESTADUAL"
              />
            </div>

              </>
            )}

            <div className="col-span-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                placeholder="ENDEREÇO"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                placeholder="Observações sobre o cliente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
