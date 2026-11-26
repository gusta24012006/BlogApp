# Volta — rede social de viagens

> Roda o globo, escolhe um país e lê as histórias de quem lá esteve.

**Volta** é uma rede social de viagens construída à volta de um **globo 3D interativo**. Cada utilizador marca os países que visitou e escreve blogs de viagem com um editor por blocos (texto, imagens, vídeo, música). Os outros utilizadores exploram o globo, carregam num país e veem os posts sobre esse destino.

🔗 **Demo:** [blog-app-j68i.vercel.app](https://blog-app-j68i.vercel.app)
📌 **Estado:** em desenvolvimento (projeto pessoal)

### Experimenta sem criar conta

| Email | Password |
|---|---|
| `demo@volta.app` | `Demo2000` |

No **feed** há blogs de outros utilizadores para explorar: roda o globo, escolhe um país e abre os posts.

> Os blogs publicados na demo são **conteúdo de teste**, criados para mostrar as funcionalidades da aplicação.

<!-- Substituir por capturas de ecrã / GIF reais da aplicação -->
<!-- ![Globo interativo](docs/globo.gif) -->
<!-- ![Editor de posts](docs/editor.png) -->

## Funcionalidades

- **Globo 3D interativo** (Three.js / react-globe.gl): rodar, fazer zoom e escolher países, com os países visitados destacados
- **Blogs de viagem** com editor por blocos (texto rico, imagem, imagem + texto, vídeo, música, separador), reordenação por drag-and-drop e temas personalizáveis
- **Rede social:** seguir utilizadores, feed, gostos, comentários e notificações
- **Perfis** com países visitados, edição e personalização do perfil
- **Pesquisa** de países e utilizadores
- **Autenticação** (registo, login, alteração de email e password) e onboarding de novos utilizadores
- **Segurança:** HTML dos posts sanitizado com DOMPurify antes de ser mostrado

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Globo 3D | Three.js, react-globe.gl |
| Editor | TipTap, dnd-kit |
| Backend | Supabase — PostgreSQL, autenticação, armazenamento de ficheiros |

## Correr localmente

Requisitos: Node.js 20+ e um projeto [Supabase](https://supabase.com) (o plano gratuito chega).

```bash
cd wanderlog
npm install
cp .env.example .env.local   # preencher com o URL e a anon key do teu projeto Supabase
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Base de dados

A aplicação usa as tabelas `profiles`, `posts`, `countries_visited`, `follows`, `likes`, `comments`, `notifications` e `post_views`, e o bucket de armazenamento `post-media`.

<!-- TODO: exportar o esquema e as políticas RLS para supabase/schema.sql -->
O acesso à base de dados é feito a partir do browser com a chave pública, por isso a segurança dos dados depende das políticas **Row Level Security (RLS)** do Supabase, ativas em todas as tabelas.

## Estrutura

```
wanderlog/            aplicação Next.js
  src/app/            páginas (feed, dashboard, blog, perfil, pesquisa, definições…)
  src/components/     Globe, editor de blocos, navbar, ações dos posts
  src/lib/            clientes Supabase e sanitização de HTML
design/prototipo/     protótipo inicial do ecrã de perfil (HTML/JSX)
```

## Próximos passos

- [x] Publicar a demo no Vercel
- [ ] Configurar SMTP próprio para confirmação de conta por email
- [ ] Exportar esquema e políticas RLS para o repositório
- [ ] Dividir o componente `Globe.tsx` em componentes mais pequenos
- [ ] Testes automáticos

## Autor

**Gustavo Monteiro** — estudante de Engenharia Informática e Computação na FEUP
[LinkedIn](https://www.linkedin.com/in/gustavomonteiro06) · [GitHub](https://github.com/gusta24012006)
