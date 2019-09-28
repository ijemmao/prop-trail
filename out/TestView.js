"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TestView {
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
exports.TestView = TestView;
const tree = {
    'a': {
        'aa': {
            'aaa': {
                'aaaa': {
                    'aaaaa': {
                        'aaaaaa': {}
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
let nodes = {};
function aNodeWithIdTreeDataProvider() {
    return {
        getChildren: (element) => {
            return getChildren(element ? element.key : undefined).map(key => getNode(key));
        },
        getTreeItem: (element) => {
            const treeItem = getTreeItem(element.key);
            treeItem.id = element.key;
            return treeItem;
        },
        getParent: ({ key }) => {
            const parentKey = key.substring(0, key.length - 1);
            return parentKey ? new Key(parentKey) : void 0;
        }
    };
}
exports.aNodeWithIdTreeDataProvider = aNodeWithIdTreeDataProvider;
function getChildren(key) {
    if (!key) {
        return Object.keys(tree);
    }
    let treeElement = getTreeElement(key);
    if (treeElement) {
        return Object.keys(treeElement);
    }
    return [];
}
function getTreeItem(key) {
    const treeElement = getTreeElement(key);
    return {
        label: { label: key, highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0 },
        tooltip: `Tooltip for ${key}`,
        collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    };
}
function getTreeElement(element) {
    let parent = tree;
    for (let i = 0; i < element.length; i++) {
        parent = parent[element.substring(0, i + 1)];
        if (!parent) {
            return null;
        }
    }
    return parent;
}
function getNode(key) {
    if (!nodes[key]) {
        nodes[key] = new Key(key);
    }
    return nodes[key];
}
class Key {
    constructor(key) {
        this.key = key;
    }
}
//# sourceMappingURL=TestView.js.map