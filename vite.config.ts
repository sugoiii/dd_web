import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const port = Number.parseInt(process.env.PORT ?? "", 10) || 3000;
const repositoryParts = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const [repoOwner, repoName] = repositoryParts;
const isGithubPages = process.env.GITHUB_PAGES === "true";
const isUserSite =
  repoOwner && repoName
    ? repoName.toLowerCase() === `${repoOwner.toLowerCase()}.github.io`
    : false;

export default defineConfig({
  base: isGithubPages && repoName && !isUserSite ? `/${repoName}/` : "/",
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port,
    strictPort: true,
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
