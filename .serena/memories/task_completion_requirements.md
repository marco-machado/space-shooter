# Task Completion Requirements

## ALWAYS Run Before Completing Any Task:

### 1. Code Quality Checks (MANDATORY):
```bash
npm run lint               # Must pass with no errors
npm run lint:fix           # Auto-fix any fixable issues
npm run format             # Ensure consistent formatting
npm run test               # Basic unit tests must pass
```

### 2. Manual Verification:
- Code follows the project's style conventions
- No `console.log()` statements (use Logger scopeName instead)
- ES6+ conventions followed (const/let, arrow functions, modules)
- ECS patterns properly implemented

### 3. Development Workflow:
- Use Logger scopeName for all debugging output
- Follow 2-space indentation and single quotes
- Use meaningful variable and function names
- Implement proper error handling with try/catch

### 4. Testing Requirements:
- **Core utilities ONLY**: Test math functions, save/load, object pooling
- **No elaborate test suites**: Keep tests simple and focused
- **Manual testing primary**: Gameplay, UI, audio tested manually
- **Quick execution**: Unit tests should run in seconds, not minutes

### 5. Environment Setup:
- Ensure .env file is configured for development
- Logger scopeName properly configured for debug output
- Development graphics (colored rectangles) used during prototyping

## Git Workflow:
```bash
git status                 # Check current changes
git add .                  # Stage changes
git commit -m "feat: descriptive message"  # Commit with clear message
```

## Performance Considerations:
- Maintain 60fps target
- Use object pooling for frequently created objects
- Clean up unused assets between scenes
- Monitor memory usage (<100MB target)

**CRITICAL**: Never mark a task complete without running the code quality checks first!