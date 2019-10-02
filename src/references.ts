import {
  Command,
  TreeDataProvider,
  TreeItem,
  TextDocument,
  Uri,
  Range,
  TreeItemCollapsibleState
} from 'vscode';

export class ReferenceProvider implements TreeDataProvider<{ key: string }> {

  public nodes: any = {};

  constructor(private references: any, private document: any) {
  }

  // Creates a unique for each found reference
  generateKey(wordRange: any): string | undefined {
    if (!wordRange) return undefined;
    const {
      start: {
        line: startLine,
        character: startCharacter
      },
      end: {
        line: endLine,
        character: endCharacter
      }} = wordRange;

    return `${startLine}-${startCharacter}-${endLine}-${endCharacter}`
  }

  getTreeItem(element: any): TreeItem {
    const treeItem = this.getTreeObject(element);
    console.log('-------')
    const key = this.generateKey(element.wordRange);
    console.log(element)
    treeItem.id = key || element.key;
    return treeItem;
  }

  getTreeObject(element: any) {
    const { key, command } = element;
    const treeElement = this.getTreeElement(key);

    return {
      label: key,
      id: '',
      resourceUri: this.document.uri,
      collapsibleState: treeElement && Object.keys(treeElement).length ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      command,
    };
  }

  getTreeElement(key: string): any {
    let parent = this.references;
    // TODO: No tree item with id '1//Users/ionwuzulike/...'
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
    return parentKey ? new Reference(parentKey) : void 0;
  }

  getNode(key: string, element: any = undefined): { key: string } {
    if (!this.nodes[key]) {
      if (element) {
        const reference = this.references[element.key][parseInt(key)];
        const { document, range } = reference;
        const textLine = this.document.lineAt((range.start.line))
        const { text } = textLine;

        const commandArgument: any = { document, range };
        const command: Command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }

        this.nodes[key] = new Reference(text, document.uri, element.key, range, command);
      } else {
        this.nodes[key] = new Reference(key);
      }
    }
    return this.nodes[key];
  }
}

class Reference extends TreeItem {
  constructor(
    public readonly key: string,
    public readonly resourceUri?: Uri,
    public readonly document?: TextDocument,
    public readonly wordRange?: Range,
    public readonly command?: Command,
    public readonly contextValue: string = 'reference'
  ) {
    super(key);
  }

  // Remove whitespace from tooltips
  // tooltip = this.label.trim();
}