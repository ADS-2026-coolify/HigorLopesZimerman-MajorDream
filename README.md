# DRAFT ARENA — Counter-Strike Draft & Competitive Simulation Platform

**Draft Arena** é uma plataforma web para fãs de Counter-Strike que combina seleção de elencos de todas as eras (1.6, Source, CS:GO, CS2), gerenciamento de sinergia tática, simulação competitiva round a round no formato MR12 até a conquista do Major, jogos diários de conhecimento (CS Guessr) e CS Bingo 4x4.

Inspirado nos conceitos fundamentais de `12a0.com`, o Draft Arena foi construído do zero com arquitetura moderna, identidade visual original no estilo dark esports, internacionalização completa (**pt-BR** e **en**), áudio tático sintetizado via Web Audio API e persistência de dados.

---

## 🚀 Funcionalidades Principais

### 1. 🏆 Road to Major (Modo de Draft Principal)
- **Pacotes de Elencos Históricos**: Sorteio de 5 pacotes de times históricos (como *Luminosity Gaming 2016*, *Astralis 2018*, *FaZe Clan 2022*, *Natus Vincere 2021*, *Team Spirit 2024*).
- **Mecânica de Trocas (Reroll)**: Troque pacotes até 2 vezes se não gostar da composição sorteada.
- **Cálculo de Sinergia Tática**:
  - **Comp Completa (+3 OVR)**: Balanço ideal com IGL, AWP, Entry e Lurker.
  - **Sem Lurker (+0 OVR)**: Composição sólida com menor flexibilidade ofensiva.
  - **Sem IGL (-3 OVR)**: Falta de liderança tática custando rounds cruciais.
  - **Núcleo Quebrado (-5 OVR)**: Desequilíbrio estrutural crítico.
- **Vantagem Tática de Mapas**: Distribua 5 pontos estratégicos nos mapas da rotação ativa (*Mirage, Inferno, Nuke, Dust II, Ancient, Anubis, Overpass*) para elevar a probabilidade de vitória da sua equipe.
- **Simulação Competitiva MR12**:
  - **Fase Suíça (16 Times · 8 Vagas)**: 3 Vitórias para avançar aos Playoffs, 3 Derrotas para ser Eliminado.
  - **Mata-Mata Bo3**: Quartas, Semifinal e Grande Final do Major.
  - **Feed Round a Round**: Rounds de pistol, overtimes (prorrogação), MVPs da partida e estatísticas detalhadas de K/D/A e Rating.
  - **Conquistas Especiais**: Selo de Campeão e **Campeão Invicto** (sem nenhuma derrota na campanha).

### 2. 🎯 Adivinhe o Pro (CS Guessr Diário & Infinito)
- Descubra o jogador profissional secreto com feedback visual detalhado por categoria:
  - *Time Histórico, País, Função tática, Era (Mais recente / Mais antiga) e OVR*.
- Desafio diário determinístico e modo replay para treinar conhecimento.

### 3. 🎲 CS Bingo 4x4
- Cartela com 16 requisitos táticos (*Lenda Brasileira, Rating 1.20+, AWPer, Era 2013-2016, Mais de 2 Majors, etc.*).
- Sorteie jogadores do baralho, encaixe nas casas correspondentes ou queime/pule a carta.
- Detecção automática de vitória por Linha, Coluna ou Diagonal.

### 4. 🛠️ Montador Livre de Elencos (Lineup Builder)
- Crie o dream team dos seus sonhos cruzando épocas e equipes.
- Filtros por função (*IGL, AWPer, Entry, Rifler, Lurker, Suporte*), busca em tempo real e cálculo instantâneo de sinergia e OVR.

### 5. 📊 Histórico e Estatísticas Pessoais
- Painel com número de campanhas jogadas, títulos conquistados, taxa de vitória e conquistas desbloqueadas salvas localmente no navegador.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Design System**: Esports Dark Mode (`#0A0D14`, `#111723`, `#161F30`), detalhes em dourado `#F59E0B`, azul `#0EA5E9`, vermelho `#EF4444` e verde `#10B981`.
- **Efeitos Sonoros**: Motor de áudio nativo em Web Audio API sem arquivos pesados externos.
- **i18n**: Sistema nativo bilíngue com troca dinâmica instantânea entre Português e Inglês.
- **Backend**: Node.js, Express, TypeScript, CORS, Dotenv.
- **Banco de Dados**: Modelagem relacional normalizada com migrações prontas para PostgreSQL (`server/schema.sql`).
- **Testes Automatizados**: Vitest para validação de regras de simulação e cálculo de sinergia.

---

## 📦 Como Executar o Projeto Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Rodar o Frontend (Vite Dev Server)
```bash
npm run dev
```
Acesse a aplicação no seu navegador: `http://localhost:5173`.

### 3. Executar os Testes Automatizados
```bash
npm test
```

### 4. Gerar Build de Produção
```bash
npm run build
```

### 5. Rodar a API Backend (Opcional)
```bash
npx tsx server/index.ts
```
API disponível em: `http://localhost:3001/api/health`.

---

## 📄 Licença e Atribuição
Inspirado na jogabilidade de `12a0.com`. Todos os nomes de jogadores, apelidos e estatísticas históricas são utilizados com propósitos esportivos e de entretenimento competitivo.
