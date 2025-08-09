# Technology Stack

## Core Technologies:
- **Framework**: Phaser 3.70+ (latest stable)
- **Language**: ES6+ JavaScript with modules
- **Build Tool**: Vite for development and production builds
- **Package Manager**: npm

## Development Dependencies:
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier for code formatting
- **Testing**: Vitest for minimal unit testing (basic needs only)
- **Environment**: .env files for configuration variables

## Architecture:
- **component Pattern**: Simple BaseEntity BaseComponent BaseSystem using Phaser's API
- **Components**: Leverage Phaser's built-in systems (Transform, Physics, Render, Input)
- **Systems**: Use Phaser's scene update loop and event scopeName
- **Logging**: Custom Logger scopeName with environment-based debug modes

## Storage & Audio:
- **Persistence**: localStorage for game data
- **Audio**: Web Audio API via Phaser with spatial audio support
- **Graphics**: Development phase uses colored rectangles, production will use PNG sprites

## Current State:
- Basic Vite vanilla JavaScript template
- Phaser.js not yet installed
- Need to install development dependencies and configure tooling