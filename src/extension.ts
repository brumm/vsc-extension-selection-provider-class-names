import * as vscode from 'vscode';

const supportedLanguages: vscode.DocumentSelector = '*';

const defaultClassFunctions = [
	'cn',
	'clsx',
	'cva',
	'classNames',
	'twMerge',
];

const classAttributeBeforeQuote =
	/(?:^|[^\w:-])(?:class|className)\s*=\s*(?:\{\s*)?$/;

interface OffsetRange {
	start: number;
	end: number;
}

/**
 * Find the whitespace-delimited class name at an offset.
 *
 * The function returns offsets so its parsing logic can be tested without a
 * running VS Code editor.
 */
export function findClassNameRange(
	text: string,
	offset: number,
	classFunctions: readonly string[] = defaultClassFunctions,
): OffsetRange | undefined {
	if (offset < 0 || offset > text.length) {
		return undefined;
	}

	for (let quoteOffset = offset - 1; quoteOffset >= 0; quoteOffset--) {
		const quote = text[quoteOffset];

		if (
			(quote !== '"' && quote !== '\'' && quote !== '`') ||
			isEscaped(text, quoteOffset) ||
			!(
				classAttributeBeforeQuote.test(text.slice(0, quoteOffset)) ||
				isInsideClassFunction(
					text,
					quoteOffset,
					classFunctions,
				)
			)
		) {
			continue;
		}

		const closingQuoteOffset = findClosingQuote(text, quoteOffset, quote);

		if (closingQuoteOffset < offset) {
			continue;
		}

		const characterOffset =
			offset === closingQuoteOffset ? offset - 1 : offset;

		if (
			characterOffset <= quoteOffset ||
			/\s/.test(text[characterOffset])
		) {
			return undefined;
		}

		let start = characterOffset;
		let end = characterOffset + 1;

		while (start > quoteOffset + 1 && !/\s/.test(text[start - 1])) {
			start--;
		}

		while (end < closingQuoteOffset && !/\s/.test(text[end])) {
			end++;
		}

		return { start, end };
	}

	return undefined;
}

/**
 * Find the local selection hierarchy for a class name.
 *
 * Delimited arbitrary values are returned before the complete class name.
 */
export function findClassNameRanges(
	text: string,
	offset: number,
	classFunctions: readonly string[] = defaultClassFunctions,
): OffsetRange[] | undefined {
	const classNameRange = findClassNameRange(
		text,
		offset,
		classFunctions,
	);

	if (!classNameRange) {
		return undefined;
	}

	const delimiterRanges = findContainingDelimiterRanges(
		text,
		offset,
		classNameRange,
	);
	const variantRanges = findContainingVariantRanges(
		text,
		offset,
		classNameRange,
	);

	return sortAndDeduplicateRanges(
		[...delimiterRanges, ...variantRanges, classNameRange],
	);
}

function findContainingVariantRanges(
	text: string,
	offset: number,
	classNameRange: OffsetRange,
): OffsetRange[] {
	const ranges: OffsetRange[] = [];
	let squareBracketDepth = 0;
	let parenthesisDepth = 0;

	for (
		let index = classNameRange.start;
		index < classNameRange.end;
		index++
	) {
		switch (text[index]) {
			case '[':
				squareBracketDepth++;
				break;
			case ']':
				squareBracketDepth = Math.max(0, squareBracketDepth - 1);
				break;
			case '(':
				parenthesisDepth++;
				break;
			case ')':
				parenthesisDepth = Math.max(0, parenthesisDepth - 1);
				break;
			case ':':
				if (
					squareBracketDepth === 0 &&
					parenthesisDepth === 0 &&
					index < offset
				) {
					ranges.push({
						start: index + 1,
						end: classNameRange.end,
					});
				}
				break;
		}
	}

	return ranges;
}

function sortAndDeduplicateRanges(ranges: OffsetRange[]): OffsetRange[] {
	const uniqueRanges = new Map<string, OffsetRange>();

	for (const range of ranges) {
		uniqueRanges.set(`${range.start}:${range.end}`, range);
	}

	return [...uniqueRanges.values()].sort(
		(left, right) =>
			(left.end - left.start) - (right.end - right.start),
	);
}

function findContainingDelimiterRanges(
	text: string,
	offset: number,
	classNameRange: OffsetRange,
): OffsetRange[] {
	const openings: { character: '[' | '('; offset: number }[] = [];
	const ranges: OffsetRange[] = [];

	for (
		let index = classNameRange.start;
		index < classNameRange.end;
		index++
	) {
		const character = text[index];

		if (character === '[' || character === '(') {
			openings.push({ character, offset: index });
			continue;
		}

		if (character !== ']' && character !== ')') {
			continue;
		}

		const opening = openings.at(-1);
		const expectedOpening = character === ']' ? '[' : '(';

		if (!opening || opening.character !== expectedOpening) {
			continue;
		}

		openings.pop();

		if (opening.offset < offset && offset <= index) {
			ranges.push({
				start: opening.offset + 1,
				end: index,
			});
		}
	}

	return ranges;
}

function isInsideClassFunction(
	text: string,
	offset: number,
	classFunctions: readonly string[],
): boolean {
	const openingParentheses = findUnclosedParentheses(text, offset);

	for (
		let index = openingParentheses.length - 1;
		index >= 0;
		index--
	) {
		const prefix = text.slice(0, openingParentheses[index]);
		const callee = prefix.match(
			/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*$/,
		)?.[1];

		if (callee && classFunctions.includes(callee)) {
			return true;
		}
	}

	return false;
}

function findUnclosedParentheses(
	text: string,
	endOffset: number,
): number[] {
	const openingParentheses: number[] = [];

	for (let index = 0; index < endOffset; index++) {
		const character = text[index];
		const nextCharacter = text[index + 1];

		if (
			character === '"' ||
			character === '\'' ||
			character === '`'
		) {
			index = skipQuotedText(text, index, character, endOffset);
			continue;
		}

		if (character === '/' && nextCharacter === '/') {
			const lineEnd = text.indexOf('\n', index + 2);
			index = lineEnd === -1 || lineEnd >= endOffset
				? endOffset
				: lineEnd;
			continue;
		}

		if (character === '/' && nextCharacter === '*') {
			const commentEnd = text.indexOf('*/', index + 2);
			index = commentEnd === -1 || commentEnd >= endOffset
				? endOffset
				: commentEnd + 1;
			continue;
		}

		if (character === '(') {
			openingParentheses.push(index);
		} else if (character === ')') {
			openingParentheses.pop();
		}
	}

	return openingParentheses;
}

function skipQuotedText(
	text: string,
	openingQuoteOffset: number,
	quote: string,
	endOffset: number,
): number {
	for (
		let index = openingQuoteOffset + 1;
		index < endOffset;
		index++
	) {
		if (text[index] === quote && !isEscaped(text, index)) {
			return index;
		}
	}

	return endOffset;
}

function isEscaped(text: string, offset: number): boolean {
	let backslashCount = 0;

	for (let index = offset - 1; index >= 0 && text[index] === '\\'; index--) {
		backslashCount++;
	}

	return backslashCount % 2 === 1;
}

function findClosingQuote(
	text: string,
	openingQuoteOffset: number,
	quote: string,
): number {
	for (
		let index = openingQuoteOffset + 1;
		index < text.length;
		index++
	) {
		if (text[index] === quote && !isEscaped(text, index)) {
			return index;
		}
	}

	return -1;
}

class ClassNameSelectionRangeProvider
	implements vscode.SelectionRangeProvider
{
	provideSelectionRanges(
		document: vscode.TextDocument,
		positions: readonly vscode.Position[],
	): vscode.SelectionRange[] {
		const text = document.getText();
		const classFunctions = vscode.workspace
			.getConfiguration('classNameSelection', document.uri)
			.get<readonly string[]>(
				'classFunctions',
				defaultClassFunctions,
			);

		return positions.map((position) => {
			const ranges = findClassNameRanges(
				text,
				document.offsetAt(position),
				classFunctions,
			);

			if (!ranges) {
				return new vscode.SelectionRange(
					new vscode.Range(position, position),
				);
			}

			let hierarchy: vscode.SelectionRange | undefined;

			for (let index = ranges.length - 1; index >= 0; index--) {
				const range = ranges[index];
				hierarchy = new vscode.SelectionRange(
					new vscode.Range(
						document.positionAt(range.start),
						document.positionAt(range.end),
					),
					hierarchy,
				);
			}

			return hierarchy!;
		});
	}
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.languages.registerSelectionRangeProvider(
			supportedLanguages,
			new ClassNameSelectionRangeProvider(),
		),
	);
}

export function deactivate(): void {}
