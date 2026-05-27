# Contributing to myRecovery

Thank you for your interest in contributing to myRecovery! This document provides guidelines and instructions for contributing.

## 📋 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## 🐛 Reporting Bugs

Found a bug? Please create an issue with the following information:

1. **Title:** Clear, descriptive title
2. **Description:** What did you expect vs. what happened?
3. **Steps to Reproduce:** Detailed steps to reproduce the issue
4. **Environment:** 
   - Node.js version
   - OS (Windows, macOS, Linux)
   - Browser (if applicable)
5. **Screenshots:** If applicable, add screenshots

**Issue Template:**
```
## Bug Description
[Describe the bug]

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Node.js: v16.0.0
- OS: macOS
- Browser: Chrome 100

## Screenshots
[If applicable]
```

## 🚀 Feature Requests

Have an idea for improvement? Please open an issue with:

1. **Title:** "Feature: [Brief description]"
2. **Description:** Why this feature would be useful
3. **Use Cases:** Specific scenarios where this helps
4. **Possible Implementation:** Any ideas on how to implement it

## 💻 Development Process

### 1. Fork the Repository
```bash
git clone https://github.com/cheyoung1983-sudo/myRecovery.git
cd myRecovery
```

### 2. Create a Feature Branch
Use descriptive branch names following this pattern:
- `feature/feature-name` - for new features
- `fix/bug-name` - for bug fixes
- `docs/description` - for documentation
- `refactor/description` - for code refactoring

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow the existing code style
- Write clear, descriptive commit messages
- Keep commits focused and atomic

### 4. Commit Messages

Follow this format:
```
type: subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring without feature/fix
- `test` - Adding or updating tests
- `chore` - Build, dependency updates, etc.

**Examples:**
```
feat: add authentication component
fix: resolve duplicate GroundingTool definition
docs: update Firebase setup instructions
```

### 5. Test Your Changes

```bash
npm run dev          # Test locally
npm run build        # Verify build works
```

### 6. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:
- Clear title and description
- Reference any related issues (#issue-number)
- List of changes made
- Screenshots/videos (if applicable)

**PR Template:**
```
## Description
[Brief description of changes]

## Related Issues
Fixes #[issue-number]

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- ...

## Testing
[ ] Local development testing completed
[ ] Build verification completed
[ ] No new console errors

## Screenshots/Videos
[If applicable]
```

## 📝 Commit Message Guidelines

Good commit messages help maintain a clean project history:

✅ **Good:**
```
feat: add user authentication to recovery tracking
```

✅ **Good:**
```
fix: resolve firebase import error in build

The build was failing due to missing firebase-applet-config.json.
Updated to use environment variables exclusively as intended.
```

❌ **Bad:**
```
fixed stuff
```

❌ **Bad:**
```
WIP: random changes
```

## 🎯 Pull Request Guidelines

1. **One feature per PR:** Keep PRs focused and manageable
2. **Clear description:** Explain what and why
3. **Keep it updated:** Rebase on main if needed
4. **Be responsive:** Respond to review feedback promptly
5. **Reference issues:** Link to related issues

## 🔍 Code Style

- Use TypeScript for type safety
- Follow existing code patterns in the project
- Use meaningful variable/function names
- Add comments for complex logic
- Maintain consistent indentation (2 spaces)

## 📚 Documentation

If your changes affect:
- **Setup process:** Update README.md
- **Configuration:** Update this guide
- **Features:** Add inline code comments
- **Deployment:** Update deployment documentation

## ✅ Review Process

1. At least one maintainer review is required
2. All discussions should be addressed
3. Build checks must pass
4. Code will be merged after approval

## 🙏 Thank You!

Your contributions help make myRecovery better for everyone. We truly appreciate your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.
