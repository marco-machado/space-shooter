# Essential Development Commands

## Setup Commands (First Time):
```bash
# Install Phaser.js
npm install phaser

# Install development dependencies
npm install -D eslint prettier vitest jsdom
npm install -D @eslint/js eslint-config-prettier eslint-plugin-prettier

# Create environment configuration
cp .env.example .env
```

## Daily Development Workflow:
```bash
# Start development server (primary command)
npm run dev                # Vite dev server at localhost:5173

# Code quality (run before commits)
npm run lint               # Check ESLint errors
npm run lint:fix           # Auto-fix ESLint errors
npm run format             # Format code with Prettier
npm run format:check       # Check if code is properly formatted

# Testing (minimal, for utilities only)
npm run test               # Run basic unit tests
npm run test:watch         # Run tests in watch mode for TDD

# Build commands
npm run build              # Build for production
npm run preview            # Preview production build
```

## Task Completion Commands:
When finishing any development task, ALWAYS run:
1. `npm run lint` - Ensure no linting errors
2. `npm run format` - Ensure consistent formatting
3. `npm run test` - Ensure basic tests pass

## BaseSystem Commands (Darwin/macOS):
```bash
# File operations
ls -la                     # List files with details
find . -name "*.js"        # Find JavaScript files
grep -r "pattern" src/     # Search for patterns (use rg if available)

# Git operations
git status                 # Check repository status
git add .                  # Stage all changes
git commit -m "message"    # Commit changes
```

## Environment Variables:
Edit `.env` file for development configuration:
```bash
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_PHYSICS_DEBUG=true
VITE_AUDIO_ENABLED=true
```