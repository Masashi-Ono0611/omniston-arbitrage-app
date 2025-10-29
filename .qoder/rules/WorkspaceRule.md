---
trigger: manual
---
# Global Rules

## Language
- Always use English in app code, debugging logs, comments (including comments in git commit messages) documentation, and README.
- Always speak Japanese in conversation.
- Always end your response with 2-3 suggested next actions using the suggested_responses tool. These should be concise (3-10 words each) and directly actionable.
- Do not use the tabular format in the conversation (as it does not display well). Instead, use markdown format, etc.

## Coding pattern preferences
- When testing locally, always stop the existing process before starting a new one. Avoid running multiple local tests simultaneously.
- Always prefer simple solutions  
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality  
- Write code that takes into account the different environments: dev, test, and prod  
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested  
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don’t have duplicate logic.  
- Keep the codebase very clean and organized  
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once  
- Avoid having files over 200–300 lines of code. Refactor at that point.  
- Mocking data is only needed for tests, never mock data for dev or prod  
- Never add stubbing or fake data patterns to code that affects the dev or prod environments  
- Never overwrite my .env file without first asking and confirming

## Coding workflow preferences
- Focus on the areas of code relevant to the task
- Do not touch code that is unrelated to the task
- Write thorough tests for all major functionality
- Avoid making major changes to the patterns and architecture of how a feature works, after it has shown to work well, unless explicitly instructed
- Always think about what other methods and areas of code might be affected by code changes

## External Repository & OSS Security Workflow
This workflow applies to every repository cloned from GitHub or any other external source, regardless of whether it is internal or public. The goal is to prevent supply-chain attacks, malware execution, leaked secrets, and unauthorized code behavior.

### 1. Clone Policy
- Running `git clone` is permitted, but **do not build, install, or execute anything immediately after cloning**.
- Do not run any of the following commands until security checks are completed:
  - `npm install`, `yarn install`, `pnpm install`
  - `pip install`
  - `go build`, `cargo build`
  - `docker build`, `docker compose up`
  - `make`, `bash install.sh`, or any script
- Do not clone with `--recurse-submodules` on first pull. Review submodules before fetching them.

### 2. Immediate Security Scans (must be completed before reading or modifying code)
Run each item in order:
1. **Gitleaks** – Detect hardcoded secrets, keys, or credentials.
```bash
gitleaks detect --source .
```
2. **Trivy (repository scan)** – Detect vulnerabilities, exposed secrets, and misconfigurations.
```bash
trivy repo .
```
3. **ripgrep/grep quick IOC scan** – Hunt for suspicious patterns.
```bash
rg -n -e "curl " -e "wget " -e "eval" -e "bash -c" -e "base64" -e "rm -rf" -e "sudo "
```
- **If any High or Critical issues are found, stop immediately and escalate before proceeding.**

### 3. Manual Code Review (required before execution)
Inspect the following files/directories for malicious commands or network behavior:
- `package.json` – `postinstall` hooks or suspicious npm scripts.
- `requirements.txt` / `Pipfile` – Unknown or untrusted dependencies.
- `Dockerfile` / `docker-compose.yml` – Auto-downloads, `curl`, `wget`, or remote scripts.
- `.github/workflows/` – Supply-chain actions through CI.
- `.devcontainer/` / `.vscode/` – Auto-run development scripts.
- `install.sh`, `Makefile`, `*.sh` – Destructive or hidden commands.

### 4. Block Auto-Scripts and Unsafe Installs
- When Node installation is unavoidable:
```bash
npm install --ignore-scripts
```
- For Python:
  - Always use a virtual environment.
  - Scan dependencies before installing.
- For Docker:
  - Build only after reviewing the `Dockerfile`.
  - Prefer building with network isolation when possible:
```bash
docker build --network=none .
```

### 5. Isolated Execution Requirement
Only run untrusted code in an isolated environment:
- Allowed examples:
  - Docker container configured with `--network=none` and `--read-only`.
  - Virtual machine with a restorable snapshot.
- Not allowed:
  - Running on the host machine.
  - Granting access to real environment variables, `.ssh`, or cloud credentials.

### 6. Final Adoption Decision
Proceed only if all conditions are met:
- No Critical or High findings in any scan.
- Manual review surfaces no suspicious behavior.
- Dependencies are trusted and actively maintained.

If any doubt remains, escalate and do not proceed.

### 7. Secrets Policy
- Never place `.env`, secrets, or credentials into unverified code.
- Never run code that attempts outbound network calls without prior review.

### Summary
**Clone → Scan → Review → Isolate → Execute (only if safe) → Adopt or Reject**

This workflow is mandatory for all external repository usage.


## Tech Stack
### Frontend
- Next.js with TypeScript
- Latest App Router instead of the older Page Router (recommended for current projects)
- URL and Directory Structure
  - The directory structure within bagel-finance/src/app/ corresponds to the application's URL structure
  - Example: The profile page URL corresponds to the file path: bagel-finance/src/app/(bottomNavigation)/profile/page.tsx
  - The (bottomNavigation) folder indicates that all nested pages will display a bottom navigation bar (implemented in bagel-finance/src/app/(bottomNavigation)/layout.tsx)
  - An exception is the bagel-finance/src/app/api/ directory, which handles backend API logic. Frontend components can call endpoints like /api/version/route.ts to trigger backend processes

### Telegram Mini Apps (TMA)
- This library is essential for running your web app as a Telegram Mini App (TMA)
- Opening the app directly from a web browser is not possible once TMA functionality is enabled
- To facilitate development:
  - Local environments use a mock system to simulate TMA behavior (implemented in bagel-finance/src/app/_components/TelegramAppProvider.tsx)
  - Development Process
    - For local browser access: Run pnpm run dev and visit localhost:3000
    - For TMA access via Telegram:
      - Use ngrok to expose localhost to the internet
      - Run pnpm run build followed by pnpm start for production-like testing (direct browser access will throw errors)
      - Update the .env variable WEB_URL accordingly and run pnpm run ngrok
      - Access the app through the designated development bot: @blgcll_bot
      - useInitData is utilized across most pages requiring Telegram ID handling (e.g., bagel-finance/src/app/(bottomNavigation)/frens/_components/InviteButton.tsx)

### Database
- Prisma
  - For local database viewing and editing, use Prisma Studio (`npx prisma studio`) which provides a web interface at http://localhost:5555

### UI Design
- Chakra UI
  - Provides UI design functionality
  - The project primarily uses v2, even though v3 is available
  - The UI design heavily relies on Chakra UI's default styles to maintain simplicity and clarity

### TON Integration
- Key Libraries for TON
  - tonconnect/ui-react
    - Handles wallet connections and transactions
  - ton/ton
    - Used to fetch TON blockchain data
    - Relies on the TON Center API

## Others
- Always use Tonviewer(https://tonviewer.com/) when debugging TON transactions

## Package Version Guidelines
- **Core Dependencies**
  - Next.js: 14.2.x
  - React: 18.x
  - TypeScript: 5.x
  - Chakra UI: 2.8.x
  - @ton/* packages: 15.x
  - @tonconnect/ui-react: 2.x

- **Key Development Dependencies**
  - @types/node: 20.x
  - @types/react: 18.x
  - @types/react-dom: 18.x
  - eslint: 8.x
  - prisma: 5.x

- **Version Management**
  - Use exact versions (with ^) for all dependencies to ensure consistent installations
  - Always test with the exact versions listed above before upgrading
  - Document any version-specific workarounds in package.json comments

- **Update Policy**
  - Security patches: Update immediately
  - Minor versions: Test in development before updating
  - Major versions: Require team discussion and thorough testing

- **TON-Specific Versions**
  - @ton/ton: 15.x (stable API version)
  - @tonconnect/ui-react: 2.x (latest stable)
  - @ton/crypto: 3.x