window.addEventListener("load", function () {
  /* ============================= */
  /* 🔥 MÁSCARA CPF */
  /* ============================= */

  document.getElementById("cpf").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");

    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = v;
  });

  /* ============================= */
  /* 🔥 MÁSCARA WHATSAPP */
  /* ============================= */

  document.getElementById("whatsapp").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");

    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");

    e.target.value = v;
  });
  console.log("VERSAO NOVA CHECKOUT 123");

  const SUPABASE_URL = "https://rjiydewkobfbevzfrxbz.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXlkZXdrb2JmYmV2emZyeGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODEyOTksImV4cCI6MjA4OTA1NzI5OX0.QvooykPpjtAptqIYG2cIsnTv7yZeNyNFQ5QirgaKeQ8";

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ============================= */
  /* 🔥 INICIAR CARREGAMENTO PLANOS */
  /* ============================= */

  carregarPlanos();

  // 🔥 CAPTURAR VENDEDOR DA URL
  const params = new URLSearchParams(window.location.search);
  const vendedorUrl = params.get("vendedor");

  /* ============================= */
  /* 🔥 BLOQUEIO DO BOTÃO ATÉ ACEITE */
  /* ============================= */

  const btn = document.getElementById("btn-gerar");
  const check = document.getElementById("aceite");

  btn.disabled = true;
  btn.style.opacity = "0.5";
  btn.style.cursor = "not-allowed";

  check.addEventListener("change", function () {
    if (check.checked) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    } else {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
  });

  /* ============================= */
  /* 🔥 CARREGAR PLANOS DINÂMICOS */
  /* ============================= */

  async function carregarPlanos() {
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .eq("ativo", true);

    if (error) {
      console.error("Erro ao carregar planos:", error);
      return;
    }

    const select = document.getElementById("plano");
    select.innerHTML = '<option value="">Selecione o plano</option>';

    data.forEach((plano) => {
      const option = document.createElement("option");

      option.value = plano.id; // 🔥 AGORA USA O ID
      option.dataset.nome = plano.nome; // 🔥 GUARDA O NOME
      option.dataset.valor = plano.valor; // 🔥 GUARDA O VALOR

      option.textContent = `${plano.nome} - R$ ${plano.valor}`;

      select.appendChild(option);
    });
  }

  window.gerarPagamento = function () {
    return window._gerarPagamento();
  };

  window._gerarPagamento = async function () {
    const nome = document.getElementById("nome").value;
    const cpfInput = document.getElementById("cpf");

    if (!cpfInput) {
      alert("Erro interno: campo CPF não encontrado");
      return;
    }

    const cpf = cpfInput.value;

    console.log("CPF DIGITADO:", cpf);
    const email = document.getElementById("email").value;
    // 🔥 ID ÚNICO DO LEAD (NÃO ALTERA NADA EXISTENTE)
    const leadId = crypto.randomUUID();
    const whatsapp = document.getElementById("whatsapp").value;
    const selectPlano = document.getElementById("plano");

    const planoId = selectPlano.value;
    const planoNome =
      selectPlano.options[selectPlano.selectedIndex].dataset.nome;
    const valor = parseFloat(
      selectPlano.options[selectPlano.selectedIndex].dataset.valor,
    );

    /* ============================= */
    /* 🔥 VALOR DINÂMICO DO PLANO */
    /* ============================= */

    const cupom = document.getElementById("cupom").value;
    const aceite = document.getElementById("aceite").checked;

    /* ============================= */
    /* 🔥 VALIDAÇÃO PROFISSIONAL */
    /* ============================= */

    if (!nome) {
      alert("Digite seu nome completo");
      return;
    }

    if (cpf.length < 14) {
      alert("Digite um CPF válido");
      return;
    }

    if (!email.includes("@")) {
      alert("Digite um e-mail válido");
      return;
    }

    if (whatsapp.length < 14) {
      alert("Digite um WhatsApp válido");
      return;
    }

    if (!planoId) {
      alert("Selecione um plano");
      return;
    }

    if (!aceite) {
      alert("Aceite os termos");
      return;
    }

    const vendedorFinal = vendedorUrl ? vendedorUrl : "direto";

    const hoje = new Date();
    let proxima = new Date();

    const planoFormatado = (planoNome || "").toLowerCase();

    if (planoFormatado.includes("semestral")) {
      proxima.setMonth(proxima.getMonth() + 6);
    } else if (planoFormatado.includes("anual")) {
      proxima.setFullYear(proxima.getFullYear() + 1);
    } else if (planoFormatado.includes("permanente")) {
      // 🔥 vitalício (praticamente sem expiração)
      proxima.setFullYear(proxima.getFullYear() + 100);
    } else {
      // fallback de segurança
      proxima.setMonth(proxima.getMonth() + 1);
    }

    const { error } = await supabase.from("leads_vendas").insert([
      {
        id: leadId,
        nome,
        cpf,
        email,
        whatsapp,
        vendedor: vendedorFinal,
        cupom,
        status_pagamento: "pendente",
        aceitou_termos: true,
        data: hoje,
        plano_id: planoId,
        plano_nome: planoNome,
        valor: valor,
        proxima_cobranca: proxima,
        /* ============================= */
        /* 🔥 REGISTRO DE ACEITE */
        /* ============================= */
        data_aceite: new Date(),
      },
    ]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      console.error(error);
      return;
    }

    // 🔥 SALVA O ID DO LEAD PARA USAR NO ADMIN
    // 🔥 SALVA O ID DO LEAD
    localStorage.setItem("lead_id", leadId);

    console.log("🔥 LEAD ID SALVO:", leadId);

    // =============================
    // 🔥 GERAR PIX DINÂMICO (SUPABASE FUNCTION)
    // =============================
    console.log("CPF DIGITADO:", cpf);
    const response = await fetch(
      "https://rjiydewkobfbevzfrxbz.supabase.co/functions/v1/criar-pix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome,
          email: email,
          valor: valor,
          leadId: leadId, // 🔥 ligação do sistema
          cpf: cpf.replace(/\D/g, ""), // 🔥 CPF LIMPO (SEM MÁSCARA)
        }),
      },
    );

    const pixData = await response.json();

    if (!pixData.qr_base64) {
      console.error("ERRO COMPLETO:", pixData);

      alert("Erro ao gerar PIX:\n\n" + JSON.stringify(pixData, null, 2));

      return;
    }
    /* ============================= */
    /* 🔥 TRANSIÇÃO PARA PAGAMENTO */
    /* ============================= */

    // 🔥 ESCONDE FORM
    document.getElementById("form-card").style.display = "none";

    // 🔥 MOSTRA PIX
    document.getElementById("pix-area").style.display = "block";

    // =============================
    // ⏱️ CONTADOR REAL + VERIFICAÇÃO
    // =============================

    let tempo = 60; // 1 minuto
    const contadorEl = document.getElementById("contador");

    // ⏱️ CONTADOR REAL (1s)
    const timer = setInterval(() => {
      tempo--;

      const minutos = String(Math.floor(tempo / 60)).padStart(2, "0");
      const segundos = String(tempo % 60).padStart(2, "0");

      contadorEl.textContent = `Tempo restante: ${minutos}:${segundos}`;
      // 🔥 ALERTA VISUAL (URGÊNCIA)
      if (tempo <= 15) {
        contadorEl.style.color = "#ef4444"; // vermelho
        contadorEl.style.transform = "scale(1.1)";
      }

      if (tempo <= 0) {
        clearInterval(timer);
        clearInterval(verificacao);

        window.location.replace(
          `/SCFP/vendas.html?vendedor=${vendedorUrl || "direto"}`,
        );
      }
    }, 1000);

    // 🔁 VERIFICAÇÃO PAGAMENTO (3s)
    const verificacao = setInterval(async () => {
      const { data, error } = await supabase
        .from("leads_vendas")
        .select("status_pagamento")
        .eq("id", leadId)
        .single();

      if (!error && data?.status_pagamento === "pago") {
        clearInterval(timer);
        clearInterval(verificacao);

        window.location.href = `/SCFP/obrigado.html?vendedor=${vendedorUrl || "direto"}`;
      }
    }, 3000);

    // 🔥 ATUALIZA QR CODE DINÂMICO
    document.querySelector(".qrcode-img").src =
      "data:image/png;base64," + pixData.qr_base64;

    // 🔥 (OPCIONAL - PRÓXIMO PASSO) copiar código PIX
    console.log("PIX copia e cola:", pixData.qr_code);
  };

  /* ============================= */
  /* CONFIRMAÇÃO DE PAGAMENTO */
  /* ============================= */

  window.confirmarPagamento = function () {
    return window._confirmarPagamento();
  };

  window._confirmarPagamento = async function () {
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Erro ao localizar seu cadastro.");
      return;
    }

    const { error } = await supabase
      .from("leads_vendas")
      .update({ status_pagamento: "aguardando_confirmacao" })
      .eq("email", email);

    if (error) {
      alert("Erro ao confirmar pagamento.");
      console.error(error);
      return;
    }

    alert("Pagamento informado com sucesso! Em breve você receberá acesso.");
  };
});
