import * as vscode from "vscode";
import {
  defaultClassFunctions,
  findClassNameRanges,
  type OffsetRange,
} from "./expand-class-name-selection";

const supportedLanguages: vscode.DocumentSelector = "*";

class ExpandClassNameSelectionRangeProvider
  implements vscode.SelectionRangeProvider {
  provideSelectionRanges(
    document: vscode.TextDocument,
    positions: readonly vscode.Position[],
  ): vscode.SelectionRange[] {
    const text = document.getText();
    const classFunctions = vscode.workspace
      .getConfiguration("expandClassNameSelection", document.uri)
      .get<readonly string[]>("classFunctions", defaultClassFunctions);

    return positions.map((position) => {
      const ranges = findClassNameRanges(
        text,
        document.offsetAt(position),
        classFunctions,
      );

      return ranges
        ? createSelectionRange(document, ranges)
        : emptySelectionRange(position);
    });
  }
}

function createSelectionRange(
  document: vscode.TextDocument,
  ranges: readonly OffsetRange[],
): vscode.SelectionRange {
  let selectionRange: vscode.SelectionRange | undefined;

  for (let index = ranges.length - 1; index >= 0; index--) {
    const range = ranges[index];
    selectionRange = new vscode.SelectionRange(
      new vscode.Range(
        document.positionAt(range.start),
        document.positionAt(range.end),
      ),
      selectionRange,
    );
  }

  return selectionRange!;
}

function emptySelectionRange(position: vscode.Position): vscode.SelectionRange {
  return new vscode.SelectionRange(new vscode.Range(position, position));
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerSelectionRangeProvider(
      supportedLanguages,
      new ExpandClassNameSelectionRangeProvider(),
    ),
  );
}

export function deactivate(): void {}
