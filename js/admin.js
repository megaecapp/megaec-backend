let listaUsuariosGlobal = [];
let planoEditandoId = null;
// 🔥 CONFIGURAÇÃO DO SUPABASE
const supabaseUrl = "https://rjiydewkobfbevzfrxbz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXlkZXdrb2JmYmV2emZyeGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODEyOTksImV4cCI6MjA4OTA1NzI5OX0.QvooykPpjtAptqIYG2cIsnTv7yZeNyNFQ5QirgaKeQ8";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 🔐 GERAR SENHA
function gerarSenha() {
  const tamanho = Math.floor(Math.random() * 3) + 6; // 6, 7 ou 8
  let senha = "";

  for (let i = 0; i < tamanho; i++) {
    senha += Math.floor(Math.random() * 10);
  }

  return senha;
}

// 🚀 CRIAR USUÁRIO
// 🚀 CRIAR USUÁRIO
async function criarUsuario() {
  const email = document.getElementById("novoEmail").value.trim();

  if (!email) {
    mostrarAviso("Digite o email");
    return;
  }

  const senha = gerarSenha();

  // 🔥 cria no AUTH
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: senha,
  });

  if (error) {
    mostrarAviso("Erro ao criar usuário: " + error.message);
    return;
  }

  // 🔥 GARANTE QUE PEGAMOS O ID REAL
  const userId = data?.user?.id;

  if (!userId) {
    mostrarAviso("Erro: ID do usuário não retornado");
    return;
  }

  // 🔥 MOSTRA RESULTADO
  resultado.innerHTML = `
    <strong>✅ Acesso criado com sucesso</strong><br><br>
    📧 Email: ${email}<br>
    🔑 Senha: ${senha}
    <button onclick="copiarAcesso('${email}', '${senha}')">
      📋 Copiar acesso
    </button>
  `;

  // 🔥 SALVA NO BANCO COM ID CORRETO
  const { error: errorInsert } = await supabaseClient
    .from("usuarios_admin")
    .insert([
      {
        id: userId,
        email: email,
        senha: senha,
      },
    ]);

  if (errorInsert) {
    mostrarAviso("Erro ao salvar no banco: " + errorInsert.message);
    return;
  }

  // 🔥 ATUALIZA O LEAD PELO ID (FORMA SEGURA)
  // 🔥 PEGA O ID DO LEAD SALVO
  const leadId = localStorage.getItem("lead_id");

  console.log("🔥 LEAD ID RECUPERADO:", leadId);

  if (leadId) {
    const { error } = await supabaseClient
      .from("leads_vendas")
      .update({ acesso_criado: true })
      .eq("id", leadId);

    if (error) {
      console.error("Erro ao atualizar acesso:", error);
    } else {
      console.log("✅ ACESSO LIBERADO PARA LEAD:", leadId);
    }
  } else {
    console.log("❌ NÃO EXISTE LEAD_ID SALVO");
  }

  carregarUsuarios();
  carregarLeads();

  document.getElementById("novoEmail").value = "";
  document.getElementById("novoEmail").focus();
}
function copiarAcesso(email, senha) {
  const texto = `Acesso ao sistema SCFP:

Email: ${email}
Senha: ${senha}`;

  navigator.clipboard.writeText(texto);

  mostrarAviso("Acesso copiado!");
}
async function carregarUsuarios() {
  const { data, error } = await supabaseClient
    .from("usuarios_admin")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.log("Erro ao carregar usuários");
    return;
  }

  const lista = document.getElementById("listaUsuarios");
  const total = document.getElementById("totalUsuarios");
  if (total) total.textContent = data.length;

  if (!lista) return;

  lista.innerHTML = "";

  listaUsuariosGlobal = data;

  renderizarLista(data);
}

async function excluirUsuario(id) {
  abrirConfirmacao("Tem certeza que deseja excluir este usuário?", async () => {
    const { error } = await supabaseClient
      .from("usuarios_admin")
      .delete()
      .eq("id", id);

    if (error) {
      mostrarAviso("Erro ao excluir: " + error.message);
      return;
    }

    mostrarAviso("Usuário excluído com sucesso!", "sucesso");

    carregarUsuarios();
  });
}

async function toggleStatus(id, statusAtual) {
  const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";

  const { error } = await supabaseClient
    .from("usuarios_admin")
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) {
    mostrarAviso("Erro ao atualizar status");
    return;
  }

  mostrarAviso("Status atualizado com sucesso!", "sucesso");

  carregarUsuarios();
}

function renderizarLista(usuarios) {
  const lista = document.getElementById("listaUsuarios");

  if (!lista) return;

  let html = "";

  usuarios.forEach((user) => {
    html += `
      <div class="linha">
        <div>👤 ${user.email}</div>

        <div>
          <span class="status ${user.status}">
            ${user.status}
          </span>
        </div>

        <div class="acoes">
          <button 
  class="btn-toggle ${user.status}" 
  onclick="toggleStatus('${user.id}', '${user.status}')"
>
  ${user.status === "ativo" ? "Desativar" : "Ativar"}
</button>

          <button class="btn-editar" onclick="editarUsuario('${user.id}')">
            Editar
          </button>

          <button class="btn-excluir" onclick="excluirUsuario('${user.id}')">
            Excluir
          </button>
        </div>
      </div>
    `;
  });

  lista.innerHTML = html;
}

function filtrarUsuarios() {
  const termo = document.getElementById("buscaUsuario").value.toLowerCase();

  const filtrados = listaUsuariosGlobal.filter((user) =>
    user.email.toLowerCase().includes(termo),
  );

  renderizarLista(filtrados);
}

document.addEventListener("DOMContentLoaded", function () {
  carregarUsuarios();
  carregarLeads();
  carregarPlanos(); // 🔥 ESSENCIAL
});

let acaoConfirmada = null;

function abrirConfirmacao(mensagem, callback) {
  document.getElementById("mensagemConfirmar").innerText = mensagem;
  document.getElementById("popupConfirmar").style.display = "flex";

  acaoConfirmada = callback;
}

function confirmarAcao() {
  if (!acaoConfirmada) return;

  const callback = acaoConfirmada;

  fecharConfirmacao();

  callback();
}

function fecharConfirmacao() {
  document.getElementById("popupConfirmar").style.display = "none";
  acaoConfirmada = null;
}

let usuarioEditandoId = null;

function editarUsuario(id) {
  usuarioEditandoId = id;

  const usuario = listaUsuariosGlobal.find((u) => u.id === id);

  document.getElementById("inputEditarEmail").value = usuario.email;

  // 🔥 GARANTE TÍTULO CORRETO
  document.querySelector("#popupEditar h3").innerText = "✏ Editar usuário";

  document.getElementById("popupEditar").style.display = "flex";
}
function fecharEditar() {
  document.getElementById("popupEditar").style.display = "none";
  usuarioEditandoId = null;
}

async function salvarEdicao() {
  // =============================
  // 🔥 SE FOR EDIÇÃO DE PLANO
  // =============================
  if (planoEditandoId) {
    const valorInput = document.getElementById("inputEditarEmail").value.trim();

    const valorNumerico = parseFloat(valorInput.replace(",", "."));

    if (isNaN(valorNumerico)) {
      mostrarAviso("Valor inválido");
      return;
    }

    const { error } = await supabaseClient
      .from("planos")
      .update({ valor: valorNumerico })
      .eq("id", planoEditandoId);

    if (error) {
      mostrarAviso("Erro ao atualizar plano");
      return;
    }

    mostrarAviso("Plano atualizado com sucesso!", "sucesso");

    planoEditandoId = null;
    fecharEditar();
    carregarPlanos();
    return;
  }

  // =============================
  // 🔥 SE FOR USUÁRIO
  // =============================
  const novoEmail = document.getElementById("inputEditarEmail").value.trim();

  if (!novoEmail) {
    mostrarAviso("Digite um email válido");
    return;
  }

  const { error } = await supabaseClient
    .from("usuarios_admin")
    .update({ email: novoEmail })
    .eq("id", usuarioEditandoId);

  if (error) {
    mostrarAviso("Erro ao atualizar: " + error.message);
    return;
  }

  mostrarAviso("Usuário atualizado com sucesso!", "sucesso");

  fecharEditar();
  carregarUsuarios();
}
/* ============================= */
/* LISTAR LEADS DE VENDAS */
/* ============================= */

async function carregarLeads() {
  const { data, error } = await supabaseClient
    .from("leads_vendas")
    .select("*")
    .order("data", { ascending: false });

  if (error) {
    console.error("Erro ao buscar leads:", error);
    return;
  }

  console.log("Leads:", data);

  renderizarLeads(data); // 🔥 ESSENCIAL AGORA
}

function renderizarLeads(leads) {
  const container = document.getElementById("lista-leads");

  if (!container) {
    console.warn("Elemento #lista-leads não encontrado");
    return;
  }

  container.innerHTML = "";

  leads.forEach((lead) => {
    const linha = document.createElement("div");
    linha.classList.add("linha-lead");

    linha.innerHTML = `
      <div>${lead.nome || "-"}</div>
      <div>${lead.email || "-"}</div>
      <div>${lead.whatsapp || "-"}</div>
      <div>${lead.vendedor || "-"}</div>
      <div class="status ${lead.status_pagamento || "pendente"}">
        ${lead.status_pagamento || "pendente"}
      </div>
    `;

    container.appendChild(linha);
  });
}
/* ============================= */
/* 🔥 CARREGAR PLANOS */
/* ============================= */

async function carregarPlanos() {
  const { data, error } = await supabaseClient
    .from("planos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao carregar planos:", error);
    return;
  }

  const container = document.getElementById("lista-planos");

  if (!container) {
    console.warn("Elemento lista-planos não encontrado");
    return;
  }

  container.innerHTML = "";

  data.forEach((plano) => {
    const linha = document.createElement("div");
    linha.classList.add("linha");

    linha.innerHTML = `
  <div><strong>${plano.nome}</strong></div>
  <div>R$ ${Number(plano.valor).toFixed(2).replace(".", ",")}</div>
  <div>
    <button onclick="editarPlano('${plano.id}')">Editar</button>
  </div>
`;

    container.appendChild(linha);
  });
}

function editarPlano(id) {
  planoEditandoId = id;

  const input = document.getElementById("inputEditarEmail");

  input.value = "";
  input.placeholder = "Digite o novo valor (ex: 39.90)";

  // 🔥 ALTERA TÍTULO DO POPUP
  document.querySelector("#popupEditar h3").innerText =
    "💰 Alterar valor do plano";

  document.getElementById("popupEditar").style.display = "flex";
}
