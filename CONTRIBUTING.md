# Contributing to AI Puzzle Generator

Thank you for your interest in contributing to the AI Puzzle Generator! This document provides guidelines for contributing to the project.

## 🎯 Project Goals

Our mission is to create an engaging, AI-powered puzzle platform that provides unlimited, personalized challenges while maintaining high code quality and user experience standards.

## 🛠 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Supabase account (free tier)
- OpenAI API key

### Local Development
```bash
# Clone and setup
git clone https://github.com/dbbuilder/puzzler.git
cd puzzler
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development
npm run dev
```

## 📝 Coding Standards

### TypeScript & Vue.js Guidelines
- **Strict TypeScript**: Use strict mode, no `any` types
- **Composition API**: Prefer Vue 3 Composition API over Options API
- **Component Structure**: Single File Components with `<script setup>` syntax
- **Naming Convention**: PascalCase for components, camelCase for functions/variables
- **Props & Emits**: Define interfaces for all props and emitted events

### Code Quality Requirements
- **Test Coverage**: Minimum 90% coverage for all new features
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Use structured logging for debugging and monitoring
- **Comments**: Document complex logic and AI integration points
- **Performance**: Maintain 60fps gameplay and <2s load times

### AI Integration Standards
- **Structured Prompts**: Use validated JSON schemas for AI responses
- **Fallback Systems**: Always provide backup content for AI failures
- **Quality Assurance**: Validate all AI-generated puzzles for solvability
- **Rate Limiting**: Implement proper API usage controls
- **Privacy**: Never send user data to AI services without consent

## 🧪 Testing Requirements

### Test-Driven Development (TDD)
1. **Write failing tests first** for all new features
2. **Implement minimal code** to make tests pass
3. **Refactor** while keeping tests green
4. **Integration tests** for user workflows
5. **E2E tests** for critical user journeys

### Test Categories
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **Component Tests**: Vue component rendering and interactions
- **Game Logic Tests**: Puzzle generation and validation
- **Performance Tests**: Load times and frame rates

## 🎮 Game Development Guidelines

### Puzzle Design Principles
- **Solvability**: Every puzzle must have exactly one solution
- **Accessibility**: Support screen readers and keyboard navigation
- **Progressive Difficulty**: Smooth learning curves
- **Visual Clarity**: Clear, intuitive interfaces
- **Feedback**: Immediate response to player actions

### Graphics & Animation Standards
- **60fps Target**: Smooth animations on target devices
- **Responsive Design**: Seamless experience across devices
- **Loading States**: Engaging feedback during operations
- **Error States**: Clear visual indicators for problems
- **Success Animations**: Satisfying completion feedback

## 📋 Contribution Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Individual feature development
- **bugfix/***: Bug fixes
- **hotfix/***: Critical production fixes

### Pull Request Process
1. **Create feature branch** from develop
2. **Implement changes** following TDD methodology
3. **Run all tests** and ensure they pass
4. **Update documentation** for new features
5. **Submit PR** with detailed description
6. **Code review** with at least one maintainer approval
7. **Merge** after all checks pass

### Commit Message Format
```
type(scope): description

feat(ai): add structured prompt validation for logic puzzles
fix(game): resolve canvas scaling on mobile devices
docs(readme): update installation instructions
test(puzzle): add unit tests for sudoku generator
refactor(ui): improve button component accessibility
```

## 🎨 Design System Guidelines

### UI/UX Principles
- **Dark Theme First**: Optimized for extended gameplay sessions
- **Consistent Spacing**: Use Tailwind spacing scale
- **Color Accessibility**: WCAG AA compliance for all text
- **Touch Targets**: Minimum 44px for mobile interactions
- **Focus Management**: Clear keyboard navigation paths

### Component Development
- **Reusable Components**: Build for multiple use cases
- **Props Interface**: Well-defined TypeScript interfaces
- **Slot Support**: Flexible content composition
- **Event Handling**: Proper event emission patterns
- **Style Isolation**: Scoped styles with utility classes

## 🔧 AI Prompt Engineering

### Prompt Development Guidelines
- **Schema Validation**: All responses must match Zod schemas
- **Iterative Testing**: Test prompts with various inputs
- **Error Handling**: Graceful degradation for invalid responses
- **Documentation**: Document prompt reasoning and examples
- **Version Control**: Track prompt changes and effectiveness

### Quality Metrics
- **Solvability Rate**: >95% of generated puzzles must be solvable
- **Difficulty Accuracy**: Generated difficulty matches player expectations
- **Theme Consistency**: Visual and narrative elements align
- **Response Time**: <5 seconds for puzzle generation
- **Cost Efficiency**: Optimize token usage for sustainability

## 🐛 Bug Reports

### Issue Template
When reporting bugs, please include:
- **Environment**: Browser, OS, device details
- **Steps to Reproduce**: Clear, minimal reproduction steps
- **Expected Behavior**: What should have happened
- **Actual Behavior**: What actually happened
- **Screenshots/Videos**: Visual evidence when applicable
- **Console Logs**: Relevant error messages
- **User Impact**: How many users are affected

### Priority Levels
- **Critical**: Crashes, data loss, security vulnerabilities
- **High**: Major features broken, significant UX issues
- **Medium**: Minor features affected, workarounds available
- **Low**: Cosmetic issues, nice-to-have improvements

## 📈 Performance Guidelines

### Optimization Targets
- **Initial Load**: <2 seconds to interactive
- **Puzzle Generation**: <5 seconds with loading feedback
- **Gameplay Frame Rate**: Consistent 60fps
- **Memory Usage**: <100MB for extended sessions
- **Bundle Size**: <1MB initial JavaScript

### Monitoring Requirements
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Real user monitoring
- **AI Usage Analytics**: Token consumption tracking
- **User Behavior**: Engagement and retention metrics

## 📚 Documentation Standards

### Code Documentation
- **Function Comments**: JSDoc for all public functions
- **Complex Logic**: Inline comments for algorithms
- **API Integration**: Document external service interactions
- **Configuration**: Environment variable documentation
- **Deployment**: Production setup instructions

### User Documentation
- **README**: Getting started and development setup
- **API Docs**: Generated from TypeScript interfaces
- **Game Rules**: Clear puzzle type explanations
- **Accessibility**: Screen reader and keyboard instructions
- **Troubleshooting**: Common issues and solutions

## 🎯 Review Process

### Code Review Checklist
- [ ] Follows TypeScript and Vue.js standards
- [ ] Includes comprehensive tests with >90% coverage
- [ ] Has proper error handling and logging
- [ ] Updates documentation as needed
- [ ] Maintains accessibility standards
- [ ] Optimized for performance targets
- [ ] AI integrations include fallbacks
- [ ] UI changes are responsive and tested

### Review Timeline
- **Standard PRs**: 48 hours for initial review
- **Critical Fixes**: 4 hours for emergency reviews
- **Large Features**: 1 week for comprehensive review
- **Documentation**: 24 hours for content review

Thank you for contributing to making puzzle gaming more engaging and accessible! 🧩✨
