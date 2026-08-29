import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCEP, formatDoc, formatPhone } from "@/lib/masks";
import { Building2, Save, Loader2, Upload, X } from "lucide-react";

export default function DadosEmpresa() {
  const { data: empresa, isLoading } = trpc.empresa.obter.useQuery();
  const salvarMutation = trpc.empresa.salvar.useMutation({
    onSuccess: () => {
      toast.success("Dados da empresa salvos com sucesso!");
      utils.empresa.obter.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message),
  });
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    empresa: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cnpjCpf: "",
    telefone: "",
    celular: "",
    email: "",
    nome: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (empresa) {
      setForm({
        empresa: empresa.empresa || "",
        cep: empresa.cep || "",
        endereco: empresa.endereco || "",
        numero: empresa.numero || "",
        bairro: empresa.bairro || "",
        cidade: empresa.cidade || "",
        estado: empresa.estado || "",
        cnpjCpf: empresa.cnpjCpf || "",
        telefone: empresa.telefone || "",
        celular: empresa.celular || "",
        email: empresa.email || "",
        nome: empresa.nome || "",
        logoUrl: empresa.logoUrl || "",
      });
      if (empresa.logoUrl) {
        setLogoPreview(empresa.logoUrl);
      }
    }
  }, [empresa]);

  const handleChange = (field: string, value: string) => {
    let valor = value;
    if (field === "cnpjCpf") valor = formatDoc(value);
    else if (field === "telefone" || field === "celular") valor = formatPhone(value);
    else if (field === "cep") valor = formatCEP(value);
    setForm((prev) => ({ ...prev, [field]: valor }));
  };

  const handleSalvar = () => {
    salvarMutation.mutate(form);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      // Redimensiona a imagem e salva como data URL no próprio registro da empresa
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error("Imagem inválida"));
          img.onload = () => {
            const max = 400;
            const escala = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas indisponível"));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });

      const novoForm = { ...form, logoUrl: dataUrl };
      setForm(novoForm);
      setLogoPreview(dataUrl);
      await salvarMutation.mutateAsync(novoForm);
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    handleChange("logoUrl", "");
    setLogoPreview(null);
  };

  // Buscar CEP via ViaCEP
  const handleBuscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      toast.error("CEP inválido. Informe 8 dígitos.");
      return;
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      toast.success("Endereço preenchido pelo CEP!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Dados da Empresa</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex gap-2">
              <label className="flex-1">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 cursor-pointer transition">
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Enviando..." : "Clique para enviar logo"}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {(form.logoUrl || logoPreview) && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center justify-center flex-1">
                  <img
                    src={logoPreview || form.logoUrl}
                    alt="Logo da empresa"
                    className="max-h-24 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Nome e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                value={form.empresa}
                onChange={(e) => handleChange("empresa", e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {/* CNPJ/CPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ / CPF</Label>
              <Input
                value={form.cnpjCpf}
                onChange={(e) => handleChange("cnpjCpf", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
          </div>

          {/* Telefones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                type="tel"
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Celular / WhatsApp</Label>
              <Input
                type="tel"
                value={form.celular}
                onChange={(e) => handleChange("celular", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <div className="flex gap-2">
                <Input
                  value={form.cep}
                  onChange={(e) => handleChange("cep", e.target.value)}
                  placeholder="00000-000"
                />
                <Button onClick={handleBuscarCep} variant="outline">
                  Buscar
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                placeholder="Rua, Avenida, etc"
              />
            </div>
          </div>

          {/* Número, Bairro, Cidade, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={form.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={form.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={form.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                placeholder="UF"
              />
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleSalvar}
              disabled={salvarMutation.isPending}
              className="gap-2"
            >
              {salvarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
