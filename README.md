<div align="center">

# 🌍 Volta

**Uma rede social de viagens à volta de um globo 3D.**
Roda o globo, escolhe um país e lê as histórias de quem lá esteve.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://blog-app-j68i.vercel.app)

**[▶ Abrir a demo](https://blog-app-j68i.vercel.app)**

</div>

![Globo interativo do Volta](docs/globo.gif)

## Sobre o projeto

Os blogs de viagem estão normalmente organizados por data ou por autor. No **Volta** estão organizados **pelo mapa**: cada utilizador marca no globo os países que visitou e escreve sobre eles, e quem explora a app roda o globo e carrega num país para ler os blogs desse destino.

É um projeto pessoal, desenvolvido a solo, para aprender a construir uma aplicação web completa: do frontend com gráficos 3D à base de dados, autenticação e publicação.

> **Estado:** em desenvolvimento. As funcionalidades principais estão a funcionar; as que faltam estão em [Próximos passos](#próximos-passos). A interface da aplicação está em português.

## Experimenta

Abre a **[demo](https://blog-app-j68i.vercel.app)** e entra com a conta de demonstração, sem precisares de te registar:

| Email | Password |
|---|---|
| `demo@volta.app` | `Demo2000` |

No **feed**, no separador **Encontrar**, há blogs de outros utilizadores para explorar: roda o globo, carrega num país que brilhe e abre os posts.

> Os blogs publicados na demo são **conteúdo de teste**, criados para mostrar as funcionalidades da aplicação.

## Funcionalidades

**Globo 3D**
- Globo interativo (rodar, zoom, carregar num país) com os países visitados destacados
- No feed, os países com blogs por ler brilham; a cor do globo de cada perfil é personalizável

**Blogs de viagem**
- Editor por blocos: texto rico, imagem, imagem com texto, vídeo do YouTube, música do Spotify e separadores
- Blocos reordenáveis por arrastar e largar, e temas de cor e letra por post
- Rascunhos e publicação; blogs agrupados por país

**Rede social**
- Seguir utilizadores, perfis privados e lista de seguidores
- Feed com dois separadores: **A seguir** (com "stories" de quem segues) e **Encontrar** (blogs de toda a comunidade)
- Gostos, comentários e notificações
- Registo de posts já vistos, para dar prioridade ao que ainda não leste

**Conta**
- Registo, login e onboarding de novos utilizadores
- Edição do perfil, alteração de email e password, e definições de privacidade

![Feed](docs/feed.png)
![Editor de blogs](docs/editor.png)

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Globo 3D | Three.js, react-globe.gl, TopoJSON |
| Editor | TipTap (texto rico), dnd-kit (arrastar e largar) |
| Backend | Supabase: PostgreSQL, autenticação e armazenamento de ficheiros |
| Publicação | Vercel |

## Como funciona

A aplicação não tem um servidor próprio: o frontend em Next.js fala diretamente com o **Supabase**, que trata da base de dados PostgreSQL, da autenticação e do armazenamento das imagens.

```
Browser (Next.js + React)
   │  supabase-js (chave pública)
   ▼
Supabase ── PostgreSQL (dados + políticas RLS)
         ├─ Auth (contas e sessões)
         └─ Storage (imagens dos posts e de perfil)
```

**Modelo de dados**

| Tabela | Guarda |
|---|---|
| `profiles` | Utilizadores: nome, foto, bio, cor do globo, privacidade |
| `posts` | Blogs: país, título, blocos de conteúdo, tema, estado de publicação |
| `countries_visited` | Países marcados por cada utilizador |
| `follows` | Quem segue quem |
| `likes`, `comments` | Interações nos posts |
| `notifications` | Notificações de novos seguidores, gostos e comentários |
| `post_views` | Posts já vistos por cada utilizador |

## Decisões técnicas

- **Vídeo e música por embed, sem armazenamento próprio.** Guardar vídeos no Supabase saía do plano gratuito. Os blocos de vídeo e música guardam apenas o link do YouTube ou do Spotify e mostram o leitor embebido, por isso o custo de armazenamento é zero.
- **Sanitização do conteúdo dos posts.** O texto rico é guardado como HTML e mostrado com `dangerouslySetInnerHTML`. Para evitar ataques XSS, todo o HTML passa pelo **DOMPurify** com uma lista restrita de tags e atributos, e os links só aceitam `http(s)`, `mailto` e caminhos relativos.
- **Segurança na base de dados.** Como o browser acede ao Supabase com a chave pública, as permissões são garantidas por **políticas Row Level Security (RLS)** no PostgreSQL: cada utilizador só pode alterar os seus próprios dados.

## Correr localmente

Requisitos: Node.js 20+ e um projeto [Supabase](https://supabase.com) (o plano gratuito chega).

```bash
git clone https://github.com/gusta24012006/BlogApp.git
cd BlogApp/wanderlog
npm install
cp .env.example .env.local   # preencher com o URL e a anon key do projeto Supabase
npm run dev
```

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000).

## Estrutura

```
wanderlog/                 aplicação Next.js
├─ src/app/                páginas: feed, dashboard, blog, perfil, pesquisa, definições…
├─ src/components/         Globe, editor de blocos, navbar, ações dos posts
└─ src/lib/                clientes Supabase e sanitização de HTML
design/prototipo/          protótipo inicial do ecrã de perfil
docs/                      imagens do README
```

## Próximos passos

- [x] Publicar a demo no Vercel
- [ ] Exportar o esquema da base de dados e as políticas RLS para o repositório
- [ ] No modo "Encontrar", os blogs já vistos deixam de aparecer e o país deixa de brilhar quando não tem mais nada por ver
- [ ] Botão "Surpreende-me": o globo gira e faz zoom até um país aleatório com um blog por ver
- [ ] Configurar um serviço de email próprio para a confirmação de contas
- [ ] Dividir o componente `Globe.tsx` em componentes mais pequenos
- [ ] Testes automáticos

## Autor

**Gustavo Monteiro**, estudante de Engenharia Informática e Computação na FEUP (Universidade do Porto)

[LinkedIn](https://www.linkedin.com/in/gustavomonteiro06) · [GitHub](https://github.com/gusta24012006) · gustavotibe@gmail.com
