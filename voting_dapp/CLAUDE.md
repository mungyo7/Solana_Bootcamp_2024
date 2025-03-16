# Voting dApp Project Guide

## Build Commands
- `npm run dev` - Start NextJS development server
- `npm run build` - Build the NextJS application
- `npm run lint` - Run ESLint for code linting
- `npm run anchor-build` - Build Anchor program
- `npm run anchor-test` - Run all Anchor program tests
- `npm run anchor-test -- -t "test name"` - Run a specific test
- `npm run anchor-localnet` - Start a local Solana validator

## Code Style Guidelines
- **TypeScript**: Use strict typing with explicit interface/type definitions
- **Imports**: Group imports by external libs, then project modules, then relative paths
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **React Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes for styling components
- **Error Handling**: Use try/catch blocks for async operations with explicit error types
- **State Management**: Prefer React Query for server state, Jotai for client state
- **Solana**: Follow Anchor program conventions for account structures
- **Testing**: Write tests for all Solana program instructions

## Anchor Program Development
- Program ID: coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF
- Test using jest with ts-jest preset