
<div align="center">
  <a href="https://ibb.co/VYpGvg3J">
    <img src="https://i.ibb.co/PGzy5ctF/Askal-Horiz.png" alt="Askal DayZ Tools" width="100%">
  </a>

  # Askal DayZ Mod Tools
  
  **A Suite definitiva para Desenvolvimento e Testes no DayZ Standalone.**


</div>

---

## 🚀 Sobre a Extensão

A **Askal DayZ Mod Tools** foi desenvolvida para agilizar o fluxo de trabalho dos modders de DayZ. Esqueça scripts BAT complexos ou ferramentas externas manuais. Tudo o que você precisa está agora integrado diretamente no seu VS Code.

Desde a compactação de PBOs (usando Mikero Tools) até o lançamento de um ambiente completo de teste (Servidor + Cliente com Mods), tudo é feito com um clique.

## ✨ Funcionalidades Principais

### 🛠️ Compilação Automática (PBO)
*   Integração nativa com **Mikero's PboProject**.
*   Detecção automática de mods no seu Workspace (baseado em `config.cpp`).
*   **One-Click Build**: Compile apenas o mod que você alterou.

### 🎮 Gerenciamento de Ambiente
*   **Server Controller**: Inicie, pare e reinicie seu DayZ Server local.
*   **Client Launcher**: Lance o jogo já conectado ao seu servidor local.
*   **Auto Link (Novo!)**: Criação automática de **Symlinks** (Junctions) na pasta do cliente, permitindo carregar mods locais sem copiar arquivos.

### ⚡ Modo Automático (Rocket Launch)
*   Um único botão para:
    1.  Iniciar o Servidor.
    2.  Aguardar o carregamento.
    3.  Lançar o Cliente e conectar automaticamente (`-connect=127.0.0.1`).

---

## 📚 Guia de Uso (Wiki)

### 1. Pré-Requisitos
Para que a mágica aconteça, você precisa ter instalado:
*   [Mikero Tools](https://mikero.bytex.digital/Downloads) (PboProject deve estar funcional).
*   Seu ambiente de trabalho configurado no drive `P:\` (padrão do DayZ Tools).

### 2. Configuração Inicial
Após instalar a extensão, vá em `File > Preferences > Settings` e busque por `DayZ Tool`.
Configure os caminhos essenciais:

| Configuração | Descrição | Padrão |
| :--- | :--- | :--- |
| `Source Path` | Onde seus mods estão (Drive de Trabalho). | `P:/` |
| `Output Path` | Para onde os PBOs prontos vão. Deixe vazio para usar o padrão do Mikero. | *(Vazio)* |
| `DayZ Server Path` | Caminho da pasta do seu DayZServer. | `C:\...\DayZServer` |
| `DayZ Client Path` | Caminho da pasta do seu jogo DayZ. | `C:\...\DayZ` |

### 3. Painel de Controle "Askal Tools"
No menu lateral do VS Code, clique no ícone do **Askal (Unicórnio)**.

*   **Build Mod**: Clique no ícone de martelo `Build` ao lado do nome do mod.
*   **Play**: Inicia o servidor.
*   **Rocket**: Inicia o "Full Environment" (Server + Client).

---

## ⚙️ Parâmetros de Lançamento
A extensão utiliza parâmetros otimizados para desenvolvimento:

*   **Servidor**: `-config=serverDZ.cfg -profiles=profiles -mod=@SeusMods`
*   **Cliente**: `-malloc=system -noborder -noPause=1 -name=Askal`

> **Nota**: No modo "Rocket", o cliente recebe automaticamente `-connect` e `-port` para entrar direto no servidor.

---

## 🤝 Contribuição e Suporte

Encontrou um bug? Tem uma ideia?
O projeto é mantido pela comunidade **Askal**. Entre em contato ou abra uma issue no repositório.

**Desenvolvido com ❤️ por ADBAskal.**
