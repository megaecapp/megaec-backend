function formatarDataInput(data) {
  if (!data) return "-";
  let partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function gerarRelatorioMov() {
  let contaFiltro = document.getElementById("filtroContaMov")?.value || "";
  let inicio = document.getElementById("filtroInicio")?.value || "";
  let fim = document.getElementById("filtroFim")?.value || "";

  let entradas = 0;
  let saidas = 0;
  let saldo = 0;

  let linhas = "";

  let dados = mov.filter((m) => {
    if (contaFiltro && m.banco !== contaFiltro) return false;

    let dataMov = new Date(m.data);

    if (inicio && dataMov < new Date(inicio)) return false;
    if (fim && dataMov > new Date(fim)) return false;

    return true;
  });

  dados.forEach((m) => {
    let valor = converterValor(m.valor);

    let entrada = "";
    let saida = "";

    if (m.tipo === "Entrada") {
      entradas += valor;
      saldo += valor;
      entrada = formatarMoeda(valor);
    } else {
      saidas += valor;
      saldo -= valor;
      saida = formatarMoeda(valor);
    }

    linhas += `
      <tr>
        <td>${formatarDataBR(m.data)}</td>
        <td>${m.banco}</td>
        <td>${m.descricao}</td>
        <td style="color:#16a34a">${entrada}</td>
        <td style="color:#dc2626">${saida}</td>
        <td>${formatarMoeda(saldo)}</td>
      </tr>
    `;
  });

  let html = `
<html>
<head>
  <title>SCFP - Relatório</title>

  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      padding: 30px;
      background: #f9fafb;
      color: #1f2937;
      font-size: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 15px;
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
    Relatório - Livro Caixa
  </div>
</div>

<div style="font-size:18px;background:#f3f4f6;padding:14px;border-radius:8px;border-left:5px solid #16a34a;margin-bottom:20px;">
  <b>Período:</b> ${formatarDataInput(inicio)} até ${formatarDataInput(fim)}<br>
  <b>Conta:</b> ${contaFiltro || "Todas as contas"}
</div>

<div id="relatorioConteudo" style="margin-top:20px;">
<table>
<thead>
<tr>
<th>Data</th>
<th>Banco</th>
<th>Descrição</th>
<th>Entrada</th>
<th>Saída</th>
<th>Saldo</th>
</tr>
</thead>
<tbody>
${linhas}
</tbody>
</table>

<div style="margin-top:20px;">
<p style="color:#16a34a">Entradas: ${formatarMoeda(entradas)}</p>
<p style="color:#dc2626">Saídas: ${formatarMoeda(saidas)}</p>
<h3>Saldo Final: ${formatarMoeda(saldo)}</h3>
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
      filename: "SCFP_relatorio.pdf",
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape"
      }
    })
    .from(elemento)
    .save();
}

function compartilharWhatsApp() {
  let texto = "📊 SCFP - Relatório Financeiro\\n\\n";
  texto += "Período: ${formatarDataInput(inicio)} até ${formatarDataInput(fim)}\\n";
  texto += "Conta: ${contaFiltro || "Todas"}\\n\\n";
  texto += "Entradas: ${formatarMoeda(entradas)}\\n";
  texto += "Saídas: ${formatarMoeda(saidas)}\\n";
  texto += "Saldo: ${formatarMoeda(saldo)}";

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
