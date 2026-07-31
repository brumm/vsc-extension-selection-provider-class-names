export const defaultClassFunctions = [
  "cn",
  "clsx",
  "cva",
  "classNames",
  "twMerge",
] as const;

export interface OffsetRange {
  readonly start: number;
  readonly end: number;
}

type Quote = '"' | "'" | "`";

const classAttributeBeforeQuote =
  /(?:^|[^\w:-])(?:class|className)\s*=\s*(?:\{\s*)?$/;

const functionNameBeforeParenthesis =
  /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*$/;

/** Find the whitespace-delimited class name at a cursor offset. */
export function findClassNameRange(
  text: string,
  cursor: number,
  classFunctions: readonly string[] = defaultClassFunctions,
): OffsetRange | undefined {
  const classList = findContainingClassList(text, cursor, classFunctions);

  if (!classList) {
    return undefined;
  }

  const characterOffset = cursor === classList.end ? cursor - 1 : cursor;

  if (
    characterOffset < classList.start ||
    characterOffset >= classList.end ||
    isWhitespace(text[characterOffset])
  ) {
    return undefined;
  }

  let start = characterOffset;
  let end = characterOffset + 1;

  while (start > classList.start && !isWhitespace(text[start - 1])) {
    start--;
  }

  while (end < classList.end && !isWhitespace(text[end])) {
    end++;
  }

  return { start, end };
}

function findContainingClassList(
  text: string,
  cursor: number,
  classFunctions: readonly string[],
): OffsetRange | undefined {
  if (cursor < 0 || cursor > text.length) {
    return undefined;
  }

  for (
    let openingQuoteOffset = cursor - 1;
    openingQuoteOffset >= 0;
    openingQuoteOffset--
  ) {
    const quote = text[openingQuoteOffset];

    if (
      !isQuote(quote) ||
      isEscaped(text, openingQuoteOffset) ||
      !startsClassList(text, openingQuoteOffset, classFunctions)
    ) {
      continue;
    }

    const closingQuoteOffset = findClosingQuote(
      text,
      openingQuoteOffset,
      quote,
    );

    if (closingQuoteOffset >= cursor) {
      return {
        start: openingQuoteOffset + 1,
        end: closingQuoteOffset,
      };
    }
  }

  return undefined;
}

function startsClassList(
  text: string,
  quoteOffset: number,
  classFunctions: readonly string[],
): boolean {
  return (
    classAttributeBeforeQuote.test(text.slice(0, quoteOffset)) ||
    isInsideClassFunction(text, quoteOffset, classFunctions)
  );
}

function isInsideClassFunction(
  text: string,
  endOffset: number,
  classFunctions: readonly string[],
): boolean {
  const openingParentheses = findUnclosedParentheses(text, endOffset);

  return openingParentheses.some((openingParenthesis) => {
    const prefix = text.slice(0, openingParenthesis);
    const functionName = prefix.match(functionNameBeforeParenthesis)?.[1];

    return functionName !== undefined && classFunctions.includes(functionName);
  });
}

function findUnclosedParentheses(text: string, endOffset: number): number[] {
  const openingParentheses: number[] = [];

  for (let index = 0; index < endOffset; index++) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (isQuote(character)) {
      index = skipQuotedText(text, index, character, endOffset);
      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      index = findLineCommentEnd(text, index, endOffset);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = findBlockCommentEnd(text, index, endOffset);
      continue;
    }

    if (character === "(") {
      openingParentheses.push(index);
    } else if (character === ")") {
      openingParentheses.pop();
    }
  }

  return openingParentheses;
}

function findLineCommentEnd(
  text: string,
  commentOffset: number,
  endOffset: number,
): number {
  const lineEnd = text.indexOf("\n", commentOffset + 2);

  return lineEnd === -1 || lineEnd >= endOffset ? endOffset : lineEnd;
}

function findBlockCommentEnd(
  text: string,
  commentOffset: number,
  endOffset: number,
): number {
  const commentEnd = text.indexOf("*/", commentOffset + 2);

  return commentEnd === -1 || commentEnd >= endOffset
    ? endOffset
    : commentEnd + 1;
}

function skipQuotedText(
  text: string,
  openingQuoteOffset: number,
  quote: Quote,
  endOffset: number,
): number {
  for (let index = openingQuoteOffset + 1; index < endOffset; index++) {
    if (text[index] === quote && !isEscaped(text, index)) {
      return index;
    }
  }

  return endOffset;
}

function findClosingQuote(
  text: string,
  openingQuoteOffset: number,
  quote: Quote,
): number {
  for (let index = openingQuoteOffset + 1; index < text.length; index++) {
    if (text[index] === quote && !isEscaped(text, index)) {
      return index;
    }
  }

  return -1;
}

function isQuote(character: string): character is Quote {
  return character === '"' || character === "'" || character === "`";
}

function isEscaped(text: string, offset: number): boolean {
  let backslashCount = 0;

  for (let index = offset - 1; index >= 0 && text[index] === "\\"; index--) {
    backslashCount++;
  }

  return backslashCount % 2 === 1;
}

function isWhitespace(character: string): boolean {
  return /\s/.test(character);
}
