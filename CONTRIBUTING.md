# Contributing to Timeloop

Thank you for your interest in contributing to Timeloop! 🎉

Timeloop is a minimalist time tracking application, and we welcome contributions that align with our philosophy of simplicity and efficiency.

## Table of Contents

- [Types of Contributions](#types-of-contributions)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Building](#building)
- [Code of Conduct](#code-of-conduct)
- [Questions](#questions)

## Types of Contributions

We welcome the following types of contributions:

- 🐛 **Bug reports**: Report issues you encounter
- 💡 **Feature suggestions**: Propose new features (keeping minimalism in mind)
- 🌍 **Translations**: Add or improve translations
- 📝 **Documentation**: Improve README, guides, or code comments
- 💻 **Code**: Fix bugs or implement features

**Important**: Before working on a major feature, please open an issue to discuss it first. This ensures the feature aligns with Timeloop's minimalist philosophy.

## Development Setup

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **Rust** and **Cargo** (latest stable version)
- **Tauri CLI** (will be installed via npm)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/maxpertici/timeloop.git
cd timeloop
```

2. **Install dependencies**

```bash
npm install
```

3. **Run in development mode**

```bash
npm run tauri dev
```

The application will open automatically with hot-reload enabled.

### Available Commands

```bash
npm run dev         # Start Vite dev server only
npm run tauri dev   # Start Tauri app in development mode
npm run build       # Build TypeScript and Vite bundle
npm run tauri build # Build production Tauri app
npm run preview     # Preview production build
```

## Project Structure

```
timeloop/
├── src/                       # Frontend source code
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── EntryModal.tsx     # Entry editing modal
│   │   └── Layout.tsx         # Main layout wrapper
│   ├── views/                 # Main application views
│   │   ├── TrackView.tsx      # Time tracking view
│   │   ├── CountView.tsx      # Time calculation view
│   │   ├── EntriesView.tsx    # Entries management view
│   │   └── CategoriesView.tsx # Categories management view
│   ├── i18n/                  # Internationalization
│   │   ├── locales/           # Translation files (en.json, fr.json)
│   │   └── index.ts           # i18n configuration
│   ├── lib/                   # Utilities and libraries
│   │   ├── database.ts        # Database operations
│   │   └── utils.ts           # Helper functions
│   ├── types/                 # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── src-tauri/                 # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs            # Tauri main entry point
│   │   └── lib.rs             # Library code
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
└── public/                    # Static assets
```

## Code Conventions

### TypeScript / React

- Use **TypeScript** for all new code
- Follow **functional components** with hooks
- Use **named exports** for components
- Keep components **small and focused**
- Use **PascalCase** for component names
- Use **camelCase** for functions and variables

**Example:**

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function CustomButton({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Styling

- Use **Tailwind CSS** for styling
- Follow **shadcn/ui** conventions for UI components
- Keep styles **consistent** with existing components
- Use **semantic class names**

### Rust

- Follow **standard Rust formatting** (use `cargo fmt`)
- Run **Clippy** before committing (`cargo clippy`)
- Add **comments** for complex logic
- Keep functions **small and focused**

### File Naming

- Components: `PascalCase.tsx` (e.g., `EntryModal.tsx`)
- Utilities: `camelCase.ts` (e.g., `database.ts`)
- Types: `camelCase.ts` or `index.ts`

## Git Workflow

### Branching Strategy

Create a new branch for each contribution:

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/your-bug-fix
git checkout -b docs/your-documentation-update
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `i18n/` - Translation updates

### Commit Messages

Use **conventional commits** format:

```
<type>: <description>

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `i18n`: Translation updates

**Examples:**

```bash
git commit -m "feat: add export to CSV functionality"
git commit -m "fix: correct time calculation in CountView"
git commit -m "docs: update README with new features"
git commit -m "i18n: add Spanish translation"
```

### Pull Requests

1. **Update your branch** with the latest changes from `main`
2. **Test your changes** thoroughly
3. **Create a pull request** with:
   - Clear title following commit conventions
   - Description of what changed and why
   - Screenshots (for UI changes)
   - Link to related issue (if applicable)

**PR Template:**

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Translation

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here
```

## Internationalization

Timeloop currently supports **English** and **French**. We welcome contributions for additional languages!

### Adding a New Translation

1. Create a new locale file in `src/i18n/locales/`

```bash
# Example: Spanish translation
src/i18n/locales/es.json
```

2. Copy the structure from `en.json` and translate all keys

3. Register the new language in `src/i18n/index.ts`

```typescript
import es from './locales/es.json';

// Add to resources
resources: {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es }, // Add this line
}
```

### Translation Guidelines

- Keep translations **concise** and **clear**
- Maintain the **same tone** as English version
- Use **proper capitalization** for your language
- Test the UI with your translation to ensure text fits properly


## Testing

Currently, Timeloop doesn't have automated tests. End of the joke.

### Manual Testing Checklist

Before submitting a PR, please test:

- [ ] Application starts without errors
- [ ] All views are accessible and functional
- [ ] Time entry creation and editing works
- [ ] Time calculations are correct
- [ ] Categories can be created and assigned
- [ ] Date filtering
- [ ] UI
- [ ] Console errors


## Building

For now, I've only tested it on ARM Macs, but with Tauri, we can build the app for all platforms.

### Development Build

```bash
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

### Build Troubleshooting

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Cargo cache: `cd src-tauri && cargo clean`
- Update dependencies: `npm update`


## Questions?

- 🐛 **Bug reports**: Open a [GitHub Issue](https://github.com/maxpertici/timeloop/issues) with the "bug" label
- 💡 **Feature requests**: Open a [GitHub Issue](https://github.com/maxpertici/timeloop/issues) with the "enhancement" label

---

**Thank you for contributing to Timeloop!** 🙏

Your contributions help make time tracking simpler and more efficient for everyone.

