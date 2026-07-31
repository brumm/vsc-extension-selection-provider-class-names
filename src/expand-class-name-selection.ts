import {
  defaultClassFunctions,
  findClassNameRange,
  type OffsetRange,
} from "./class-name";
import { findTailwindSelectionRanges } from "./tailwind-selection";

export {
  defaultClassFunctions,
  findClassNameRange,
  type OffsetRange,
} from "./class-name";

/** Find the selection hierarchy for the class name at a cursor offset. */
export function findClassNameRanges(
  text: string,
  cursor: number,
  classFunctions: readonly string[] = defaultClassFunctions,
): OffsetRange[] | undefined {
  const classNameRange = findClassNameRange(text, cursor, classFunctions);

  if (!classNameRange) {
    return undefined;
  }

  const innerRanges = findTailwindSelectionRanges({
    className: text.slice(classNameRange.start, classNameRange.end),
    cursor: cursor - classNameRange.start,
  }).map((range) => ({
    start: classNameRange.start + range.start,
    end: classNameRange.start + range.end,
  }));

  return orderRanges([...innerRanges, classNameRange]);
}

function orderRanges(ranges: readonly OffsetRange[]): OffsetRange[] {
  const uniqueRanges = new Map<string, OffsetRange>();

  for (const range of ranges) {
    uniqueRanges.set(`${range.start}:${range.end}`, range);
  }

  return [...uniqueRanges.values()].sort(
    (left, right) => rangeLength(left) - rangeLength(right),
  );
}

function rangeLength(range: OffsetRange): number {
  return range.end - range.start;
}
