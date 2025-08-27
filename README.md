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
2.  Crie um **"New query"**.
3.  Copie o conteúdo do arquivo `db_setup.sql` do projeto e cole no SQL Editor.
4.  Clique em **"RUN"**. Isso criará a tabela `profiles`, as políticas de segurança (RLS) e as funções/triggers necessárias.

### 1.3. Configure a URL do Site
Esta etapa é **crucial** para o funcionamento correto do redirecionamento do Google OAuth.
1.  Navegue até **Authentication** > **URL Configuration**.
2.  No campo **Site URL**, insira a URL onde sua aplicação está rodando.
    *   **Para desenvolvimento local (como no AI Studio)**: Use a URL fornecida pelo ambiente (geralmente algo como `https://...-your-project-id.web.app`). **Não** use `localhost`.
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

O cliente Supabase no projeto (`services/supabaseClient.ts`) já está configurado com as chaves para este ambiente. Em um projeto de produção, você usaria um arquivo `.env` com as chaves obtidas no Passo 1.1. Para este ambiente, nenhuma alteração é necessária.

## Solução de Problemas

### Erro: "Connection Refused", "Redirect URI mismatch" ou Página em Branco após Login com Google
*   **Causa**: Isso quase sempre significa que a **Site URL** (Passo 1.3) não está configurada corretamente no Supabase ou que a URL de redirecionamento no Google Cloud (Passo 2.1) está incorreta.
*   **Solução**:
    1.  Verifique se a **Site URL** no Supabase é exatamente a URL base da sua aplicação (sem nenhuma barra `/` no final).
    2.  Verifique se a **Authorized redirect URI** no Google Cloud Console é exatamente a URL fornecida pelo Supabase. Qualquer pequena diferença causará o erro.
    3.  Aguarde alguns minutos após salvar as configurações no Google Cloud, pois pode haver um pequeno atraso na propagação.

### Erro: "Error creating profile: RLS policy violation"
*   **Causa**: A política de segurança de inserção (`profiles_insert_self`) não foi criada ou está incorreta.
*   **Solução**: Re-execute o script `db_setup.sql` (Passo 1.2) para garantir que todas as políticas RLS estejam corretamente aplicadas.
