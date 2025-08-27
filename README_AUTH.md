# Guia de Configuração de Autenticação - i2Sales

Este guia detalha os passos para configurar a autenticação do Supabase e o provedor Google OAuth para o projeto i2Sales.

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
3.  Copie todo o conteúdo do arquivo e cole no SQL Editor.
4.  Clique em **"RUN"** para executar o script. Isso criará as tabelas, a view, as políticas de segurança (RLS) e as funções RPC necessárias.

### 1.3. Configure os Provedores de Autenticação
1.  Navegue para a seção **Authentication** > **Providers**.
2.  **Email**: Já vem habilitado por padrão. **Importante**: Desabilite a opção **"Confirm email"** se desejar que os usuários possam fazer login imediatamente após o registro. Se mantiver habilitado, o usuário precisará clicar em um link no e-mail para ativar a conta.
3.  **Google**:
    *   Clique em **Google** para abrir as configurações.
    *   Você verá um campo **"Redirect URL"**. Copie esta URL. Você precisará dela no próximo passo.
    *   Mantenha esta aba aberta.

## Passo 2: Configuração do Google Cloud Console

### 2.1. Crie as Credenciais OAuth
1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  Crie um novo projeto ou selecione um existente.
3.  No menu de navegação, vá para **APIs & Services** > **Credentials**.
4.  Clique em **+ CREATE CREDENTIALS** e selecione **OAuth client ID**.
5.  Se solicitado, configure a **OAuth consent screen** (tela de consentimento).
    *   **User Type**: `External`
    *   Preencha as informações da aplicação (nome, e-mail de suporte, etc.). Não precisa preencher todos os campos. Salve e continue.
    *   Não é necessário adicionar scopes ou test users por agora. Salve e volte para a tela de credenciais.
6.  Agora, na criação do **OAuth client ID**:
    *   **Application type**: `Web application`.
    *   **Name**: Dê um nome, como "i2Sales Auth".
    *   **Authorized JavaScript origins**: Adicione a URL base do seu projeto Supabase (a que você copiou no passo 1.1).
    *   **Authorized redirect URIs**: Clique em **+ ADD URI** e cole a **Redirect URL** que você copiou do painel do Supabase no passo 1.3.
7.  Clique em **CREATE**.
8.  Uma janela pop-up aparecerá com o seu **Client ID** e **Client Secret**. Copie ambos.

### 2.2. Ative o Google Provider no Supabase
1.  Volte para a aba do Supabase (Authentication > Providers > Google).
2.  Cole o **Client ID** e **Client Secret** que você obteve do Google Cloud.
3.  Clique em **Save**.

## Passo 3: Configuração do Frontend

### 3.1. Crie o Arquivo de Ambiente
1.  Na raiz do projeto frontend, crie um arquivo chamado `.env`.
2.  Adicione as chaves de API do Supabase que você obteve no passo 1.1.

```env
# .env

VITE_SUPABASE_URL="SUA_PROJECT_URL_DO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_ANON_PUBLIC_KEY_DO_SUPABASE"
```

*   **VITE_SUPABASE_URL**: Cole a "Project URL".
*   **VITE_SUPABASE_ANON_KEY**: Cole a chave "anon public".

### 3.2. Reinicie o Servidor de Desenvolvimento
Se o seu servidor de desenvolvimento (Vite) estava rodando, pare-o (`Ctrl + C`) e reinicie-o (`npm run dev` ou similar) para que ele carregue as novas variáveis de ambiente.

**Pronto!** Sua aplicação agora está configurada para usar autenticação com Email/Senha e Google, com perfis de usuário e segurança de dados garantidos pelo Supabase.
