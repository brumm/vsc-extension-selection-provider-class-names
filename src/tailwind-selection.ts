import type { OffsetRange } from "./class-name";

interface ClassNameContext {
  readonly className: string;
  readonly cursor: number;
}

type RangeFinder = (context: ClassNameContext) => OffsetRange[];

const rangeFinders: readonly RangeFinder[] = [
  findDelimitedValueRanges,
  findVariantRanges,
];

/** Find Tailwind-specific ranges inside one class name. */
export function findTailwindSelectionRanges(
  context: ClassNameContext,
): OffsetRange[] {
  return rangeFinders.flatMap((findRanges) => findRanges(context));
}

function findDelimitedValueRanges(context: ClassNameContext): OffsetRange[] {
  const openings: { character: "[" | "("; offset: number }[] = [];
  const ranges: OffsetRange[] = [];

  for (let index = 0; index < context.className.length; index++) {
    const character = context.className[index];

    if (character === "[" || character === "(") {
      openings.push({ character, offset: index });
      continue;
    }

    if (character !== "]" && character !== ")") {
      continue;
    }

    const opening = openings.at(-1);
    const expectedOpening = character === "]" ? "[" : "(";

    if (!opening || opening.character !== expectedOpening) {
      continue;
    }

    openings.pop();

    if (opening.offset < context.cursor && context.cursor <= index) {
      ranges.push({
        start: opening.offset + 1,
        end: index,
      });
    }
  }

  return ranges;
}

function findVariantRanges(context: ClassNameContext): OffsetRange[] {
  const ranges: OffsetRange[] = [];
  let squareBracketDepth = 0;
  let parenthesisDepth = 0;

  for (let index = 0; index < context.className.length; index++) {
    switch (context.className[index]) {
      case "[":
        squareBracketDepth++;
        break;
      case "]":
        squareBracketDepth = Math.max(0, squareBracketDepth - 1);
        break;
      case "(":
        parenthesisDepth++;
        break;
      case ")":
        parenthesisDepth = Math.max(0, parenthesisDepth - 1);
        break;
      case ":":
        if (
          squareBracketDepth === 0 &&
          parenthesisDepth === 0 &&
          index < context.cursor
        ) {
          ranges.push({
            start: index + 1,
            end: context.className.length,
          });
        }
        break;
    }
  }

  return ranges;
}
