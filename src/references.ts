import {
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
} from 'vscode';

export class ReferenceProvider implements TreeDataProvider<Reference> {

  private _onDidChangeTreeData: EventEmitter<Reference | undefined> = new EventEmitter<Reference | undefined>();
  readonly onDidChangeTreeData: Event<Reference | undefined> = this._onDidChangeTreeData.event;

  constructor(private references: any) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Reference): TreeItem {
    console.log('----')
    console.log(element);
    return element;
  }

  getChildren(element: any): Thenable<Reference[]> {
    // const references: Reference[] = this.references.map((reference: DocumentHighlight) => {
    //   const textLine = this.document.lineAt((reference.range.start.line))
    //   const { text } = textLine;
    //   const { range } = reference;
    //   const commandArgument: any = { document: this.document, range };
    //   const command: Command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }
    //   return new Reference(text, this.document.uri, this.document, range, command);
    // });

    // return Promise.resolve(references);

    return Promise.resolve([]);
  }

  getParent(element?: any): Reference {
    return element;
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

  tooltip = this.label.trim();
}