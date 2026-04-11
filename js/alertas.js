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
}

function fecharAviso() {
  document.getElementById("popupAviso").style.display = "none";
}
