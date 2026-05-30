<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.

<!--VITE PLUS END-->

---

<!--COMPONENT GUIDELINES START-->

# Component Guidelines

This project follows the [components.build](https://www.components.build) specification for building UI components. These are the rules agents must follow when creating or modifying any component.

## What Kind of Thing Are You Building?

Before writing any code, identify what you're creating:

| Type          | When to use it                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Component** | A styled, reusable UI unit — the default for most things you build                                    |
| **Block**     | A larger, opinionated composition for a specific page use case (e.g. a hero section, a settings form) |
| **Utility**   | A non-visual helper — hooks, class utilities, focus helpers                                           |

Pages and layouts are assembled from components and blocks. Don't mix concerns — a component should not contain page-level logic.

---

## Composition

**Break components into focused sub-components.** Don't build a single component that handles rendering, state, and layout all at once. Use React Context to share state across sub-components.

**Standard naming conventions:**

- `Root` — the outer container; owns and provides shared state via context
- `Trigger` — the element that opens, closes, or toggles something
- `Content` — the area revealed or controlled by the trigger
- `Header` / `Body` / `Footer` — structural layout regions
- `Title` / `Description` — informational text elements
- `Item` — a single entry in a list or collection

```tsx
// Good — each layer has one job
<Accordion.Root open={open} onOpenChange={setOpen}>
  <Accordion.Item>
    <Accordion.Trigger>FAQ Title</Accordion.Trigger>
    <Accordion.Content>Answer goes here</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>

// Bad — one component doing too much
<Accordion data={items} openClassName="..." closedClassName="..." />
```

---

## Types

- Every exported component wraps a **single HTML element**
- Extend native HTML attributes using `React.ComponentProps<'element'>`
- Always **spread props** to the underlying element — users must be able to pass any valid HTML attribute
- Spread props **before** any hardcoded attributes so defaults can be overridden
- Export prop types as `<ComponentName>Props`
- Document custom props with JSDoc comments

```tsx
export type CardProps = React.ComponentProps<"div"> & {
  /** Visual emphasis level */
  variant?: "default" | "outlined";
};

export const Card = ({ variant = "default", className, ...props }: CardProps) => (
  <div
    data-slot="card"
    data-variant={variant}
    className={cn("rounded-lg border p-4", className)}
    {...props}
  />
);
```

> Don't use prop names that conflict with native HTML attributes (e.g. avoid naming a prop `title` or `style` unless you're intentionally replacing them).

---

## Styling

Use **Tailwind CSS** with the `cn()` utility (clsx + tailwind-merge) for all class composition. `cn()` resolves Tailwind conflicts intelligently and handles conditional classes cleanly.

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Always apply classes in this order:**

1. Base styles (always applied)
2. Variant styles
3. Conditional/state styles
4. `className` prop from the consumer (comes last — always wins)

```tsx
className={cn(
  'base-styles',
  variantStyles[variant],
  isActive && 'ring-2 ring-primary',
  className,
)}
```

For components with multiple variants, use **CVA (Class Variance Authority)**:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-9 px-4",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

**Never** hard-code color values or override styles with global CSS when `cn()` and design tokens can handle it.

---

## Design Tokens

Use CSS variables with semantic names — separate what a value _is_ from what it _looks like_. This makes theming (including dark mode) trivially easy.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
```

Wire them into Tailwind:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}
```

Use `bg-background`, `text-foreground`, `bg-primary` etc. in your components — never raw hex or `oklch()` values directly in classNames.

---

## State (Controlled vs Uncontrolled)

Components that manage a value (open/closed, selected, input value) should support **both** controlled and uncontrolled usage where it makes sense.

- **Uncontrolled** — component owns its state with `useState` and an optional `defaultValue`
- **Controlled** — parent drives state via a `value` prop and an `onValueChange` callback

Use `@radix-ui/react-use-controllable-state` to merge both cleanly:

```tsx
import { useControllableState } from "@radix-ui/react-use-controllable-state";

const [value, setValue] = useControllableState({
  prop: controlledValue, // from props — drives controlled mode
  defaultProp: defaultValue, // from props — seeds uncontrolled mode
  onChange: onValueChange, // fires on any change in either mode
});
```

---

## Data Attributes

Use data attributes to expose component state and identity without adding more props.

### `data-state` — for visual states

Use it for anything a consumer might want to style based on component state:

```tsx
<Collapsible data-state={isOpen ? "open" : "closed"} />
```

Consumers can style it with Tailwind arbitrary variants:

```tsx
className = "data-[state=open]:animate-in data-[state=closed]:animate-out";
```

Common patterns: `open/closed`, `active/inactive`, `loading`, `disabled`, `checked`, `horizontal/vertical`.

### `data-slot` — for component identity

Use it to give sub-components a stable identifier that parent components can target without relying on class names or element types:

```tsx
// Each sub-component declares what it is
<CardHeader data-slot="card-header" />
<CardTitle data-slot="card-title" />
<CardFooter data-slot="card-footer" />

// Parent can target them reliably
<Card className="[&_[data-slot=card-footer]]:border-t" />
```

**Naming:** kebab-case, specific, purpose-based — `data-slot="submit-button"` not `data-slot="button"` or `data-slot="blueBtn"`.

### When to use which

| Situation                                     | Use          |
| --------------------------------------------- | ------------ |
| Open/closed, loading, disabled, active        | `data-state` |
| Identifying a component for parent styling    | `data-slot`  |
| Visual variants (primary, destructive, sm/lg) | `props`      |
| Event handling, config, controlled values     | `props`      |

---

## Polymorphism

When a component needs to render as a different HTML element, use the `asChild` pattern (via `@radix-ui/react-slot`) rather than an `as` prop. It handles prop merging, ref forwarding, and event handler composition automatically.

```tsx
import { Slot } from "@radix-ui/react-slot";

type ButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
};

export const Button = ({ asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" {...props} />;
};

// Usage — renders a single <a> element with Button's styles and behavior
<Button asChild>
  <a href="/home">Go Home</a>
</Button>;
```

**`asChild` rules:**

- The child component must spread `...props` to its root element
- Pass exactly **one** child element — no fragments, no arrays

---

## Accessibility

Accessibility is non-negotiable. Every component must be usable by keyboard and assistive technology.

**The baseline rules:**

1. **Semantic HTML first.** Use `<button>` for buttons, `<nav>` for navigation, `<ul>/<li>` for lists. Don't reach for ARIA when native HTML already handles it.

2. **Keyboard navigation.** Every interactive component must define and implement a keyboard map:
   - `Arrow keys` — move focus between items (menus, tabs, sliders)
   - `Enter` / `Space` — activate
   - `Escape` — close or cancel
   - `Home` / `End` — jump to first/last item

3. **ARIA — only when needed.** Five rules:
   - Don't use ARIA if semantic HTML works
   - Don't change native semantics unless necessary
   - All interactive elements must be keyboard accessible
   - Don't hide focusable elements from assistive tech
   - All interactive elements must have an accessible name

4. **Focus management.** Modals trap focus inside, restore focus to the trigger on close. Show `:focus-visible` outlines, never suppress them entirely.

5. **Color contrast.** Normal text needs 4.5:1 ratio, large text needs 3:1. Never convey meaning through color alone — pair it with an icon or text label.

6. **Touch targets.** Minimum 44×44px for any interactive element.

7. **Live regions.** Use `aria-live="polite"` for status messages and `role="alert"` for errors.

**Common mistakes to avoid:**

```tsx
// ❌ No accessible name on icon button
<button onClick={handleDelete}><TrashIcon /></button>

// ✅ aria-label gives screen readers something to announce
<button onClick={handleDelete} aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>

// ❌ Placeholder as the only label — disappears on input
<input placeholder="Email address" />

// ✅ Persistent visible label
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// ❌ disabled hides reason and removes focusability
<button disabled={!isValid}>Submit</button>

// ✅ aria-disabled keeps it focusable and lets you explain why
<button
  aria-disabled={!isValid}
  aria-describedby="submit-hint"
  onClick={isValid ? handleSubmit : undefined}
>
  Submit
</button>
<span id="submit-hint">{!isValid && 'Fill in all required fields first'}</span>
```

---

## Component Checklist

Before marking a component done, verify:

- [ ] Wraps a single HTML element per exported component
- [ ] Extends native HTML attributes via `React.ComponentProps<'element'>`
- [ ] Spreads `...props` to the root element
- [ ] Exports a named `<ComponentName>Props` type
- [ ] Uses `cn()` for all className composition — no bare string concatenation
- [ ] Accepts and passes through a `className` prop (consumer overrides always win)
- [ ] Uses design tokens (`bg-primary`, `text-foreground`) — no hardcoded colors
- [ ] Has `data-slot` on every named sub-component
- [ ] Exposes dynamic state via `data-state`
- [ ] Interactive — keyboard navigable and has accessible names
- [ ] No `<div onClick>` — uses semantic elements

<!--COMPONENT GUIDELINES END-->
