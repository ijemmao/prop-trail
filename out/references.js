"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferenceProvider {
    constructor(references, document) {
        this.references = references;
        this.document = document;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (this.document && this.references) {
            const references = this.references.map((reference) => {
                const textLine = this.document.lineAt((reference.range.start.line));
                const { text } = textLine;
                const { range } = reference;
                const commandArgument = { document: this.document, range };
                const command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] };
                return new Reference(text, this.document.uri, this.document, range, command);
            });
            return Promise.resolve(references);
        }
        else
            return Promise.resolve([]);
    }
}
exports.ReferenceProvider = ReferenceProvider;
class Reference extends vscode_1.TreeItem {
    constructor(label, resourceUri, document, wordRange, command, contextValue = 'reference') {
        super(label);
        this.label = label;
        this.resourceUri = resourceUri;
        this.document = document;
        this.wordRange = wordRange;
        this.command = command;
        this.contextValue = contextValue;
        this.tooltip = this.label.trim();
    }
}
//# sourceMappingURL=references.js.map