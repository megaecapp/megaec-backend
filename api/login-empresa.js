// =====================================
// 🔐 LOGIN EMPRESA (FRONTEND)
// =====================================

async function logarEmpresa() {
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!login || !senha) {
    mostrarAlerta("Preencha login e senha", "erro");
    return;
  }

  try {
    const res = await fetch(
      "https://megaec-backend.vercel.app/api/login-empresa",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, senha }),
      },
    );

    const data = await res.json();

    if (data.sucesso) {
      console.log("RETORNO BACKEND:", data);
      console.log("BANNER BACKEND:", data.banner_admin);
      // 🔐 SALVAR SESSÃO
      localStorage.setItem("empresa_id", data.empresa_id);

      // 🔷 padronização correta
      localStorage.setItem("empresa_nome", data.nome_empresa || data.nome);
      localStorage.setItem("empresa_logo", data.logo_admin);
      localStorage.setItem("empresa_banner", data.banner_admin);
      localStorage.setItem("empresa_logo_simulador", data.logo_simulador);

      mostrarAlerta("Login realizado com sucesso!", "sucesso");

      // 🔥 pequeno delay para UX
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 800);
    } else {
      mostrarAlerta("Login inválido", "erro");
    }
  } catch (error) {
    console.error("Erro no login:", error);
    mostrarAlerta("Erro na conexão com servidor", "erro");
  }
}

// =====================================
// 🔷 ALERTA VISUAL
// =====================================

function mostrarAlerta(mensagem, tipo = "sucesso") {
  const el = document.getElementById("alerta");

  if (!el) return; // 🔥 segurança extra

  el.innerText = mensagem;
  el.className = `alerta ${tipo}`;

  setTimeout(() => {
    el.innerText = "";
    el.className = "alerta";
  }, 3000);
}
// =====================================================
// 🔷 TÍTULO DINÂMICO LOGIN (WHITE LABEL)
// =====================================================

const nomeEmpresa = localStorage.getItem("empresa_nome");

if (nomeEmpresa) {
  document.title = `${nomeEmpresa} | Acesso`;
}
