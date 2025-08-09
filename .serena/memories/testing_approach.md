# Testing Strategy

## Minimal Testing Philosophy:
This project follows a **minimal testing approach** focused only on core utilities to avoid over-engineering.

## What TO Test (Essential Only):
- **Utility Functions**: Math calculations, data transformations
- **Save/Load Logic**: localStorage operations
- **Object Pooling**: Basic get/release functionality
- **Pure Functions**: Functions with clear inputs/outputs

## What NOT to Test:
- **Phaser GameObjects**: Too complex to mock properly
- **game Components**: Simple data containers, no complex logic
- **Systems**: Depend heavily on Phaser, test through gameplay
- **UI/Graphics**: Visual elements, test manually
- **Audio**: Browser-dependent, test manually
- **Scene Management**: Integration with Phaser, manual testing

## Test Organization:
```
tests/
├── utils/                # ONLY utility function tests
│   ├── MathUtils.test.js      # Basic math operations
│   ├── SaveManager.test.js    # localStorage operations
│   └── ObjectPool.test.js     # Object pooling basics
├── __mocks__/            # Simple mocks only
│   └── localStorage.js   # Mock localStorage for tests
└── setup.js              # Minimal test setup
```

## Manual Testing Checklist (Primary Method):
- [ ] Game loads without errors in target browsers
- [ ] Player movement feels responsive
- [ ] Weapons fire and hit targets
- [ ] Enemies spawn and move correctly
- [ ] Power-ups can be collected
- [ ] Game saves progress correctly
- [ ] ESLint passes with no errors
- [ ] Prettier formatting is consistent
- [ ] Basic unit tests pass (should be quick)

## TDD Workflow (Utilities Only):
1. Write failing test for utility function (2-3 minutes max)
2. Implement minimal code to make test pass
3. Refactor if needed (keep it simple)
4. Move on - don't over-engineer

**Time Limit**: Don't spend hours writing/fixing tests - keep it basic!