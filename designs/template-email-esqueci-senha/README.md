# Template de e-mail — Esqueci minha senha (Firebase Auth)

HTML para colar em **Authentication → Templates → Password reset**.

## Variáveis Firebase

| Variável | Uso |
|----------|-----|
| `%APP_NAME%` | Nome do app |
| `%EMAIL%` | E-mail do piloto |
| `%LINK%` | URL de redefinição (**obrigatória** para aprovação) |

## Requisitos

- Sem `<script>`
- Sem CSS externo / Google Fonts (só Arial/Helvetica + estilos inline)
- Layout em `<table>` (clientes de e-mail)

## Como enviar

1. Abra `code.html`
2. Copie o conteúdo completo
3. Firebase Console → Authentication → Templates → **Password reset** → editar HTML
4. Cole e salve / submeta para aprovação
5. Action URL (customize): `{APP_ORIGIN}/redefinir-senha` (ex. `https://www.rolemoto.com.br/redefinir-senha`)

A tela interna do app continua em `designs/redefinir-senha-2/` (não use esse mock como e-mail).
