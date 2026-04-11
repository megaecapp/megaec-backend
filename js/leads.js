const supabaseUrl = "https://rjiydewkobfbevzfrxbz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXlkZXdrb2JmYmV2emZyeGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODEyOTksImV4cCI6MjA4OTA1NzI5OX0.QvooykPpjtAptqIYG2cIsnTv7yZeNyNFQ5QirgaKeQ8";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
async function carregarLeads() {
  const { data, error } = await supabaseClient
    .from("leads_vendas")
    .select("*")
    .order("data", { ascending: false });

  if (error) {
    console.error("Erro ao carregar leads:", error);
    return;
  }

  const lista = document.getElementById("lista-leads");
  lista.innerHTML = "";

  let total = data.length;
  let pagos = 0;
  let pendentes = 0;

  data.forEach((lead) => {
    if ((lead.status_pagamento || "").toLowerCase() === "pago") {
      pagos++;
    } else {
      pendentes++;
    }

    const linha = document.createElement("div");
    linha.className = "linha-lead";

    linha.innerHTML = `
  <div>${lead.nome}</div>
  <div>${lead.email}</div>
  <div>${lead.whatsapp}</div>
 <div>${lead.plano_nome ? lead.plano_nome.toUpperCase() : "---"}</div>
  <div>R$ ${lead.valor}</div>
  <div>${lead.vendedor}</div>
  <div>
    <button class="btn-status ${lead.status_pagamento.toLowerCase() === "pago" ? "pago" : "pendente"}" 
onclick="alternarStatus('${lead.id}', '${lead.status_pagamento}')">
  ${lead.status_pagamento}
</button>
  </div>
  <div>
  <button class="btn-acesso ${lead.acesso_criado ? "ok" : "pendente"}"
    onclick="alternarAcesso('${lead.id}', ${lead.acesso_criado})">
    ${lead.acesso_criado ? "criado" : "pendente"}
  </button>
</div>
<div>
  <button class="btn-msg"
    onclick="copiarMensagem(
  '${lead.nome}', 
  '${lead.email}', 
  '${lead.whatsapp}', 
  '${lead.plano_nome}',
  '${lead.valor}',
  '${lead.data}'
)">
    copiar
  </button>
</div>
`;

    lista.appendChild(linha);
  });

  document.getElementById("total-leads").textContent = total;
  document.getElementById("total-pagos").textContent = pagos;
  document.getElementById("total-pendentes").textContent = pendentes;
}

carregarLeads();

async function alternarStatus(id, statusAtual) {
  const novoStatus =
    statusAtual.toLowerCase() === "pendente" ? "pago" : "pendente";

  const { error } = await supabaseClient
    .from("leads_vendas")
    .update({ status_pagamento: novoStatus })
    .eq("id", id);

  if (error) {
    mostrarAviso("Erro ao atualizar status");
    console.error(error);
    return;
  }

  carregarLeads();
}
async function alternarAcesso(id, statusAtual) {
  const novoStatus = !statusAtual;

  const { error } = await supabaseClient
    .from("leads_vendas")
    .update({ acesso_criado: novoStatus })
    .eq("id", id);

  if (error) {
    mostrarAviso("Erro ao atualizar acesso");
    console.error(error);
    return;
  }

  carregarLeads();
}

function copiarMensagem(nome, email, whatsapp, plano, valor, dataPagamento) {
  let infoPlano = "";

  const planoFormatado = (plano || "").toLowerCase();

  // 👉 usa data real do pagamento
  const dataBase = dataPagamento ? new Date(dataPagamento) : new Date();

  if (planoFormatado.includes("semestral")) {
    const dataRenovacao = new Date(dataBase);
    dataRenovacao.setMonth(dataRenovacao.getMonth() + 6);

    const dataFormatada = dataRenovacao.toLocaleDateString("pt-BR");

    infoPlano = `📅 Renovação semestral: ${dataFormatada}`;
  } else if (planoFormatado.includes("anual")) {
    const dataRenovacao = new Date(dataBase);
    dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);

    const dataFormatada = dataRenovacao.toLocaleDateString("pt-BR");

    infoPlano = `📅 Renovação anual: ${dataFormatada}`;
  } else if (planoFormatado.includes("permanente")) {
    infoPlano = `💎  Acesso permanente - sem renovação`;
  } else {
    infoPlano = "🔄 Renovação: conforme plano contratado";
  }

  const mensagem = `
Olá ${nome}, tudo bem? 😊

Seja bem-vindo ao SCFP 🚀
Seu sistema de controle financeiro pessoal.

Seu acesso foi liberado com sucesso.

📧 Login: ${email}
🔑 Senha: (informada pelo suporte)

📦 Plano: ${plano ? plano : "Plano não informado"}
💰 Valor: R$ ${valor}
${infoPlano}

📊 Acesse sua plataforma:
👉 SCFP (acesso seguro 🔒):
https://scfpsistema.github.io/login.html

Em breve você poderá acessar o sistema.

Qualquer dúvida estou à disposição 👍
`;
  navigator.clipboard.writeText(mensagem);
  mostrarAviso("Mensagem copiada!", "sucesso");
}

function mostrarAviso(msg, tipo = "erro") {
  const popup = document.getElementById("popupAviso");
  const mensagem = document.getElementById("mensagemAviso");
  const titulo = popup.querySelector("h3");

  mensagem.innerText = msg;

  popup.classList.remove("avisoSucesso", "avisoErro");

  if (tipo === "sucesso") {
    titulo.innerHTML = "✅ Sucesso";
    popup.classList.add("avisoSucesso");
  } else {
    titulo.innerHTML = "⚠ Atenção";
    popup.classList.add("avisoErro");
  }

  popup.style.display = "flex";

  // 👇 AQUI (exatamente aqui)
  setTimeout(() => {
    fecharAviso();
  }, 3000);
}

function fecharAviso() {
  document.getElementById("popupAviso").style.display = "none";
}
