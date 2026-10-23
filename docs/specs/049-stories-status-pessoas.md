# SPEC 049 — Stories no gesto do status

> **Status:** Implementado  
> **Autor:** Assistente IA  
> **Data:** 2026-10-22  
> **Referência de gesto:** status do WhatsApp — bolinha da pessoa, nome embaixo, anel colorido se ainda não viu, anel neutro se já viu, e o toque no anel neutro abre de novo.  
> **Padrões:** Next.js 15 App Router — skill `nextjs-patterns`; visual — skill `desenvolvimento-design`  
> **Backend:** Cloud Function `api` — `GET /stories/pessoas`; o visto da pessoa; localização opcional na foto  
> **Coleções:** `userslocalstory` (campos de localização); `userslocalstoryvisto` (doc por pessoa)  
> **Depende de:** SPEC 045 (álbum, 24 h, faixa de Locais e Eventos), SPEC 047 (marca na foto, player, composer)  
> **QA:** IDs **SP1**–**SP5**

---

## 1. Objetivo

Na aba **Rolês**, embaixo dos filtros, o piloto vê um carrossel de **pessoas** com story nas últimas 24 h. A bolinha é o status. O nome ou apelido fica embaixo.

| Onde | O que a pessoa faz |
|------|--------------------|
| Aba Rolês | Percorre as bolinhas, abre o story de alguém e, depois de ver, abre de novo |
| Perfil próprio | Vê só as fotos dela e apaga |
| Perfil de outro piloto | Não abre story. O story dos outros mora no carrossel |
| Foto | Além da marca do evento, pode levar um lugar. O toque nesse lugar abre o Maps |

A faixa **Ao vivo** das abas Locais e Eventos permanece. Ela é o rolo do ponto. Esta spec é o rolo da pessoa.

---

## 2. Recorte

### 2.1 O que entra

- Carrossel horizontal na aba Rolês, abaixo de `#filtros-feed`.
- A primeira bolinha é a da própria pessoa (`Seu story`), com ou sem foto.
- As outras bolinhas ficam até a foto expirar. Quem ainda não viu vem na frente, com anel em `--primary`. Quem já viu fica com anel neutro e continua abrindo.
- Abrir uma bolinha toca só as fotos **daquela** pessoa, da mais antiga para a mais nova, do começo.
- No perfil próprio, a lista é só das fotos dela. **Apagar** continua no player.
- No perfil de outro piloto, o avatar não oferece story.
- Localização opcional na foto: nome + coordenada. O selo abre o Google Maps. A marca do evento continua e leva ao encontro.

### 2.2 O que não entra

| Item | Motivo |
|------|--------|
| Tirar a faixa de Locais e Eventos | Outro gesto: o ponto, não a pessoa |
| Lista de amigos | O app não tem essa relação. Entram quem publicou nas últimas 24 h |
| Filtrar o carrossel pelo raio do feed | Story de perfil não guarda o GPS de quem postou |
| “Quem viu” | Fora do recorte, como na 047 |
| Arrastar o selo de localização | Posição fixa, para não brigar com a marca do evento |
| Exigir estar no raio para colar o lugar | O selo é um rótulo. O raio continua valendo só para a foto entrar no álbum do ponto |

### 2.3 Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Capa da bolinha | Foto de perfil. Sem foto, o ícone de pessoa |
| Nome | `apelidoExibicao`: apelido, senão o primeiro nome, senão `piloto`. Na bolinha própria, o rótulo é **Seu story** |
| Ordem | Própria, depois quem tem foto nova, depois quem já foi visto. Dentro do grupo, a foto mais recente primeiro |
| Teto | 30 bolinhas, contando a própria. A varredura lê no máximo 200 stories ainda não expiradas |
| Visto da pessoa | Doc `{viewer}_pessoa_{autor}`. Não mexe no visto do álbum do local ou do evento |
| Replay | O player da pessoa sempre começa na primeira foto. O anel neutro não esconde a bolinha |
| Perfil | `GET /usuarios/:uid/stories` devolve só as fotos daquele uid. Some o complemento com fotos de outras pessoas do mesmo ponto |
| Apagar | Só o autor, no player, pela rota do álbum que a foto já usa |
| Localização | Opcional e independente da marca. Nome até 80 caracteres, lat/lng válidos. O toque abre o Maps numa aba nova e não avança o story |
| Marca do evento | Permanece. O toque continua indo para `/eventos/:id` ou `/locais/:id` |

---

## 3. IDs de teste

| ID | Área | Critério de aceite |
|----|------|--------------------|
| **SP1** | Carrossel | Na aba Rolês, abaixo dos filtros, há a bolinha **Seu story** e as das pessoas com foto nas últimas 24 h. Nome embaixo. Some nas abas Eventos e Locais |
| **SP2** | Perfil | No próprio perfil, o player lista só as fotos da pessoa e **Apagar** remove a que está na tela. No perfil de outro piloto não há menu de story |
| **SP3** | Replay | Depois de ver, a bolinha fica com anel neutro e o toque abre de novo a partir da primeira foto. Uma foto nova da mesma pessoa acende o anel outra vez |
| **SP4** | Localização | Dá para marcar um evento e, na mesma foto, um lugar (ex.: Container da Serra). No player, o lugar abre o Maps. A marca do evento continua abrindo o encontro |
| **SP5** | Visto separado | Ver o story de uma pessoa não apaga o anel colorido da faixa do local, se ainda houver foto de outra pessoa naquele ponto |

---

## 4. Contrato

Todas as rotas exigem `autenticar`.

### 4.1 `GET /stories/pessoas`

Resposta 200:

```
{
  pessoas: [
    {
      uid: string,
      apelido: string,
      fotoUrl: string,
      contagem: number,
      naoVisto: boolean,
      propria: boolean
    }
  ]
}
```

A própria pessoa vem mesmo com `contagem: 0` e `naoVisto: false`. Lista vazia de outras pessoas é 200 com só ela.

`naoVisto` é true quando existe story ativa daquela pessoa, com autor diferente de quem vê, e `createdAt` maior que o `vistoAte` do doc `{viewer}_pessoa_{autor}`. Sem esse doc, toda story alheia conta como não vista.

### 4.2 Visto da pessoa

`POST /usuarios/:uid/stories/visto` com `{ storyId }` passa a valer para **qualquer** story ativa daquele autor, não só o álbum `perfil`.

| Status | Quando |
|--------|--------|
| 204 | `vistoAte` avançou, ou já estava à frente |
| 404 | Story inexistente, expirada ou de outro autor |
| 401 | Sem Bearer |

O id do doc é `{viewer}_pessoa_{autor}`. `album` gravado: `"pessoa"`. `localId` e `eventoId` nulos. `vistoAte` só avança.

O player aberto por uma bolinha de pessoa usa esta rota. O player da faixa de local ou evento continua no visto do álbum.

### 4.3 Lista do perfil

`GET /usuarios/:uid/stories` devolve só stories com `usuarioId == uid` e `expiresAt` no futuro, `createdAt` crescente. Não puxa as outras fotos do mesmo local ou evento.

### 4.4 Localização no `POST /stories`

Campos opcionais, os três juntos:

```
localizacaoNome: string
localizacaoLat: number
localizacaoLng: number
```

| Caso | Resultado |
|------|-----------|
| Os três ausentes | Grava nulo. A foto segue como hoje |
| Os três válidos | Grava o rótulo. Não muda o álbum nem dispensa o GPS da marca |
| Só uma parte, nome vazio, nome acima de 80, ou coordenada fora do mundo | 400 `{ erro: "localização inválida" }` |

A resposta pública ganha `localizacao: { nome, lat, lng } | null`. Docs antigos sem o campo saem `null`.

---

## 5. Front

### 5.1 Carrossel

Componente na aba Rolês, logo abaixo dos filtros. Scroll lateral. Alvo de toque da bolinha 64 px. Nome numa linha, com reticências.

| Bolinha | Toque | Extra |
|---------|-------|-------|
| **Seu story**, sem foto | Abre a câmera | — |
| **Seu story**, com foto | Abre o player das fotos dela, do começo | Botão **Nova foto** (`aria-label`) sobre a bolinha |
| Outra pessoa, não vista | Abre o player dela | Anel `--primary` |
| Outra pessoa, já vista | Abre o mesmo player, do começo | Anel neutro |

`aria-label` da bolinha alheia: `Stories de {apelido}` se não viu, `Rever stories de {apelido}` se já viu.

A faixa de Locais e Eventos não muda de lugar.

### 5.2 Perfil

- Header, detalhe e perfil próprio: o anel continua. **Ver fotos** e **Nova foto**. **Apagar** no player.
- Cartão do perfil público de outro piloto: só a foto. Sem anel, sem “Visualizar Stories”.

### 5.3 Localização na foto

No composer, o botão **Localização** abre a busca só de locais do catálogo. Se já houver um evento marcado e esse encontro tiver nome e coordenada, a primeira linha é **Lugar do encontro · {nome}**.

O selo escolhido fica fixo na base da foto, com ícone `location_on` e o nome. **Tirar** devolve o botão. A marca do evento continua arrastável no meio da foto.

No player, o mesmo selo é um link. `aria-label`: `Abrir {nome} no Maps`. O endereço é o de `urlAbrirMaps` (`src/lib/maps.ts`). O toque não avança nem fecha o story.

---

## 6. Fora do escopo

- Editar a localização depois de publicar.
- Várias localizações na mesma foto.
- Mudar push, teto de 5 fotos, expiração ou Storage.
- Denúncia.

---

## 7. Arquivos

| Arquivo | Ação |
|---------|------|
| `docs/specs/049-stories-status-pessoas.md` | Esta spec |
| `functions/src/types/story-local.ts` | `localizacao` e álbum de visto `pessoa` |
| `functions/src/lib/story-local.ts` | Lista da pessoa, visto da pessoa, carrossel, validação da localização |
| `functions/src/repositories/firestore/firestore-story-local.repository.ts` | Ler e gravar os campos novos |
| `functions/src/routes/stories-ao-vivo.ts` | `GET /pessoas` |
| `src/types/story-local.ts` | Tipos públicos |
| `src/app/(app)/stories/components/CarrosselStories.tsx` | **NOVO** |
| `src/app/(app)/feed/components/TelaFeed.tsx` | Monta o carrossel na aba Rolês |
| `src/app/(app)/components/AvatarStories.tsx` | Story só no próprio avatar |
| `src/app/(app)/stories/hooks/useReelStories.ts` | Visto da pessoa quando o alvo é o piloto; replay do início |
| `src/app/(app)/stories/components/ComposerStory.tsx` | Botão e selo de localização |
| `src/app/(app)/components/PalcoFotoStory.tsx` | Link do Maps |
| `.cursor/rules/tech-stack.mdc` | Campos e o carrossel de pessoas |

---

## 8. Relação

| Spec | Relação |
|------|---------|
| **045** | A faixa do ponto, o álbum e as 24 h ficam. O carrossel novo é de pessoas e não substitui essa faixa |
| **047** | A marca do evento na foto fica. A localização é um segundo selo, com outro destino |
| **019** | O link do Maps reusa `urlAbrirMaps` |
