import type { Config } from "@react-router/dev/config";

const repositoryParts = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const [repoOwner, repoName] = repositoryParts;
const isGithubPages = process.env.GITHUB_PAGES === "true";
const isUserSite =
  repoOwner && repoName
    ? repoName.toLowerCase() === `${repoOwner.toLowerCase()}.github.io`
    : false;
const basename =
  isGithubPages && repoName && !isUserSite ? `/${repoName}` : "/";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  basename,
} satisfies Config;
