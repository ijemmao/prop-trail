"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const references_1 = require("./references");
class TestView {
    constructor(references, document) {
        const view = vscode.window.createTreeView('propTrailReferences', { treeDataProvider: new references_1.ReferenceProvider(references, document), showCollapseAll: true });
    }
}
exports.TestView = TestView;
//# sourceMappingURL=TestView.js.map