"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferenceProvider {
    constructor(references) {
        this.references = references;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        console.log('----');
        console.log(element);
        return element;
    }
    getChildren(element) {
        // const references: Reference[] = this.references.map((reference: DocumentHighlight) => {
        //   const textLine = this.document.lineAt((reference.range.start.line))
        //   const { text } = textLine;
        //   const { range } = reference;
        //   const commandArgument: any = { document: this.document, range };
        //   const command: Command = { title: 'Jump to Reference', command: 'propTrail.jumpToReference', arguments: [commandArgument] }
        //   return new Reference(text, this.document.uri, this.document, range, command);
        // });
        // return Promise.resolve(references);
        return Promise.resolve([]);
    }
    getParent(element) {
        return element;
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