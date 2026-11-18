# SPEC 067 — Código de afiliado no primeiro acesso

> **Status:** Implementada  

> **Autor:** Assistente IA  
> **Data:** 2026-11-17  
> **Origem:** o link `/i/{codigo}` (SPEC 061 AF) já conta clique e conta quando o mesmo navegador chega ao `POST /perfil`. Quem recebeu o código por áudio, Stories ou WhatsApp — sem abrir o link — não tem como atribuir. O admin precisa de um campo opcional no onboarding  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — `POST /perfil` já aceita `codigoAfiliado` (AF1). Sem rota nova  
> **Coleções:** `afiliados`, `users.afiliadoCodigo` (já existem na SPEC 061 AF). Sem coleção nova  
> **Depende de:** SPEC 011 / primeiro acesso (`/primeiro-acesso`, `POST /perfil`), SPEC 061 AF (formato do código, `localStorage`, vínculo e contadores)  
> **QA:** IDs **CA1**–**CA4**, um PR por ID

O influencer passa o código. O piloto digita (ou confirma o pré-preenchido do link) no primeiro acesso. O app atribui a conta sem ferramenta externa e sem lista manual de cliques.

---

## 1. Objetivo

| ID | Entrega | Camada |
|----|---------|--------|
| **CA1** | Campo opcional **Código de indicação** no formulário de `/primeiro-acesso`, com pré-preenchimento do `localStorage` | Front |
| **CA2** | Prioridade digitado → `localStorage`; normalização e envio no `POST /perfil`; limpeza da chave após sucesso | Front |
| **CA3** | Copy e estados (vazio, pré-preenchido, formato inválido) alinhados ao cockpit do onboarding | Front |
| **CA4** | Smoke do vínculo já existente: código conhecido soma `contas`; desconhecido ou vazio não bloqueia o perfil | Back (já feito; só critério de aceite / regressão) |

---

## 2. Recorte

### 2.1 O que entra

- Campo de texto **opcional** no primeiro acesso, abaixo de moto (antes do ritmo).
- Se existir código válido em `localStorage` (`rolemoto.afiliado`, menos de 30 dias — mesma regra da AF2), o campo **abre já preenchido**.
- O piloto pode apagar, trocar ou deixar como está.
- Ao concluir, o client manda `codigoAfiliado` no body quando houver valor normalizado válido.
- Contrato do back permanece o da AF1: código conhecido + `users.afiliadoCodigo` ainda vazio → grava e incrementa `contas`. Código desconhecido ou malformado → perfil cria do mesmo jeito, sem afiliado. Não troca afiliado se o campo interno já estiver preenchido.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Validar no client se o código existe em `afiliados` | Evita endpoint público de “existe?” e vazamento de códigos; o back já ignora o desconhecido |
| Mostrar o campo em `/login`, cadastro e-mail ou edição de perfil | Atribuição é só no nascimento do `users/{uid}` |
| Trocar afiliado depois do primeiro acesso | Mesma trava da AF: o primeiro código fica |
| Painel do influencer, comissão, lista de uids | Continua só `cliques` + `contas` em `/afiliados` |
| Contar instalação de loja | Continua fora (AF) |
| Novo formato de código | Continua `3..20`, `a-z`, `0-9` e hífen |
| Mudar a página `/i/{codigo}` ou o admin `/afiliados` | Já entregues na AF |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Obrigatório? | Não. Vazio não impede o CTA |
| Rótulo | **Código de indicação** |
| Placeholder | `ex: joao-moto` |
| Hint (sempre) | *Se alguém te indicou, cola o código aqui. Pode deixar em branco.* |
| Hint com pré-preenchimento | *Veio do link que você abriu. Pode apagar ou trocar.* |
| Prioridade no submit | Texto do campo (após normalizar) vence o `localStorage`. Se o campo estiver vazio, não manda `codigoAfiliado` — mesmo que a chave ainda exista |
| Normalização | `trim` + `toLowerCase` no client antes de validar e enviar (igual `normalizarCodigoAfiliado`) |
| Formato inválido no campo | Enquanto houver caracteres e a normalização falhar: erro de campo *Use 3 a 20 letras, números ou hífen* e CTA **disabled**. Campo vazio = ok |
| Código desconhecido (formato ok) | Sem erro na UI. O `POST` cria o perfil; o vínculo não acontece (AF1) |
| Após sucesso | `limparCodigoAfiliado()` como hoje |
| Exposição | `afiliadoCodigo` continua interno; não sai em `GET /perfil` nem no público |
| Autocomplete | `autoComplete="off"`; `inputMode="text"`; sem capitalização forçada (`autoCapitalize="none"` / `spellCheck={false}`) |

### 2.4 Caminho

1. Admin já cadastrou o código em `/afiliados` (AF).
2. Influencer divulga o link `/i/{codigo}` **ou** só o código em texto.
3. Piloto autentica e cai em `/primeiro-acesso`.
4. Com link prévio no mesmo aparelho: campo já traz o código. Sem link: digita ou deixa vazio.
5. `POST /perfil` com ou sem `codigoAfiliado` → Início. Admin vê `contas` subir só quando o código existia.

---

## 3. Dados e API

Sem mudança de schema.

- Body opcional já aceito: `codigoAfiliado?: string` em `UsuarioPrimeiroAcesso` / `POST /perfil`.
- Persistência: `users.afiliadoCodigo` + `afiliados.contas` via `afiliadoRepository.vincularConta` (já implementado).
- Código inválido ou inexistente: a rota de perfil **não** responde 4xx por causa do afiliado (comportamento atual de `vincularAfiliado`).

**CA4** só confirma regressão; não há PR de back se o comportamento já estiver verde nos testes de AF1.

---

## 4. Front — `/primeiro-acesso`

### 4.1 UI (CA1 + CA3)

- Reusar `CampoTexto` (ou o padrão visual da seção de dados).
- Ícone sugerido: `confirmation_number` (Material Symbols), alinhado a nome/moto.
- Posição: depois de **Sua moto**, antes de **Seu ritmo**.
- Não entra na barra de progresso / percentual de campos obrigatórios (continua só nome, moto, ritmo, foto conforme a tela atual).
- Rodapé existente permanece; não menciona afiliado.

### 4.2 Estado e submit (CA2)

No hook do formulário:

1. No mount (client): ler `codigoAfiliadoValido()` e hidratar o estado do campo uma vez.
2. Enquanto o piloto edita, o valor do input é a fonte da verdade.
3. No submit:
   - `const digitado = normalizarCodigoAfiliado(campo)`  
   - Se `digitado`: incluir `{ codigoAfiliado: digitado }` no body.  
   - Se o campo está vazio (após trim): **omitir** a chave do body (não cair de volta no `localStorage`).
4. Sucesso do `POST`: `limparCodigoAfiliado()`.
5. 409 / 401: manter o fluxo atual de redirect; ainda assim limpar a chave só após criação bem-sucedida (como hoje).

### 4.3 Arquivos prováveis

| Arquivo | Mudança |
|---------|---------|
| `src/app/(auth)/primeiro-acesso/constants.ts` | Copy do campo, hint e erro de formato |
| `src/app/(auth)/primeiro-acesso/components/SecaoDadosPiloto.tsx` (ou componente irmão) | Campo novo |
| `src/app/(auth)/primeiro-acesso/components/FormularioPrimeiroAcesso.tsx` | Passar props |
| `src/app/(auth)/primeiro-acesso/hooks/useFormularioPrimeiroAcesso.ts` | Estado, pré-fill, validação, body |
| `src/lib/afiliado.ts` | Reuso; sem mudar formato nem validade de 30 dias |
| Testes front do hook / `afiliado.test.ts` | Pré-fill, prioridade do digitado, omitir body quando vazio |

Não alterar a página pública `/i/[codigo]` nesta spec.

---

## 5. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **CA1** | UI | Campo opcional visível no primeiro acesso, abaixo da moto. Sem valor prévio, começa vazio. CTA continua habilitado sem o código |
| **CA2** | Submit | Com `localStorage` válido, campo pré-preenchido. Digitar outro código válido manda o digitado. Limpar o campo e concluir **não** manda `codigoAfiliado` e **não** atribui. Sucesso apaga a chave |
| **CA3** | Validação visual | `Ab` ou `JOÃO` (após normalizar inválido) mostra erro de formato e desabilita o CTA. `joao-moto` (formato ok) não mostra erro de existência |
| **CA4** | Vínculo | Código cadastrado em `/afiliados` → após concluir, `contas` +1 e `users.afiliadoCodigo` preenchido. Código inventado com formato ok → perfil criado, `contas` inalterado. Repetir primeiro acesso (409) não soma de novo |

---

## 6. Fora desta entrega

- Endpoint público de validação de código.
- Atribuição retroativa em contas já criadas.
- Campo no perfil editável.
- Relatório por período / CSV / painel do afiliado.
- Deep link de loja com Install Referrer.

A SPEC 061 AF continua sendo a fonte do link, do clique e do admin. Esta spec só abre a porta digitável no onboarding.
