# Lint e tsc do predeploy (`functions/`)

Fonte: `firebase.json` (`predeploy`), `functions/package.json`, `functions/.eslintrc.js`, `functions/tsconfig.json`.

Config estende `eslint:recommended`, `plugin:import/*`, `google` e `plugin:@typescript-eslint/recommended`. Parser com `tsconfig.json` + `tsconfig.dev.json`. Ignora `/lib/**` e `/generated/**`.

## O que o projeto muda no Google style

| Regra | Valor que vale | Efeito |
|---|---|---|
| `quotes` | `"double"` | Aspas duplas. Template literal ok. |
| `max-len` | 100, `ignoreUrls` | Linha acima de 100 colunas quebra o deploy. URL longa passa. |
| `indent` | 2 | Dois espaços. |
| `object-curly-spacing` | off | `{a}` e `{ a }` passam. O código existente usa sem espaço: `{Router, Request}`. |
| `quote-props` | off | Aspas em chave de objeto são livres. |
| `require-jsdoc` / `valid-jsdoc` | off | JSDoc não é obrigatório. |
| `import/no-unresolved` | off | Import não resolvido não falha o lint. |
| `new-cap` | exceção `Router` | `Router()` do Express passa. |

## Google style que continua valendo

| Regra | Como escrever |
|---|---|
| `comma-dangle` `always-multiline` | Vírgula final em array, objeto, parâmetro e import multiline. |
| `operator-linebreak` `after` | Operador no fim da linha (`&&`, `+`, `?` do ternário). |
| `arrow-parens` `always` | Parênteses em arrow de um argumento: `(id) =>`. |
| `space-before-function-paren` | `function foo()` sem espaço. Arrow async com espaço: `async (id) =>`. `const f = (x) =>` passa. |
| `semi` | Ponto e vírgula. |
| `linebreak-style` | LF. |
| `padded-blocks` `never` | Sem linha em branco no início ou fim do bloco. |
| `no-multiple-empty-lines` | No máximo duas linhas vazias seguidas. |
| `camelcase` | Identificador em camelCase. Propriedade de objeto isenta (`properties: never`). |
| `one-var` | Um declarator por `const` / `let`. |
| `curly` `multi-line` | Chaves obrigatórias quando o corpo quebra linha. |
| `prefer-const` | `const` se não reatribui. |
| `no-throw-literal` | `throw new Error(...)`, não `throw "texto"`. |
| `no-var` | `const` / `let`. |
| `eol-last` | Arquivo termina com newline. |
| `no-trailing-spaces` | Sem espaço no fim da linha. |

## `@typescript-eslint/recommended` (erro)

Os que mais aparecem no deploy:

- `no-explicit-any` — sem `any`.
- `no-unused-vars` — variável, import e argumento sem uso.
- `ban-ts-comment` — `@ts-ignore` / `@ts-expect-error` sem descrição no formato exigido.
- `no-require-imports` — `import`, não `require()`.
- `no-empty-object-type` — sem `{}` como tipo.
- `no-wrapper-object-types` — `string`, não `String`.

## `tsc` (`functions/tsconfig.json`)

Além do ESLint, `npm run build` falha com:

- `strict`
- `noImplicitReturns` — todo caminho de função com tipo de retorno devolve valor (inclusive `return;` depois de `res.json()`).
- `noUnusedLocals` — import e local sem uso quebram o build mesmo quando o ESLint perdoa o caso.

`module` / `moduleResolution`: `nodenext`. Importe no mesmo formato dos arquivos vizinhos.
