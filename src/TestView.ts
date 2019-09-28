import * as vscode from 'vscode';

export class TestView {

  constructor() {
    const view = vscode.window.createTreeView('propTrailReferences', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
    // vscode.commands.registerCommand('propTrailReferences.reveal', async () => {
    //   const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
    //   if (key) {
    //     await view.reveal({ key }, { focus: true, select: false, expand: true });
    //   }
    // });
  }
}

const tree = {
  'a': {
    'aa': {
      'aaa': {
        'aaaa': {
          'aaaaa': {
            'aaaaaa': {

            }
          }
        }
      }
    },
    'ab': {}
  },
  'b': {
    'ba': {},
    'bb': {}
  }
};
let nodes: any = {};

export function aNodeWithIdTreeDataProvider(): vscode.TreeDataProvider<{ key: string }> {
  return {
    getChildren: (element: { key: string }): { key: string }[] => {
      return getChildren(element ? element.key : undefined).map(key => getNode(key));
    },
    getTreeItem: (element: { key: string }): vscode.TreeItem => {
      const treeItem = getTreeItem(element.key);
      treeItem.id = element.key;
      return treeItem;
    },
    getParent: ({ key }: { key: string }): Key | undefined => {
      const parentKey = key.substring(0, key.length - 1);
      return parentKey ? new Key(parentKey) : void 0;
    }
  };
}

function getChildren(key: string | undefined): string[] {
  if (!key) {
    return Object.keys(tree);
  }
  let treeElement = getTreeElement(key);
  if (treeElement) {
    return Object.keys(treeElement);
  }
  return [];
}

function getTreeItem(key: string): any {
  const treeElement = getTreeElement(key);
  return {
    label: { label: key, highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0 },
    tooltip: `Tooltip for ${key}`,
    collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  };
}

function getTreeElement(element: any): any {
  let parent: any = tree;
  for (let i = 0; i < element.length; i++) {
    parent = parent[element.substring(0, i + 1)];
    if (!parent) {
      return null;
    }
  }
  return parent;
}

function getNode(key: string): { key: string } {
  if (!nodes[key]) {
    nodes[key] = new Key(key);
  }
  return nodes[key];
}

class Key {
  constructor(readonly key: string) { }
}