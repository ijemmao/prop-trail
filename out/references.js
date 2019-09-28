"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferenceProvider {
    constructor(references, document) {
        this.references = references;
        this.document = document;
        this.nodes = {};
    }
    getTreeItem(element) {
        const treeItem = this.getTreeObject(element.key);
        treeItem.id = element.key;
        return treeItem;
    }
    getTreeObject(key) {
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
            collapsibleState: treeElement && Object.keys(treeElement).length ? vscode_1.TreeItemCollapsibleState.Collapsed : vscode_1.TreeItemCollapsibleState.None
        };
    }
    getTreeElement(key) {
        let parent = this.references;
        parent = parent[key];
        return parent;
    }
    getChildren(element) {
        const elements = (() => {
            if (!element) {
                return Object.keys(this.references);
            }
            let treeElement = this.getTreeElement(element.key);
            if (treeElement) {
                return Object.keys(treeElement);
            }
            return [];
        })();
        return elements.map(key => {
            if (element) {
                return this.getNode(key, element);
            }
            return this.getNode(key);
        });
    }
    getParent({ key }) {
        const parentKey = key.substring(0, key.length - 1);
        return parentKey ? new Key(parentKey) : void 0;
    }
    getNode(key, element = undefined) {
        if (!this.nodes[key]) {
            if (element) {
                const reference = this.references[element.key][parseInt(key)];
                const textLine = this.document.lineAt((reference.range.start.line));
                const { text } = textLine;
                const { range } = reference;
                const commandArgument = { document: element.key, range };
                const command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] };
                // return new Reference(text, this.document.uri, element.key, range, command);
                console.log(text);
                this.nodes[key] = new Reference(text, this.document.uri, element.key, range, command);
            }
            else {
                this.nodes[key] = new Key(key);
            }
        }
        return this.nodes[key];
    }
}
exports.ReferenceProvider = ReferenceProvider;
class Key {
    constructor(key, command, label, resourceUri, document, wordRange, contextValue = 'reference') {
        this.key = key;
        this.command = command;
        this.label = label;
        this.resourceUri = resourceUri;
        this.document = document;
        this.wordRange = wordRange;
        this.contextValue = contextValue;
    }
}
class Reference extends vscode_1.TreeItem {
    constructor(key, resourceUri, document, wordRange, command, contextValue = 'reference') {
        super(key);
        this.key = key;
        this.resourceUri = resourceUri;
        this.document = document;
        this.wordRange = wordRange;
        this.command = command;
        this.contextValue = contextValue;
    }
}
//# sourceMappingURL=references.js.map