"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferenceProvider {
    constructor(references, document) {
        this.references = references;
        this.document = document;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.generateRange = (loc) => {
            const { line: startLine, column: startCharacter } = loc.start;
            const { line: endLine, column: endCharacter } = loc.start;
            return new vscode_1.Range(new vscode_1.Position(startLine - 1, startCharacter), new vscode_1.Position(endLine - 1, endCharacter));
        };
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
                const words = reference.map((ref) => {
                    const textLine = this.document.lineAt((ref.range && ref.range.start.line) || ref.loc.start.line - 1);
                    const text = textLine.text; //.trim();
                    return new Reference(text, this.document.uri, this.document, ref.range || this.generateRange(ref.loc));
                });
                return words;
            }).flat();
            return Promise.resolve(references);
        }
        else
            return Promise.resolve([]);
    }
}
exports.ReferenceProvider = ReferenceProvider;
class Reference extends vscode_1.TreeItem {
    constructor(label, resourceUri, document, wordRange, contextValue = 'reference', command) {
        super(label);
        this.label = label;
        this.resourceUri = resourceUri;
        this.document = document;
        this.wordRange = wordRange;
        this.contextValue = contextValue;
        this.command = command;
    }
}
//# sourceMappingURL=references.js.map