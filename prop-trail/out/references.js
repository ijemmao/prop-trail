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
            const references = this.references.map(reference => {
                const word = this.document.getText(reference.range);
                return new Reference(word);
            });
            return Promise.resolve(references);
        }
        else
            return Promise.resolve([]);
    }
}
exports.ReferenceProvider = ReferenceProvider;
class Reference extends vscode_1.TreeItem {
    constructor(label, resourceUri, command) {
        super(label);
        this.label = label;
        this.resourceUri = resourceUri;
        this.command = command;
        this.contextValue = 'reference';
    }
}
//# sourceMappingURL=references.js.map