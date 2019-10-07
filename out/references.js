"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferenceProvider {
    constructor(references, document) {
        this.references = references;
        this.document = document;
        this.nodes = {};
    }
    // Creates a unique for each found reference
    generateKey(wordRange) {
        if (!wordRange)
            return undefined;
        const { start: { line: startLine, character: startCharacter }, end: { line: endLine, character: endCharacter } } = wordRange;
        return `${startLine}-${startCharacter}-${endLine}-${endCharacter}`;
    }
    getTreeItem(element) {
        const treeItem = this.getTreeObject(element);
        return treeItem;
    }
    getTreeObject(element) {
        const { key, command } = element;
        const treeElement = this.getTreeElement(key);
        const realKey = this.generateKey(element.wordRange);
        return {
            label: key,
            key: realKey || element.key,
            resourceUri: this.document.uri,
            collapsibleState: treeElement && Object.keys(treeElement).length ? vscode_1.TreeItemCollapsibleState.Expanded : vscode_1.TreeItemCollapsibleState.None,
            command,
        };
    }
    getTreeElement(key) {
        let parent = this.references;
        // TODO: No tree item with id '1//Users/ionwuzulike/...'
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
        return parentKey ? new Reference(parentKey) : void 0;
    }
    getNode(key, element = undefined) {
        if (!this.nodes[key]) {
            if (element) {
                const reference = this.references[element.key][parseInt(key)];
                const { document, range } = reference;
                const textLine = this.document.lineAt((range.start.line));
                const { text } = textLine;
                const commandArgument = { document, range };
                const command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] };
                this.nodes[key] = new Reference(text, document.uri, element.key, range, command);
            }
            else {
                this.nodes[key] = new Reference(key);
            }
        }
        return this.nodes[key];
    }
}
exports.ReferenceProvider = ReferenceProvider;
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