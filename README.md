# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Static single-page application build suitable for static hosts
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

#### Running on Codex

Codex expects preview applications to bind to port `3000` and listen on all network interfaces. The Vite dev server is preconfigured for this environment, so running `npm run dev` will automatically bind to `0.0.0.0:3000`. If you need to override the port, set the `PORT` environment variable before starting the server.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   └── client/    # Static assets
```

### GitHub Pages Deployment

This project ships with an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the static site and publishes it to GitHub Pages.

1. Ensure GitHub Pages is enabled for the repository via the **Settings → Pages** menu and set the source to **GitHub Actions**.
2. Push to the `main` branch (or run the workflow manually from the **Actions** tab) and the site will be built with `npm run build` in SPA mode.
3. The workflow uploads the contents of `build/client`—including an automatically generated `404.html` for client-side routing—to GitHub Pages using the recommended `deploy-pages` action.

When the workflow runs in GitHub Pages it automatically adjusts the Vite `base` path, so the app will work whether it is served from `https://<user>.github.io/` or `https://<user>.github.io/<repo>/`.

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
