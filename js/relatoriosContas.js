function gerarRelatorioContas() {
  let filtroMes = document.getElementById("filtroMes")?.value || "todos";
  let filtroCategoria =
    document.getElementById("filtroCategoria")?.value || "todas";

  let totalPago = 0;
  let totalAberto = 0;
  let totalAtrasado = 0;

  let linhas = "";

  let dados = contas.filter((c) => {
    if (filtroMes !== "todos" && c.mes != filtroMes) return false;
    if (filtroCategoria !== "todas" && c.categoria != filtroCategoria)
      return false;
    return true;
  });

  dados.forEach((c) => {
    let valor = converterValor(c.valor);

    let cor = "#1f2937";

    if (c.status === "Pago") {
      totalPago += valor;
      cor = "#16a34a";
    } else if (c.status === "Atrasado") {
      totalAtrasado += valor;
      cor = "#dc2626";
    } else {
      totalAberto += valor;
      cor = "#d97706";
    }

    linhas += `
      <tr>
        <td>${c.nome}</td>
        <td>${c.categoria}</td>        
        <td style="color:${cor}">${formatarMoeda(valor)}</td>
        <td>${c.status}</td>
      </tr>
    `;
  });

  let html = `
<html>
<head>
  <title>SCFP - Relatório Contas</title>

  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      padding: 30px;
      background: #f9fafb;
      color: #1f2937;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th {
      background: linear-gradient(90deg, #16a34a, #22c55e);
      color: white;
      padding: 10px;
    }

    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .btn {
      background: #16a34a;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      margin-right:10px;
    }
  </style>
</head>

<body>

<div id="relatorioPDF">

<div style="text-align:center; margin-bottom:20px;">
  <div style="display:flex;align-items:center;justify-content:center;gap:10px;color:#16a34a;font-size:22px;font-weight:700;">
    <i data-lucide="landmark"></i>
    <span>SCFP - Sistema de Controle Financeiro Pessoal</span>
  </div>

  <div style="margin-top:5px; font-size:18px; color:#374151;">
    Relatório - Contas a Pagar
  </div>
</div>

<div style="font-size:18px;background:#f3f4f6;padding:14px;border-radius:8px;border-left:5px solid #16a34a;margin-bottom:20px;">
  <b>Mês:</b> ${filtroMes === "todos" ? "Todos" : filtroMes}<br>
  <b>Categoria:</b> ${filtroCategoria === "todas" ? "Todas" : filtroCategoria}
</div>

<div id="relatorioConteudo">

<table>
<thead>
<tr>
<th>Conta</th>
<th>Categoria</th>
<th>Valor</th>
<th>Status</th>
</tr>
</thead>
<tbody>
${linhas}
</tbody>
</table>

<div style="margin-top:20px;">
<p style="color:#16a34a">Pagas: ${formatarMoeda(totalPago)}</p>
<p style="color:#d97706">Em Aberto: ${formatarMoeda(totalAberto)}</p>
<p style="color:#dc2626">Atrasadas: ${formatarMoeda(totalAtrasado)}</p>
<h3>Total Geral: ${formatarMoeda(totalPago + totalAberto + totalAtrasado)}</h3>
</div>

</div>

</div>

<br>

<button class="btn" onclick="window.exportarPDF()">📄 Baixar PDF</button>
<button class="btn" onclick="window.compartilharWhatsApp()">🟢 WhatsApp</button>

<script>
function exportarPDF() {
  let elemento = document.getElementById("relatorioPDF");

  html2pdf()
    .set({
      margin: 8,
      filename: "SCFP_contas.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .from(elemento)
    .save();
}

function compartilharWhatsApp() {
  let texto = "📊 SCFP - Contas a Pagar\\n\\n";
  texto += "Mês: ${filtroMes === "todos" ? "Todos" : filtroMes}\\n";
  texto += "Categoria: ${filtroCategoria === "todas" ? "Todas" : filtroCategoria}\\n\\n";
  texto += "Pagas: ${formatarMoeda(totalPago)}\\n";
  texto += "Abertas: ${formatarMoeda(totalAberto)}\\n";
  texto += "Atrasadas: ${formatarMoeda(totalAtrasado)}";

  let url = "https://wa.me/?text=" + encodeURIComponent(texto);
  window.open(url, "_blank");
}

lucide.createIcons();
</script>

</body>
</html>
`;

  let win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
