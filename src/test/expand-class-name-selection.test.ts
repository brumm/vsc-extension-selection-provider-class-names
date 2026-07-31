import * as assert from "assert";
import {
  findClassNameRange,
  findClassNameRanges,
} from "../expand-class-name-selection";

interface SourceAtCursor {
  readonly text: string;
  readonly cursor: number;
}

function parseCursor(sourceWithCursor: string): SourceAtCursor {
  const cursor = sourceWithCursor.indexOf("|");
  assert.notStrictEqual(cursor, -1, "Test input must contain a cursor");

  return {
    text:
      sourceWithCursor.slice(0, cursor) + sourceWithCursor.slice(cursor + 1),
    cursor,
  };
}

function selectedText(
  sourceWithCursor: string,
  classFunctions?: readonly string[],
): string | undefined {
  const { text, cursor } = parseCursor(sourceWithCursor);
  const range = findClassNameRange(text, cursor, classFunctions);

  return range ? text.slice(range.start, range.end) : undefined;
}

function selectedTexts(sourceWithCursor: string): string[] | undefined {
  const { text, cursor } = parseCursor(sourceWithCursor);
  const ranges = findClassNameRanges(text, cursor);

  return ranges?.map((range) => text.slice(range.start, range.end));
}

suite("Class name detection", () => {
  test("selects a complete className token", () => {
    assert.strictEqual(
      selectedText('<div className="text-icon-prima|ry size-4" />'),
      "text-icon-primary",
    );
  });

  test("supports HTML class attributes", () => {
    assert.strictEqual(
      selectedText('<div class="block md:|hidden"></div>'),
      "md:hidden",
    );
  });

  test("supports single quotes and JSX braces", () => {
    assert.strictEqual(
      selectedText("<div className={ 'px-2 |py-4' } />"),
      "py-4",
    );
  });

  test("supports multiline class lists", () => {
    assert.strictEqual(
      selectedText('<div className="\n  px-2\n  |py-4\n" />'),
      "py-4",
    );
  });

  test("does not select whitespace", () => {
    assert.strictEqual(
      selectedText('<div className="px-2| py-4" />'),
      undefined,
    );
  });

  test("ignores unrelated strings", () => {
    assert.strictEqual(
      selectedText('const value = "text-icon-prima|ry size-4";'),
      undefined,
    );
  });

  test("supports cn function arguments", () => {
    assert.strictEqual(
      selectedText('<div className={cn("text-icon-prima|ry size-4")} />'),
      "text-icon-primary",
    );
  });

  test("supports nested clsx and cva values", () => {
    assert.strictEqual(
      selectedText('cva(clsx({ "px-2 |py-4": enabled }))'),
      "py-4",
    );
  });

  test("supports strings inside nested calls", () => {
    assert.strictEqual(selectedText('cn(getValue("px-2 |py-4"))'), "py-4");
  });

  test("ignores unconfigured functions", () => {
    assert.strictEqual(selectedText('getValue("px-2 |py-4")'), undefined);
  });

  test("supports configured functions", () => {
    assert.strictEqual(
      selectedText('styles("px-2 |py-4")', ["styles"]),
      "py-4",
    );
  });
});

suite("Tailwind selection ranges", () => {
  test("selects square-bracket content before the class name", () => {
    assert.deepStrictEqual(
      selectedTexts('<div className="text-icon-primary h-[16|px] w-[16px]" />'),
      ["16px", "h-[16px]"],
    );
  });

  test("selects parenthesized variables before the class name", () => {
    assert.deepStrictEqual(
      selectedTexts('<div className="flex gap-(--space|-xs) flex-col" />'),
      ["--space-xs", "gap-(--space-xs)"],
    );
  });

  test("supports nested arbitrary-value delimiters", () => {
    assert.deepStrictEqual(
      selectedTexts('<div className="w-[calc(100%|-1rem)]" />'),
      ["100%-1rem", "calc(100%-1rem)", "w-[calc(100%-1rem)]"],
    );
  });

  test("selects a variant value before the complete class name", () => {
    assert.deepStrictEqual(
      selectedTexts('<div className="hover:bg-gra|y-50" />'),
      ["bg-gray-50", "hover:bg-gray-50"],
    );
  });

  test("selects nested variant suffixes from right to left", () => {
    assert.deepStrictEqual(
      selectedTexts('<div className="dark:hover:bg-gra|y-50" />'),
      ["bg-gray-50", "hover:bg-gray-50", "dark:hover:bg-gray-50"],
    );
  });

  test("ignores colons inside arbitrary values", () => {
    assert.deepStrictEqual(
      selectedTexts("<div className=\"hover:content-['a:|b']\" />"),
      ["'a:b'", "content-['a:b']", "hover:content-['a:b']"],
    );
  });
});
