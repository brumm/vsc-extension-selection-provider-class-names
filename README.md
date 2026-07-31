# Class Name Selection Ranges

Adds whitespace-delimited class names to VS Code's existing Expand and Shrink
Selection hierarchy.

Given:

```tsx
<div className="text-icon-primary size-4" />
```

Expand Selection can now grow through:

```text
primary
→ text-icon-primary
→ text-icon-primary size-4
→ larger syntax ranges
```

The extension contributes selection ranges only. It does not add commands or
keybindings.

## Supported attributes

- `class`
- `className`

Double-quoted, single-quoted, and template-literal values are supported.

Tailwind arbitrary values and CSS-variable shorthand add their inner content
before the complete class name:

```text
16px → h-[16px] → complete class list
space → --space-xs → gap-(--space-xs) → complete class list
```

Tailwind variants expand from the utility toward the complete token:

```text
gray → bg-gray-50 → hover:bg-gray-50 → complete class list
```

## Class functions

Strings nested in these function calls are supported by default:

- `cn`
- `clsx`
- `cva`
- `classNames`
- `twMerge`

Add or replace function names with the `classNameSelection.classFunctions`
setting:

```json
{
  "classNameSelection.classFunctions": ["cn", "styles"]
}
```

## Supported language modes

All language modes are supported. The provider only contributes a range when
the cursor is in a quoted `class` or `className` value.
