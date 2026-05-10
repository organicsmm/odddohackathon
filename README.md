# Welcome to your Lovable project

TODO: Document your project here

## Contributing — Git hooks

This repo uses [Husky](https://typicode.github.io/husky) to run quality checks
before every commit, so duplicate-function errors and other type/lint issues
can't slip into `main`.

### Install the hooks

Husky installs automatically the first time you run `npm install` (the
`prepare` script in `package.json` calls `husky`). Just clone and install:

```sh
npm install
# or: bun install / pnpm install / yarn
```

After install, a `.husky/` directory is wired up and Git will run the hooks
from there. No manual `git config core.hooksPath` step is needed.

If hooks aren't running for some reason, re-run:

```sh
npm run prepare
```

### What runs on `git commit`

The `.husky/pre-commit` hook runs, in order:

1. **`tsc --noEmit`** — full TypeScript type-check across the project. Fails
   the commit on any type error (including duplicate function/identifier
   errors).
2. **`eslint .`** with `--max-warnings=0` — runs only if an ESLint config
   (`eslint.config.js`, `.eslintrc*`) is present. Fails on any error or
   warning.

If either step fails, the commit is aborted and the offending output is
printed in your terminal. Fix the reported issues and `git commit` again.

### Run the same checks manually

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
```

### Bypass (use sparingly)

In a genuine emergency you can skip the hook with:

```sh
git commit --no-verify -m "..."
```

Please don't make this a habit — CI runs the same checks and will reject the
push.
