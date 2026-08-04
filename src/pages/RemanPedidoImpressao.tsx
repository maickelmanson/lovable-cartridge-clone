import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import { useRef, useState } from "react";

function formatBRL(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPeso(value: string | null | undefined): string {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RemanPedidoImpressao() {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: order, isLoading: loadingOrder } = trpc.remanOrders.buscar.useQuery(orderId, { enabled: orderId > 0 });
  const { data: items, isLoading: loadingItems } = trpc.remanOrderItems.listar.useQuery(orderId, { enabled: orderId > 0 });
  const { data: relatorio, isLoading: loadingRelatorio } = trpc.remanOrders.relatorio.useQuery(orderId, { enabled: orderId > 0 });
  const { data: empresa } = trpc.empresa.obter.useQuery();

  // Todos os hooks DEVEM vir antes de qualquer return condicional (Regras dos Hooks)
  const contentRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isLoading = loadingOrder || loadingItems || loadingRelatorio;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
      </div>
    );
  }

  // Agrupar produtos: apenas itens com quantidade > 0 (funcionando)
  const produtosAgrupados = (items || [])
    .filter((item: any) => item.quantity > 0)
    .map((item: any) => ({
      modelo: item.modelo01 || item.descriptionSnapshot || "SEM MODELO",
      quantidade: item.quantity,
      valorUnit: parseFloat(item.unitPrice || "0"),
      total: parseFloat(item.lineTotal || "0"),
    }));

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!contentRef.current || !order) return;
    setExportingPdf(true);
    try {
      // Importação dinâmica para não aumentar o bundle inicial
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `Pedido-${order.orderNumber}-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(contentRef.current)
        .save();
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      alert("Erro ao gerar o PDF. Tente usar o botão Imprimir e salvar como PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Extrair bairro e cidade do endereço do cliente (pode vir como campo único)
  const clienteEndereco = order.clienteEndereco || "";

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de ações (não imprime) */}
      <div className="print:hidden flex items-center gap-3 p-4 border-b bg-muted/30">
        <Button variant="outline" size="sm" onClick={() => navigate(`/reman/pedidos/${orderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Pedido
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Conteúdo para impressão */}
      <div ref={contentRef} className="max-w-[210mm] mx-auto p-8 print:p-6 print:max-w-none text-black">

        {/* ===== CABEÇALHO: DADOS DA EMPRESA ===== */}
        <div className="flex items-start gap-6 mb-6 border-b-2 border-black pb-4">
          {empresa?.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={empresa.logoUrl}
                alt="Logo"
                className="h-20 w-auto object-contain"
              />
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold uppercase">{empresa?.empresa || "EMPRESA"}</h1>
            <div className="text-sm mt-1 space-y-0.5">
              {empresa?.endereco && (
                <p>{empresa.endereco}{empresa.numero ? `, ${empresa.numero}` : ""}{empresa.bairro ? ` - ${empresa.bairro}` : ""}</p>
              )}
              {(empresa?.cidade || empresa?.estado) && (
                <p>{empresa.cidade}{empresa.estado ? ` - ${empresa.estado}` : ""}</p>
              )}
              {empresa?.celular && <p>WhatsApp: {empresa.celular}</p>}
              {empresa?.cnpjCpf && <p>CNPJ: {empresa.cnpjCpf}</p>}
            </div>
          </div>
        </div>

        {/* ===== PEDIDO + DATA ===== */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Pedido {order.orderNumber}</h2>
          <p className="text-sm">Data do Pedido: <strong>{new Date(order.criadoEm).toLocaleDateString("pt-BR")}</strong></p>
        </div>

        {/* ===== DADOS DO CLIENTE ===== */}
        <div className="mb-6 border border-black">
          <div className="bg-gray-200 px-3 py-1 text-center font-bold text-sm border-b border-black">
            Dados do Cliente
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="px-3 py-1 font-semibold w-40 bg-gray-50 border-r border-gray-300">Nome/Razão Social</td>
                <td className="px-3 py-1 uppercase">{order.clienteNome || "-"}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="px-3 py-1 font-semibold bg-gray-50 border-r border-gray-300">Endereço</td>
                <td className="px-3 py-1 uppercase">{clienteEndereco || "-"}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="px-3 py-1 font-semibold bg-gray-50 border-r border-gray-300">Telefone</td>
                <td className="px-3 py-1">{order.clienteTelefone || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== TABELA DE PRODUTOS ===== */}
        <div className="mb-6">
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-left py-2 px-3 border border-black">Produto</th>
                <th className="text-center py-2 px-3 border border-black w-16">Qtd.</th>
                <th className="text-right py-2 px-3 border border-black w-28">Preço</th>
                <th className="text-right py-2 px-3 border border-black w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {produtosAgrupados.map((prod: any, idx: any) => (
                <tr key={idx}>
                  <td className="py-2 px-3 border border-black uppercase">{prod.modelo}</td>
                  <td className="py-2 px-3 border border-black text-center">{prod.quantidade}</td>
                  <td className="py-2 px-3 border border-black text-right">{formatBRL(prod.valorUnit)}</td>
                  <td className="py-2 px-3 border border-black text-right font-semibold">{formatBRL(prod.total)}</td>
                </tr>
              ))}
              {produtosAgrupados.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-2 px-3 border border-black text-center text-gray-500">
                    Nenhum produto funcionando
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-end gap-6 mt-2 text-sm">
            {parseFloat(order.discount || "0") > 0 && (
              <span>Desconto: <strong className="text-red-600">{formatBRL(order.discount)}</strong></span>
            )}
            <span>R$ Total: <strong className="text-lg">{formatBRL(order.total)}</strong></span>
          </div>
        </div>

        {/* ===== CARTUCHOS FUNCIONANDO ===== */}
        {relatorio?.funcionando && relatorio.funcionando.length > 0 && (
          <div className="mb-6">
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-green-100">
                  <th className="text-left py-2 px-3 border border-black">Modelo 02</th>
                  <th colSpan={2} className="text-center py-2 px-3 border border-black">Cartuchos Funcionando</th>
                </tr>
                <tr className="bg-green-50">
                  <th className="text-left py-2 px-3 border border-black"></th>
                  <th className="text-left py-2 px-3 border border-black">Código</th>
                  <th className="text-right py-2 px-3 border border-black w-32">Peso de Saída</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.funcionando.map((unit: any) => (
                  <tr key={unit.id}>
                    <td className="py-1.5 px-3 border border-black uppercase">{unit.modelo02 || "-"}</td>
                    <td className="py-1.5 px-3 border border-black uppercase">
                      {unit.unitCode}
                      {unit.protegido && <span className="ml-2 font-semibold">PROTEGIDO</span>}
                    </td>
                    <td className="py-1.5 px-3 border border-black text-right">{formatPeso(unit.outputWeight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== CARTUCHOS EM GARANTIA ===== */}
        {relatorio?.garantia && relatorio.garantia.length > 0 && (
          <div className="mb-6">
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="text-left py-2 px-3 border border-black">Modelo 02</th>
                  <th colSpan={2} className="text-center py-2 px-3 border border-black">Cartuchos Garantia</th>
                </tr>
                <tr className="bg-yellow-50">
                  <th className="text-left py-2 px-3 border border-black"></th>
                  <th className="text-left py-2 px-3 border border-black">Código</th>
                  <th className="text-right py-2 px-3 border border-black w-32">Peso de Saída</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.garantia.map((unit: any) => (
                  <tr key={unit.id}>
                    <td className="py-1.5 px-3 border border-black uppercase">{unit.modelo02 || "-"}</td>
                    <td className="py-1.5 px-3 border border-black uppercase">
                      {unit.unitCode}
                      {unit.protegido && <span className="ml-2 font-semibold">PROTEGIDO</span>}
                    </td>
                    <td className="py-1.5 px-3 border border-black text-right">{formatPeso(unit.outputWeight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}


        {/* ===== CARTUCHOS COM PROBLEMA ===== */}
        {relatorio?.comProblema && relatorio.comProblema.length > 0 && (
          <div className="mb-6">
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-red-100">
                  <th className="text-left py-2 px-3 border border-black">Modelo 02</th>
                  <th colSpan={2} className="text-center py-2 px-3 border border-black">Cartucho(s) com Problema</th>
                </tr>
                <tr className="bg-red-50">
                  <th className="text-left py-2 px-3 border border-black"></th>
                  <th className="text-left py-2 px-3 border border-black">Código</th>
                  <th className="text-left py-2 px-3 border border-black">Defeito</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.comProblema.map((unit: any) => (
                  <tr key={unit.id}>
                    <td className="py-1.5 px-3 border border-black uppercase">{unit.modelo02 || "-"}</td>
                    <td className="py-1.5 px-3 border border-black uppercase">
                      {unit.unitCode}
                      {unit.protegido && <span className="ml-2 font-semibold">PROTEGIDO</span>}
                    </td>
                    <td className="py-1.5 px-3 border border-black uppercase">{unit.defectType || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-400 print:mt-8">
          <p>Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
