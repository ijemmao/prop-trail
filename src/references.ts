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
  TreeItemCollapsibleState
} from 'vscode';

export class ReferenceProvider implements TreeDataProvider<{ key: string }> {

  public nodes: any = {};

  constructor(private references: any, private document: any) {
  }

  getTreeItem(element: { key: string }): TreeItem {
    const treeItem = this.getTreeObject(element.key);
    treeItem.id = element.key;
    return treeItem;
  }

  getTreeObject(key: string) {
    const treeElement = this.getTreeElement(key);


    // const textLine = this.document.lineAt((reference.range.start.line))
    // const { text } = textLine;
    // const { range } = reference;
    // const commandArgument: any = { document: this.document, range };
    // const command: Command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }
    // return new Reference(text, this.document.uri, this.document, range, command);

    return {
      label: key,
      id: '',
      collapsibleState: treeElement && Object.keys(treeElement).length ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
    };
  }

  getTreeElement(key: string): any {
    let parent = this.references;
    parent = parent[key];
    return parent;

  }

  getChildren(element: any): { key: string }[] {
    const elements = (() => {
      if (!element) {
        return Object.keys(this.references)
      }

      let treeElement = this.getTreeElement(element.key);
      if (treeElement) {
        return Object.keys(treeElement);
      }
      return [];
    })()
    
    return elements.map(key => {
      if (element) {
        return this.getNode(key, element);
      }
      return this.getNode(key)
    })

  }

  getParent({ key }: { key: string }): { key: string } | undefined {
    const parentKey = key.substring(0, key.length - 1);
    return parentKey ? new Key(parentKey) : void 0;
  }

  getNode(key: string, element: any = undefined): { key: string } {
    if (!this.nodes[key]) {
      if (element) {
        const reference = this.references[element.key][parseInt(key)];
        const textLine = this.document.lineAt((reference.range.start.line))
        const { text } = textLine;
        const { range } = reference;
        const commandArgument: any = { document: element.key, range };
        const command: Command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }
        // return new Reference(text, this.document.uri, element.key, range, command);
        console.log(text);
        this.nodes[key] = new Reference(text, this.document.uri, element.key, range, command);
      } else {
        this.nodes[key] = new Key(key);
      }
    }
    return this.nodes[key];
  }
}

class Key {
  constructor(
    public readonly key: string,
    public readonly command?: Command,
    public readonly label?: string,
    public readonly resourceUri?: Uri,
    public readonly document?: TextDocument,
    public readonly wordRange?: Range,
    public readonly contextValue: string = 'reference'
  ) { }
}

class Reference extends TreeItem {
  constructor(
    public readonly key: string,
    public readonly resourceUri: Uri,
    public readonly document: TextDocument,
    public readonly wordRange: Range,
    public readonly command?: Command,
    public readonly contextValue: string = 'reference'
  ) {
    super(key);
  }

  // tooltip = this.label.trim();
}