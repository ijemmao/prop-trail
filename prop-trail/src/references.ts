import {
  window,
  Command,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TextDocument,
  Uri,
  DocumentHighlight,
  Range,
  Position,
  TextDocumentShowOptions
} from 'vscode';

export class ReferenceProvider implements TreeDataProvider<Reference> {

  private _onDidChangeTreeData: EventEmitter<Reference | undefined> = new EventEmitter<Reference | undefined>();
  readonly onDidChangeTreeData: Event<Reference | undefined> = this._onDidChangeTreeData.event;

  constructor(private references: DocumentHighlight[], private document: TextDocument) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Reference): TreeItem {
    return element;
  }

  getChildren(element?: any): Thenable<Reference[]> {
    if (this.document && this.references) {
      const references = this.references.map((reference: any) => {
        const words = reference.map((ref: DocumentHighlight | any) => {
          const textLine = this.document.lineAt((ref.range && ref.range.start.line) || ref.loc.start.line - 1)
          const text = textLine.text//.trim();
          const range = ref.range || this.generateRange(ref.loc);
          const commandArgument: any = { document: this.document, range };
          const command: Command = { title: 'jump tp reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }
          return new Reference(text, this.document.uri, this.document, range, command);
        })
        return words;
      }).flat();
      
      return Promise.resolve(references);
    } else return Promise.resolve([]);
  }

  generateRange = (loc: any): Range => {
    const { line: startLine, column: startCharacter } = loc.start;
    const { line: endLine, column: endCharacter } = loc.start;
    return new Range(new Position(startLine - 1, startCharacter), new Position(endLine - 1, endCharacter));
  }
}

class Reference extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly resourceUri: Uri,
    public readonly document: TextDocument,
    public readonly wordRange: Range,
    public readonly command?: Command,
    public readonly contextValue: string = 'reference'
  ) {
    super(label);
  }
}