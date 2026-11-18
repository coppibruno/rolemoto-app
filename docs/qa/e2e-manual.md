# Rolemoto — Checklist E2E Manual

- Planilha: [`Rolemoto-E2E-Manual.xlsx`](./Rolemoto-E2E-Manual.xlsx)
- CSV (Notion): [`Rolemoto-E2E-Casos.csv`](./Rolemoto-E2E-Casos.csv)
- JSON: [`e2e-casos.json`](./e2e-casos.json)

**170 casos** · **62 P0** · **68 P1** · **40 P2**

## Módulos

### Afiliados (3 · 1 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-115 | P1 | Criar e editar código afiliado | `/afiliados` | admin |
| E2E-116 | P1 | Landing afiliado registra clique | `/i/[codigo]` | anonimo |
| E2E-117 | P0 | Piloto não vê afiliados | `/afiliados` | piloto |

### Auth / primeiro acesso (12 · 4 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-001 | P0 | Login Google happy path | `/login` | anonimo |
| E2E-002 | P0 | Login e-mail/senha válido | `/login` | anonimo |
| E2E-003 | P0 | Senha inválida mostra erro | `/login` | anonimo |
| E2E-004 | P1 | Recuperar senha envia e-mail | `/login` | anonimo |
| E2E-005 | P1 | Redefinir senha com link válido | `/redefinir-senha` | anonimo |
| E2E-006 | P2 | Link inválido ou expirado | `/redefinir-senha` | anonimo |
| E2E-007 | P0 | Completar primeiro acesso mínimo | `/primeiro-acesso` | piloto |
| E2E-008 | P1 | Validação campos obrigatórios | `/primeiro-acesso` | piloto |
| E2E-009 | P2 | Upload foto opcional no onboarding | `/primeiro-acesso` | piloto |
| E2E-010 | P1 | Definir senha em conta Google | `/definir-senha` | piloto |
| E2E-011 | P1 | Usuário autenticado não fica preso no login | `/login` | piloto |
| E2E-164 | P2 | Resolver identificador por apelido | `/login` | anonimo |

### Conta (excluir, privacidade, offline, PWA) (7 · 1 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-137 | P1 | Política de privacidade acessível | `/privacidade` | anonimo |
| E2E-138 | P1 | Página store de exclusão de conta | `/excluir-conta` | anonimo |
| E2E-139 | P1 | Página offline PWA | `/offline` | piloto |
| E2E-140 | P1 | Banner / botão instalar app | `/perfil` | piloto |
| E2E-141 | P0 | Exclusão remove vínculos sociais e dono | `/perfil` | piloto |
| E2E-142 | P2 | Push em foreground (toast) | `/` | piloto |
| E2E-170 | P1 | Sessão expirada força reauth | `/` | piloto |

### Criar/editar/cancelar rolê + participação (20 · 9 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-036 | P0 | Criar rolê completo | `/criar-role` | piloto |
| E2E-037 | P0 | Validação formulário criar rolê | `/criar-role` | piloto |
| E2E-038 | P1 | Mapa Google na criação | `/criar-role` | piloto |
| E2E-039 | P1 | Clonar rolê | `/criar-role` | piloto |
| E2E-040 | P0 | Solicitar participação | `/roles/[id]/participar` | piloto |
| E2E-041 | P1 | Cancelar pedido pendente | `/roles/[id]/participar` | piloto |
| E2E-042 | P0 | Aceitar piloto na fila | `/aprovacoes` | lider |
| E2E-043 | P0 | Recusar piloto sem push | `/aprovacoes` | lider |
| E2E-044 | P0 | Gerenciar no detalhe do rolê | `/roles/[id]/gerenciar` | lider |
| E2E-045 | P0 | Cancelar rolê futuro | `/roles/[id]/participar` | lider |
| E2E-046 | P1 | Editar rolê futuro | `/criar-role` | lider |
| E2E-047 | P2 | Fixar rolê | `/meus-roles` | lider |
| E2E-048 | P0 | Enviar feedback do rolê | `/roles/[id]/feedback` | piloto |
| E2E-049 | P1 | Abrir mapa de viagem / pacote offline | `/roles/[id]/mapa` | piloto |
| E2E-050 | P1 | Toggle notificar lembretes | `/roles/[id]/participar` | piloto |
| E2E-051 | P1 | Share público do rolê | `/r/[id]` | anonimo |
| E2E-052 | P2 | Rolê encerrado não aceita pedido | `/roles/[id]/participar` | piloto |
| E2E-155 | P2 | Alerta ritmo diferente na aprovação | `/aprovacoes` | lider |
| E2E-156 | P0 | Não-líder não gerencia | `/roles/[id]/gerenciar` | piloto |
| E2E-166 | P2 | Ver relatos do comboio após enviar | `/roles/[id]/feedback` | piloto |

### Dock / menu + (4 · 3 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-143 | P0 | Dock 5 itens e navegação | `/` | piloto |
| E2E-144 | P0 | Menu + piloto: só Rolê e Gravar | `/` | piloto |
| E2E-145 | P0 | Menu + admin completo | `/` | admin |
| E2E-146 | P2 | Highlight FAB em rotas de inclusão | `/criar-role` | piloto |

### Eventos (18 · 5 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-053 | P0 | Admin cria evento grátis | `/criar-evento` | admin |
| E2E-054 | P0 | Piloto comum não cria evento | `/criar-evento` | piloto |
| E2E-055 | P0 | Inscrever e cancelar inscrição | `/eventos/[id]` | piloto |
| E2E-056 | P0 | Convidar amigos para evento | `/eventos/[id]/convidar` | piloto |
| E2E-057 | P0 | Avaliar evento após encerrar | `/eventos/[id]/avaliar` | piloto |
| E2E-058 | P1 | Não inscrito não avalia evento | `/eventos/[id]/avaliar` | piloto |
| E2E-059 | P1 | Autorizar fotógrafo | `/eventos/[id]/fotografo` | admin |
| E2E-060 | P1 | Fotógrafo publica álbum externo | `/eventos/[id]` | fotografo |
| E2E-061 | P2 | Remover fotógrafo | `/eventos/[id]/fotografo` | admin |
| E2E-062 | P1 | Criar e gerenciar série semanal | `/series-evento` | admin |
| E2E-063 | P1 | Apagar evento | `/eventos/[id]` | admin |
| E2E-064 | P1 | Story ao vivo no evento | `/eventos/[id]` | piloto |
| E2E-065 | P1 | Link público evento | `/e/[id]` | anonimo |
| E2E-066 | P2 | Listar avaliações do evento | `/eventos/[id]/avaliacoes` | piloto |
| E2E-147 | P2 | Lista eventos passados admin | `/eventos-passados` | admin |
| E2E-148 | P1 | Evento com localId do catálogo | `/criar-evento` | admin |
| E2E-149 | P1 | Validação duração máx 7 dias | `/criar-evento` | admin |
| E2E-150 | P2 | Editar série e exceções | `/series-evento/[id]/editar` | admin |

### Explorar (rolês, eventos, locais) (13 · 5 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-025 | P0 | Abas Rolês/Eventos/Locais com contagens | `/explorar` | piloto |
| E2E-026 | P0 | Pill de raio 25/50/100/sem limite | `/explorar` | piloto |
| E2E-027 | P1 | Filtros quando e ritmo na aba Rolês | `/explorar` | piloto |
| E2E-028 | P1 | Busca unificada | `/explorar` | piloto |
| E2E-029 | P1 | Sem GPS: painel localização | `/explorar` | piloto |
| E2E-030 | P0 | Card rolê abre participar | `/explorar` | piloto |
| E2E-031 | P0 | Inscrição evento grátis pelo card | `/explorar` | piloto |
| E2E-032 | P0 | Evento pago exige confirmação de ingresso | `/explorar` | piloto |
| E2E-033 | P1 | Favoritar local no card | `/explorar` | piloto |
| E2E-034 | P1 | Links admin na aba Eventos | `/explorar` | admin |
| E2E-035 | P2 | Restaurar estado de filtros ao voltar | `/explorar` | piloto |
| E2E-162 | P2 | Stories ao vivo na aba Locais/Eventos | `/explorar` | piloto |
| E2E-163 | P1 | Card evento Convidar amigo | `/explorar` | piloto |

### Gravar rolê / telemetria / conquistas (10 · 3 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-100 | P0 | Gravar e salvar passeio | `/gravar-role` | piloto |
| E2E-101 | P0 | Dashboard métricas e mapa | `/telemetria/[id]` | piloto |
| E2E-102 | P1 | Alternar privacidade | `/telemetria/[id]` | piloto |
| E2E-103 | P2 | Apagar telemetria | `/telemetria/[id]` | piloto |
| E2E-104 | P1 | Sync offline da telemetria | `/gravar-role` | piloto |
| E2E-105 | P1 | CRUD conquista | `/conquistas` | admin |
| E2E-106 | P1 | Ver minhas conquistas e placar | `/ranking` | piloto |
| E2E-107 | P0 | Piloto comum não acessa admin conquistas | `/conquistas` | piloto |
| E2E-159 | P2 | Share imagem da telemetria | `/telemetria/[id]` | piloto |
| E2E-160 | P2 | Placar só com seguidos + eu | `/ranking/[id]` | piloto |

### Início (feed amigos) + stories (15 · 7 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-012 | P0 | Feed carrega atividades de quem sigo e próprias | `/` | piloto |
| E2E-013 | P0 | Empty state sem seguir ninguém | `/` | piloto |
| E2E-014 | P0 | Curtir e descurtir atividade | `/` | piloto |
| E2E-015 | P0 | Comentar atividade na folha | `/` | piloto |
| E2E-016 | P1 | Abrir item único via deep link | `/atividades/[id]` | piloto |
| E2E-017 | P1 | Pílula de novidades | `/` | piloto |
| E2E-018 | P0 | Banner cockpit líder com pedidos pendentes | `/` | lider |
| E2E-019 | P0 | Card feedback pendente pós-rolê | `/` | piloto |
| E2E-020 | P0 | Carrossel stories pessoas | `/` | piloto |
| E2E-021 | P1 | Publicar story de perfil sem marca | `/` | piloto |
| E2E-022 | P1 | Story com @local ou @evento | `/` | piloto |
| E2E-023 | P1 | Faixa Conhecer pilotos | `/` | piloto |
| E2E-024 | P2 | Erro de rede no feed | `/` | piloto |
| E2E-154 | P2 | CTA chips por tipo de atividade | `/` | piloto |
| E2E-168 | P2 | Apagar própria story | `/` | piloto |

### Links públicos (5 · 0 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-118 | P1 | Convite rolê encerrado | `/r/[id]` | anonimo |
| E2E-119 | P1 | CTA autenticado no convite | `/r/[id]` | piloto |
| E2E-120 | P1 | Convite evento logado | `/e/[id]` | piloto |
| E2E-121 | P2 | Convite local inexistente | `/l/[id]` | anonimo |
| E2E-122 | P2 | Share nativo do convite | `/r/[id]` | anonimo |

### Locais (17 · 8 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-067 | P0 | Admin cria local oficial | `/criar-local` | admin |
| E2E-068 | P0 | Detalhe local: favoritar, avaliar, share | `/locais/[id]` | piloto |
| E2E-069 | P0 | Avaliar local (qualquer autenticado) | `/locais/[id]/avaliar` | piloto |
| E2E-070 | P0 | Check-in GPS com selo | `/locais/[id]` | piloto |
| E2E-071 | P1 | Check-in fora do raio falha | `/locais/[id]` | piloto |
| E2E-072 | P1 | Story no local ao vivo | `/locais/[id]` | piloto |
| E2E-073 | P0 | Vincular dono do local | `/locais/[id]` | admin |
| E2E-074 | P0 | Dono cria oferta no balcão | `/locais/[id]/balcao` | dono |
| E2E-075 | P1 | Editar, pausar e apagar oferta | `/locais/[id]/ofertas/[ofertaId]` | dono |
| E2E-076 | P0 | Abrir cupom vigente | `/locais/[id]` | piloto |
| E2E-077 | P2 | Semana do balcão (check-ins/cupons) | `/locais/[id]/balcao` | dono |
| E2E-078 | P1 | Apagar local | `/locais` | admin |
| E2E-079 | P2 | Link público local | `/l/[id]` | anonimo |
| E2E-151 | P2 | Horários vs aberto24h | `/criar-local` | admin |
| E2E-152 | P1 | Validação oferta (código, tipo, teto 5) | `/locais/[id]/ofertas/nova` | dono |
| E2E-153 | P0 | Não-dono não acessa balcão | `/locais/[id]/balcao` | piloto |
| E2E-167 | P2 | ofertaVigente no card/detalhe sem código | `/locais/[id]` | admin |

### Mensagens / chat (5 · 2 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-108 | P0 | Caixa de entrada e badge não lidas | `/mensagens` | piloto |
| E2E-109 | P0 | Enviar mensagem texto | `/mensagens/[conversaId]` | multi |
| E2E-110 | P2 | Curtir mensagem | `/mensagens/[conversaId]` | piloto |
| E2E-111 | P2 | Responder story via chat | `/mensagens/[conversaId]` | piloto |
| E2E-161 | P2 | Empty state caixa vazia | `/mensagens` | piloto |

### Meus Rolês / garagem (7 · 3 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-080 | P0 | Abas Rolês/Eventos/Locais com contagens | `/meus-roles` | piloto |
| E2E-081 | P0 | Cancelar/editar rolê pela garagem | `/meus-roles` | lider |
| E2E-082 | P1 | Desistir de participação | `/meus-roles` | piloto |
| E2E-083 | P0 | CTA Avaliar evento/local na garagem | `/meus-roles` | piloto |
| E2E-084 | P1 | Locais favoritos vs visitados | `/meus-roles` | piloto |
| E2E-085 | P2 | Empty states por aba/filtro | `/meus-roles` | piloto |
| E2E-165 | P2 | Persistência de filtros da garagem na URL/estado | `/meus-roles` | piloto |

### Notificações push (14 · 4 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-123 | P0 | Registrar dispositivo FCM | `/` | piloto |
| E2E-124 | P0 | Push pedido_vaga → aceite_vaga | `/aprovacoes` | multi |
| E2E-125 | P0 | Push cancelamento_role | `/meus-roles` | multi |
| E2E-126 | P1 | Lembretes rolê 24h e 2h | `/roles/[id]/participar` | piloto |
| E2E-127 | P1 | Lembretes evento 24h (broadcast) e 2h (inscritos) | `/eventos/[id]` | piloto |
| E2E-128 | P1 | Push story_local (local vs evento) | `/locais/[id]` | multi |
| E2E-129 | P1 | Push novo_seguidor | `/perfil/[uid]` | multi |
| E2E-130 | P1 | Push convite_evento | `/eventos/[id]/convidar` | multi |
| E2E-131 | P2 | Push album_evento | `/eventos/[id]` | multi |
| E2E-132 | P1 | Push comentario_foto | `/perfil/[uid]/fotos/[postId]` | multi |
| E2E-133 | P1 | Push comentario_atividade | `/atividades/[id]` | multi |
| E2E-134 | P0 | Push mensagem | `/mensagens/[conversaId]` | multi |
| E2E-135 | P2 | Push entrada_role (se aplicável ao fluxo atual) | `/roles/[id]/participar` | multi |
| E2E-136 | P2 | Revogar permissão / logout remove token | `/perfil` | piloto |

### Perfil próprio e público (17 · 6 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-086 | P0 | Editar perfil | `/perfil` | piloto |
| E2E-087 | P1 | Card completar perfil | `/perfil` | piloto |
| E2E-088 | P0 | Seguir e deixar de seguir | `/perfil/[uid]` | piloto |
| E2E-089 | P1 | Listas seguindo/seguidores | `/perfil/[uid]/seguindo` | piloto |
| E2E-090 | P0 | Buscar e seguir piloto | `/pilotos` | piloto |
| E2E-091 | P0 | Publicar foto permanente | `/perfil/fotos/nova` | piloto |
| E2E-092 | P0 | Comentar e apagar foto | `/perfil/[uid]/fotos/[postId]` | piloto |
| E2E-093 | P2 | Encaminhar post para story depois | `/perfil/[uid]/fotos/[postId]` | piloto |
| E2E-094 | P1 | Histórico de pistas com filtros | `/perfil` | piloto |
| E2E-095 | P1 | Perfil público somente leitura | `/perfil/[uid]` | piloto |
| E2E-096 | P1 | Botão Mensagem no perfil | `/perfil/[uid]` | piloto |
| E2E-097 | P1 | Sair da conta | `/perfil` | piloto |
| E2E-098 | P0 | Excluir conta | `/perfil` | piloto |
| E2E-099 | P2 | Alternar tema claro/escuro | `/perfil` | piloto |
| E2E-157 | P2 | Selos de check-in no perfil | `/perfil/[uid]` | piloto |
| E2E-158 | P2 | Teto 10 posts / 24h | `/perfil/fotos/nova` | piloto |
| E2E-169 | P2 | Telemetria privada não aparece no perfil público | `/perfil/[uid]` | piloto |

### Sugestões locais/eventos (3 · 1 P0)

| ID | Pri | Cenário | Rota | Papel |
|---|---|---|---|---|
| E2E-112 | P1 | Listar/buscar/aprovar/recusar locais Places | `/sugestoes-locais` | admin |
| E2E-113 | P1 | Homologar sugestão Instagram | `/sugestoes-eventos` | admin |
| E2E-114 | P0 | Piloto sem acesso a sugestões | `/sugestoes-locais` | piloto |
