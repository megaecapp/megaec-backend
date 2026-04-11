// =============================
// 🔥 CAPTURA DO INDICADOR
// =============================
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const vendedorURL = urlParams.get("vendedor");

  const vendedorSalvo = localStorage.getItem("vendedor");

  // Só salva se vier da URL e ainda não existir
  /* ============================= */
  /* 🔥 CAPTURA CONTROLADA DE VENDEDOR */
  /* ============================= */

  if (vendedorURL) {
    localStorage.setItem("vendedor", vendedorURL);
  } else {
    localStorage.removeItem("vendedor"); // 🔥 limpa se não houver parâmetro
  }
});

// =============================
// 🔥 REDIRECIONAMENTO PARA LOGIN
// =============================
function irParaCompra() {
  const vendedor = localStorage.getItem("vendedor");

  let url = "checkout.html";

  if (vendedor) {
    url += "?vendedor=" + encodeURIComponent(vendedor);
  }

  window.location.href = url;
}
