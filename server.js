// ================================
// IMPORTA BIBLIOTECAS
// ================================
const express = require("express");
const cors = require("cors");

// ================================
// IMPORTA ROTAS
// ================================
const uploadRoute = require("./api/upload");

// ================================
// CONFIGURAÇÃO DO APP
// ================================
const app = express();

app.use(cors());
app.use(express.json());

// ================================
// ROTAS
// ================================
app.use("/upload", uploadRoute);

// ================================
// INICIAR SERVIDOR
// ================================
app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
