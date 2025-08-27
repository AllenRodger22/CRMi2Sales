# Guia de Configuração de Autenticação - i2Sales

Este guia detalha os passos para configurar a autenticação do Supabase e o provedor Google OAuth para o projeto i2Sales, utilizando a arquitetura recomendada com Funções RPC e Row Level Security.

## Passo 1: Configuração do Projeto Supabase

### 1.1. Obtenha as Chaves de API
1.  Acesse o painel do seu projeto no [Supabase](https://app.supabase.com/).
2.  Vá para **Project Settings** (ícone de engrenagem) > **API**.
3.  Você precisará de duas informações desta página:
    *   **Project URL**
    *   **Project API Keys** > `anon` `public` key.

### 1.2. Execute o Script SQL
1.  No painel do Supabase, navegue até o **SQL Editor**.
2.  Abra o arquivo `db/sql/01_profiles_and_policies.sql` do nosso projeto.
3.  Copie **todo** o conteúdo do arquivo e cole no SQL Editor.
4.  Clique em **"RUN"**. Isso criará as tabelas, a `view`, as políticas de segurança (RLS) e as funções RPC necessárias, incluindo a `ensure_profile`.

### 1.3. Configure a URL do Site
Esta etapa é **crucial** para evitar o erro de "conexão recusada" com o Google OAuth.
1.  Navegue até **Authentication** > **URL Configuration**.
2.  No campo **Site URL**, insira a URL onde sua aplicação está rodando.
    *   **Para desenvolvimento local (como no AI Studio)**: Use a URL fornecida pelo ambiente (geralmente algo como `https://...-your-project-id.web.app`).
    *   **Para produção**: Use a URL final da sua aplicação (ex: `https://www.seusite.com`).

## Passo 2: Configuração do Google Cloud Console

### 2.1. Crie as Credenciais OAuth
1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  Crie um novo projeto ou selecione um existente.
3.  No menu, vá para **APIs & Services** > **Credentials**.
4.  Clique em **+ CREATE CREDENTIALS** e selecione **OAuth client ID**.
5.  Se solicitado, configure a **OAuth consent screen** (tela de consentimento).
    *   **User Type**: `External`.
    *   Preencha as informações da aplicação (nome, e-mail de suporte).
    *   Salve e continue, não é necessário adicionar scopes ou test users agora.
6.  Na criação do **OAuth client ID**:
    *   **Application type**: `Web application`.
    *   **Name**: Dê um nome, como "i2Sales Auth".
    *   **Authorized redirect URIs**: Vá para o painel do Supabase em **Authentication** > **Providers** > **Google**. Copie a URL de redirecionamento (`.../auth/v1/callback`) e cole-a aqui.
7.  Clique em **CREATE**.
8.  Uma janela pop-up aparecerá com o seu **Client ID** e **Client Secret**. Copie ambos.

## Passo 3: Habilite o Provedor Google no Supabase

1.  Volte para a aba do Supabase (**Authentication** > **Providers** > **Google**).
2.  Cole o **Client ID** e **Client Secret** que você obteve do Google Cloud.
3.  Clique em **Save**.

## Passo 4: Configuração do Frontend

O cliente Supabase no projeto (`services/supabaseClient.ts`) já está configurado com as chaves necessárias para este ambiente. Em um projeto de produção, você usaria um arquivo `.env` com as chaves obtidas no Passo 1.1:

```env
# Exemplo de arquivo .env para produção
VITE_SUPABASE_URL="SUA_PROJECT_URL_DO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_ANON_PUBLIC_KEY_DO_SUPABASE"
```

## Solução de Problemas

### Erro: "Connection Refused" ou Página em Branco após Login com Google
*   **Causa**: Isso quase sempre significa que a **Site URL** (Passo 1.3) não está configurada corretamente no Supabase ou que a URL de redirecionamento no Google Cloud (Passo 2.1) está incorreta.
*   **Solução**:
    1.  Verifique se a **Site URL** no Supabase é exatamente a URL base da sua aplicação (sem nenhuma barra `/` no final).
    2.  Verifique se a **Authorized redirect URI** no Google Cloud Console é exatamente a URL fornecida pelo Supabase. Qualquer pequena diferença causará o erro.
