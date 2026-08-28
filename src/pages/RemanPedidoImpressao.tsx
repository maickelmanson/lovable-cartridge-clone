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
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `Pedido-${order.orderNumber}-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
      await html2pdf()
        .set({
          margin: 0,
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

  const clienteEndereco = order.clienteEndereco || "";
  const telefones = [order.clienteTelefone, (order as any).clienteTelefone2]
    .filter((t: any) => t && String(t).trim())
    .join("  /  ");

  const Via = () => (
    <div className="via text-black">
      {/* ===== CABEÇALHO: LOGO À ESQUERDA + DADOS DA EMPRESA ===== */}
      <div className="flex items-center gap-2 mb-1.5 border-b border-black pb-1">
        {empresa?.logoUrl && (
          <img src={empresa.logoUrl} alt="Logo" className="h-16 w-auto object-contain flex-shrink-0" />
        )}
        <div className="flex-1 text-center leading-tight">
          <h1 className="font-bold uppercase text-[13px]">{empresa?.empresa || "EMPRESA"}</h1>
          <div className="leading-tight text-[11px] uppercase">
            {empresa?.endereco && (
              <div>
                {empresa.endereco}
                {empresa.numero ? `, ${empresa.numero}` : ""}
                {empresa.bairro ? ` - ${empresa.bairro}` : ""}
              </div>
            )}
            <div>
              {empresa?.cidade ? empresa.cidade : ""}
              {empresa?.estado ? `/${empresa.estado}` : ""}
            </div>
            <div>
              {empresa?.celular && <span>WhatsApp: {empresa.celular}</span>}
            </div>
            <div>{empresa?.cnpjCpf && <span>CNPJ: {empresa.cnpjCpf}</span>}</div>
          </div>
        </div>
      </div>

      {/* ===== PEDIDO + DATA ===== */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-bold">Pedido {order.orderNumber}</h2>
        <span>
          Data: <strong>{new Date(order.criadoEm).toLocaleDateString("pt-BR")}</strong>
        </span>
      </div>

      {/* ===== DADOS DO CLIENTE ===== */}
      <div className="mb-1.5 border border-black">
        <div className="bg-gray-200 px-1 text-center font-bold border-b border-black">Dados do Cliente</div>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-1 font-semibold w-24 bg-gray-50 border-r border-gray-300">Nome/Razão Social</td>
              <td className="px-1 uppercase">{order.clienteNome || "-"}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-1 font-semibold bg-gray-50 border-r border-gray-300">Endereço</td>
              <td className="px-1 uppercase">{clienteEndereco || "-"}</td>
            </tr>
            <tr>
              <td className="px-1 font-semibold bg-gray-50 border-r border-gray-300">Telefone(s)</td>
              <td className="px-1">{telefones || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== OBSERVAÇÃO GERAL ===== */}
      {(order as any).observacaoGeral && (
        <div className="mb-1.5 border border-black">
          <div className="bg-gray-200 px-1 text-center font-bold border-b border-black">Observações</div>
          <div className="px-1 uppercase whitespace-pre-wrap">{(order as any).observacaoGeral}</div>
        </div>
      )}


      {/* ===== TABELA DE PRODUTOS ===== */}
      <div className="mb-1">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left px-1 border border-black">Produto</th>
              <th className="text-center px-1 border border-black w-12">Qtd.</th>
              <th className="text-right px-1 border border-black w-20">Preço</th>
              <th className="text-right px-1 border border-black w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {produtosAgrupados.map((prod: any, idx: any) => (
              <tr key={idx}>
                <td className="px-1 border border-black uppercase">{prod.modelo}</td>
                <td className="px-1 border border-black text-center">{prod.quantidade}</td>
                <td className="px-1 border border-black text-right">{formatBRL(prod.valorUnit)}</td>
                <td className="px-1 border border-black text-right font-semibold">{formatBRL(prod.total)}</td>
              </tr>
            ))}
            {produtosAgrupados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-1 border border-black text-center text-gray-500">
                  Nenhum produto funcionando
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-end gap-4 mt-0.5">
          {parseFloat(order.discount || "0") > 0 && (
            <span>
              Desconto: <strong className="text-red-600">{formatBRL(order.discount)}</strong>
            </span>
          )}
          <span>
            R$ Total: <strong className="text-[11px] print:text-[10px]">{formatBRL(order.total)}</strong>
          </span>
        </div>
      </div>

      {/* ===== CARTUCHOS FUNCIONANDO ===== */}
      {relatorio?.funcionando && relatorio.funcionando.length > 0 && (
        <div className="mb-1">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-green-100">
                <th colSpan={3} className="text-center px-1 border border-black font-bold">
                  CARTUCHOS FUNCIONANDO
                </th>
              </tr>
              <tr className="bg-green-50">
                <th className="text-left px-1 border border-black">Modelo</th>
                <th className="text-left px-1 border border-black">Código</th>
                <th className="text-right px-1 border border-black w-24">Peso de Saída</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.funcionando.map((unit: any) => (
                <tr key={unit.id}>
                  <td className="px-1 border border-black uppercase">{unit.modelo02 || "-"}</td>
                  <td className="px-1 border border-black uppercase">
                    {unit.unitCode}
                    {unit.protegido && <span className="ml-1 font-semibold">PROTEGIDO</span>}
                  </td>
                  <td className="px-1 border border-black text-right">{formatPeso(unit.outputWeight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CARTUCHOS GARANTIA ===== */}
      {relatorio?.garantia && relatorio.garantia.length > 0 && (
        <div className="mb-1">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-yellow-100">
                <th colSpan={3} className="text-center px-1 border border-black font-bold">
                  CARTUCHOS GARANTIA
                </th>
              </tr>
              <tr className="bg-yellow-50">
                <th className="text-left px-1 border border-black">Modelo</th>
                <th className="text-left px-1 border border-black">Código</th>
                <th className="text-right px-1 border border-black w-24">Peso de Saída</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.garantia.map((unit: any) => (
                <tr key={unit.id}>
                  <td className="px-1 border border-black uppercase">{unit.modelo02 || "-"}</td>
                  <td className="px-1 border border-black uppercase">
                    {unit.unitCode}
                    {unit.protegido && <span className="ml-1 font-semibold">PROTEGIDO</span>}
                  </td>
                  <td className="px-1 border border-black text-right">{formatPeso(unit.outputWeight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== CARTUCHOS COM PROBLEMA ===== */}
      {relatorio?.comProblema && relatorio.comProblema.length > 0 && (
        <div className="mb-1">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-red-100">
                <th colSpan={3} className="text-center px-1 border border-black font-bold">
                  CARTUCHOS COM PROBLEMA
                </th>
              </tr>
              <tr className="bg-red-50">
                <th className="text-left px-1 border border-black">Modelo</th>
                <th className="text-left px-1 border border-black">Código</th>
                <th className="text-left px-1 border border-black">Defeito</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.comProblema.map((unit: any) => (
                <tr key={unit.id}>
                  <td className="px-1 border border-black uppercase">{unit.modelo02 || "-"}</td>
                  <td className="px-1 border border-black uppercase">
                    {unit.unitCode}
                    {unit.protegido && <span className="ml-1 font-semibold">PROTEGIDO</span>}
                  </td>
                  <td className="px-1 border border-black uppercase">{unit.defectType || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-2 pt-1 border-t border-gray-300 text-center text-gray-500">
        <p>
          {empresa?.empresa || "EMPRESA"} — documento gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
          {new Date().toLocaleTimeString("pt-BR")}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-0 bg-white">
      {/* Barra de ações (não imprime) */}
      <div className="print:hidden flex items-center gap-3 p-4 border-b bg-muted/30">
        <Button variant="outline" size="sm" onClick={() => navigate(`/reman/pedidos/${orderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Pedido
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir (2 vias)
        </Button>
        <Button size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
          {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Conteúdo para impressão — A4 retrato, duas vias empilhadas com conteúdo girado 90° */}
      <div ref={contentRef} className="print-doc mx-auto">
        <div className="via-half">
          <div className="via-rot">
            <Via />
          </div>
        </div>

        {/* Linha de corte horizontal no centro da folha */}
        <div className="cut-line" />

        <div className="via-half">
          <div className="via-rot">
            <Via />
          </div>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        .print-doc, .print-doc * { box-sizing: border-box; }
        .print-doc {
          width: 210mm;
          height: 297mm;
          background: #fff;
          position: relative;
          overflow: hidden;
        }
        .print-doc .via-half {
          width: 210mm;
          height: 148.5mm;
          position: relative;
          overflow: hidden;
        }
        .print-doc .via-rot {
          width: 148.5mm;
          height: 210mm;
          transform: translateY(148.5mm) rotate(-90deg);
          transform-origin: top left;
          padding: 4mm 5mm;
          font-size: 9px;
          line-height: 1.15;
          color: #000;
        }
        .print-doc .cut-line {
          position: absolute;
          top: 148.5mm;
          left: 0;
          width: 210mm;
          border-top: 1px dashed #666;
        }
        .print-doc table { width: 100%; }
        .print-doc td, .print-doc th { padding-top: 0; padding-bottom: 0; }

        @media screen {
          .print-doc {
            margin-top: 16px;
            margin-bottom: 24px;
            box-shadow: 0 0 0 1px #e5e5e5;
          }
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-doc {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: avoid;
            break-after: avoid;
          }
          .print\\:hidden { display: none !important; }
          header, footer, .no-print { display: none !important; }
        }
      `}</style>


    </div>
  );
}
