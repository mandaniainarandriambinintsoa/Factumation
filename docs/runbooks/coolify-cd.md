# Coolify continuous deployment

Production deployment runs only for a push to `main` and only after both CI jobs succeed. GitHub Actions asks Coolify to deploy each resource sequentially, waits for completion, verifies the deployed Git commit, and checks the public health URL.

## GitHub production environment

Create a GitHub environment named `production` with:

- secret `COOLIFY_API_TOKEN`: a Coolify token limited to `read` and `deploy`;
- variable `COOLIFY_URL`: the HTTPS origin of the Coolify instance;
- variable `COOLIFY_DEPLOYMENTS`: an ordered JSON array of `{ "name", "uuid", "healthUrl" }` objects.

Resources are deployed in array order. Put an API before a web frontend when both must change, so the frontend never reaches an older incompatible API. The workflow deliberately avoids parallel production builds on the shared VPS.

## Onboarding another application

1. Give the repository a production-ready Dockerfile and an unauthenticated liveness endpoint that returns `2xx` without exposing data.
2. Create the Coolify application once, selecting `main`, the Dockerfile, its port, domain, environment variables, and health check.
3. Copy `scripts/coolify-deploy.mjs`, its test, and the `deploy-production` job into the repository.
4. Configure the three GitHub environment values above. Multiple resources can share one ordered deployment list.
5. Protect `main` with the CI checks, merge a harmless change, and confirm that Coolify reports the same SHA as GitHub and that the live health URL passes.

The Coolify token must never be committed, printed, placed in a task prompt, or stored in a worktree. Rotate it at least yearly and immediately after suspected exposure.
