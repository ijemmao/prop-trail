import {
  Command,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TextDocument,
  Uri,
  DocumentHighlight
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
      const references = this.references.map(reference => {
        const word = this.document.getText(reference.range);
        return new Reference(word);
      })
      return Promise.resolve(references);
    } else return Promise.resolve([]);
  }
}

class Reference extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly resourceUri?: Uri,
    public readonly command?: Command,
  ) {
    super(label);
  }

  contextValue = 'reference';
}