# 🤝 Contributing to TURNUVAYONETIM

Thank you for considering contributing to TURNUVAYONETIM! This guide will help you get started.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Commit Message Format](#commit-message-format)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Project Structure](#project-structure)

---

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report inappropriate behavior to maintainers

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker Desktop installed and running
- Git configured with your name and email

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/yourusername/turnuvayonetim.git
cd turnuvayonetim

# 2. Install dependencies
npm install

# 3. Start Docker services
npm run docker:up

# 4. Setup database
npm run db:generate
npm run db:push

# 5. Start development servers
START-ALL.bat  # Windows
# or
./START-ALL.ps1  # PowerShell
```

Verify everything is working:
- Frontend: http://localhost:3005
- Backend: http://localhost:4000/health
- WebSocket: Should auto-connect from frontend

---

## 💻 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout master
git pull origin master

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-rebuy-system`)
- `fix/` - Bug fixes (e.g., `fix/clock-sync-issue`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `docs/` - Documentation updates (e.g., `docs/update-api-guide`)
- `test/` - Test additions (e.g., `test/tournament-service`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### 2. Make Your Changes

```bash
# Make changes to the code
# Test your changes thoroughly

# Check for errors
npm run type-check
npm run lint
```

### 3. Run Tests

```bash
# Run all tests
npm run test

# Run tests for specific package
cd apps/backend && npm run test
```

---

## 🎨 Code Style Guidelines

### TypeScript

- Use **TypeScript** for all new code
- Enable strict mode in tsconfig.json
- Prefer interfaces over types for object shapes
- Use explicit return types for functions

**Good:**
```typescript
interface TournamentConfig {
  name: string;
  buyIn: number;
  startTime: Date;
}

function createTournament(config: TournamentConfig): Promise<Tournament> {
  // Implementation
}
```

**Avoid:**
```typescript
function createTournament(config: any) {
  // No type safety
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `tournament-service.ts`)
- **Classes**: PascalCase (e.g., `TournamentService`)
- **Functions**: camelCase (e.g., `calculatePayouts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`)
- **Interfaces**: PascalCase with I prefix optional (e.g., `Tournament` or `ITournament`)
- **Types**: PascalCase (e.g., `PlayerStatus`)

### Code Organization

```typescript
// 1. Imports (external, then internal)
import { Router } from 'express';
import { prisma } from '@/lib/prisma';

// 2. Types and interfaces
interface ServiceConfig {
  // ...
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Main implementation
export class TournamentService {
  // ...
}

// 5. Helper functions (if any)
function calculateLevel(time: number): number {
  // ...
}
```

### Comments

- Use JSDoc for public APIs
- Add inline comments for complex logic
- Avoid obvious comments

```typescript
/**
 * Calculates tournament payouts based on prize pool and structure
 * @param prizePool - Total prize pool in currency units
 * @param structure - Payout structure percentages
 * @returns Array of payout amounts per position
 */
export function calculatePayouts(
  prizePool: number,
  structure: PayoutStructure
): number[] {
  // Complex calculation logic here
}
```

---

## 📝 Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Feature:**
```
feat(clock): add pause/resume functionality

- Implement pause button in tournament clock
- Add WebSocket events for pause state sync
- Update clock engine to handle paused state

Closes #123
```

**Bug Fix:**
```
fix(seating): resolve player overlap issue

Players were overlapping at 10-seat tables due to
incorrect radius calculation.

Fixes #456
```

**Simple Change:**
```
docs: update setup instructions for Windows
```

### Rules

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- Limit first line to 72 characters
- Reference issues and PRs in footer

---

## 🔄 Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code compiles without errors (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript types are correct (`npm run type-check`)
- [ ] Code is linted (`npm run lint`)
- [ ] New code has tests
- [ ] Documentation is updated (if needed)
- [ ] Commit messages follow convention

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Go to repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

3. **PR Title Format**
   ```
   feat(scope): Brief description of changes
   ```

4. **PR Description Template**
   ```markdown
   ## Summary
   Brief description of what this PR does

   ## Changes
   - Added feature X
   - Fixed bug Y
   - Updated documentation for Z

   ## Testing
   - [ ] Tested locally
   - [ ] Added unit tests
   - [ ] Tested with Docker containers

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Related Issues
   Closes #123
   ```

### Code Review

- Be open to feedback
- Respond to comments promptly
- Make requested changes in new commits
- Don't force-push after review starts
- Mark conversations as resolved when addressed

### After Approval

Maintainers will merge your PR using **squash and merge** strategy.

---

## 🧪 Testing Requirements

### Unit Tests

All new features must include unit tests:

```typescript
// tournament.service.test.ts
describe('TournamentService', () => {
  describe('createTournament', () => {
    it('should create a tournament with valid config', async () => {
      const config = {
        name: 'Test Tournament',
        buyIn: 100,
        startTime: new Date(),
      };

      const tournament = await service.createTournament(config);

      expect(tournament.name).toBe('Test Tournament');
      expect(tournament.buyIn).toBe(100);
    });

    it('should throw error for invalid buy-in', async () => {
      const config = {
        name: 'Test',
        buyIn: -100,
        startTime: new Date(),
      };

      await expect(
        service.createTournament(config)
      ).rejects.toThrow('Invalid buy-in amount');
    });
  });
});
```

### Integration Tests

Test API endpoints and WebSocket events:

```typescript
describe('Tournament API', () => {
  it('POST /tournaments should create tournament', async () => {
    const response = await request(app)
      .post('/tournaments')
      .send({
        name: 'Test Tournament',
        buyIn: 100,
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

### Test Coverage

- Aim for **80%+ coverage** for new code
- Critical paths should have **100% coverage**
- Run coverage report: `npm run test:coverage`

---

## 📁 Project Structure

Understanding the monorepo structure:

```
turnuvayonetim/
├── apps/
│   ├── web/           # Next.js frontend (Port 3005)
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/ # React components
│   │   └── lib/       # Frontend utilities
│   │
│   ├── backend/       # Express + tRPC API (Port 4000)
│   │   ├── src/
│   │   │   ├── routers/     # tRPC routers
│   │   │   ├── controllers/ # Business logic
│   │   │   ├── middleware/  # Auth, validation
│   │   │   └── services/    # Core services
│   │   └── tests/
│   │
│   ├── ws/            # WebSocket server (Port 3003)
│   │   └── src/
│   │       ├── clock-engine.ts  # Tournament clock logic
│   │       └── index.ts         # Socket.IO server
│   │
│   └── cli/           # Command-line tools
│
├── packages/
│   ├── db/            # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── index.ts
│   │
│   ├── shared/        # Shared utilities
│   │   └── src/
│   │       ├── types/   # Shared TypeScript types
│   │       └── utils/   # Shared utilities
│   │
│   └── ui/            # Shared UI components
│       └── src/
│           └── components/
│
├── docs/              # Documentation
│   ├── archive/       # Old documentation
│   └── deployment/    # Deployment guides
│
└── scripts/           # Build and utility scripts
```

### Where to Add Code

- **New API endpoint**: `apps/backend/src/routers/`
- **Business logic**: `apps/backend/src/controllers/` or `apps/backend/src/services/`
- **React component**: `apps/web/components/`
- **Database model**: `packages/db/prisma/schema.prisma`
- **Shared type**: `packages/shared/src/types/`
- **WebSocket event**: `apps/ws/src/index.ts`

---

## 🔍 Common Tasks

### Adding a New Database Model

1. Edit `packages/db/prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)
3. Regenerate client: `npm run db:generate`

### Adding a New API Endpoint

1. Create router in `apps/backend/src/routers/your-router.ts`
2. Add to main router in `apps/backend/src/routers/index.ts`
3. Add types to `packages/shared/src/types/`
4. Test with `curl` or Postman

### Adding a New Frontend Page

1. Create page in `apps/web/app/your-page/page.tsx`
2. Add components to `apps/web/components/`
3. Use tRPC hooks for API calls
4. Test at http://localhost:3005/your-page

---

## 📞 Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/yourusername/turnuvayonetim/discussions)
- **Bug?** Create an [Issue](https://github.com/yourusername/turnuvayonetim/issues)
- **Stuck?** Ask in discussions or comment on your PR

---

## 🎉 Thank You!

Your contributions make TURNUVAYONETIM better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
