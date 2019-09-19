"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const babylon_1 = require("babylon");
const babel_traverse_1 = require("babel-traverse");
const t = require("babel-types");
const references_1 = require("./references");
const PLUGINS = [
    'jsx',
    'flow',
    'classConstructorCall',
    'doExpressions',
    'objectRestSpread',
    'decorators',
    'classProperties',
    'exportExtensions',
    'asyncGenerators'
];
function activate(context) {
    let disposable = vscode_1.commands.registerCommand('extension.propTrail', () => {
        vscode_1.window.showInformationMessage('Hello World!');
    });
    const jumpToReference = vscode_1.commands.registerCommand('propTrail.jumpToReference', reference => {
        const { document, range } = reference;
        const options = { preserveFocus: true, preview: true, selection: range, viewColumn: 2 };
        vscode_1.window.showTextDocument(document, options).then(editor => { });
    });
    vscode_1.languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, {
        provideHover(document, position, token) {
            const ast = generateAst(document);
            babel_traverse_1.default(ast, {
                enter(path) {
                    const { uri: target } = document;
                    const range = document.getWordRangeAtPosition(position);
                    const hoverName = document.getText(range);
                    if (t.isJSXOpeningElement(path.node)) {
                        const component = path.node;
                        const { loc: { start: { line: componentStartLine } } } = path.node;
                        const attribute = attributeInElement(path.node, hoverName);
                        if (attribute && componentStartLine <= position.line) {
                            jumpToComponentDefinition(component, target, hoverName);
                        }
                    }
                }
            });
            return { contents: ['Prop Trail'] };
        }
    });
    context.subscriptions.push(disposable, jumpToReference);
}
exports.activate = activate;
const attributeInElement = (element, attribute) => {
    for (const currentAttribute of element.attributes) {
        if (currentAttribute.name && currentAttribute.name.name === attribute)
            return currentAttribute;
        else if (currentAttribute.argument && currentAttribute.argument.name === attribute)
            return currentAttribute;
    }
};
const generateAst = (document) => {
    const text = document.getText();
    return babylon_1.parse(text, { sourceType: "module", plugins: PLUGINS });
};
const highlightObjectOccurrences = (document, highlightObjects, uri) => {
    if (highlightObjects.length) {
        const highlightPromises = highlightObjects.map((highlightObject) => {
            const { line: startLine, column: startColumn } = highlightObject.loc.start;
            const { line: endLine, column: endColumn } = highlightObject.loc.end;
            const startPosition = new vscode_1.Position(startLine - 1, startColumn);
            const endPosition = new vscode_1.Position(endLine - 1, endColumn);
            return vscode_1.commands.executeCommand('vscode.executeDocumentHighlights', uri, startPosition).then(highlight => ({ highlight, meta: [highlightObject] }));
        });
        Promise.all(highlightPromises).then((highlights) => {
            highlights = highlights.map(({ highlight, meta }) => {
                if (highlight) {
                    return highlight;
                }
                return meta;
            });
            udpateTreeView(highlights, document);
        });
    }
};
const jumpToComponentDefinition = (component, target, hoverName) => {
    const { line, column } = component.loc.start;
    const componentPosition = new vscode_1.Position(line - 1, column + 3);
    vscode_1.commands.executeCommand('vscode.executeDefinitionProvider', target, componentPosition).then(references => {
        references = references || [];
        if (references) {
            const reference = references[0];
            const uri = vscode_1.Uri.file(reference.uri.path);
            vscode_1.workspace.openTextDocument(uri).then(document => {
                const ast = generateAst(document);
                let highlightObjects = [];
                babel_traverse_1.default(ast, {
                    enter(path) {
                        if (t.isIdentifier(path.node) && path.node.name === hoverName) {
                            // Each path.node has different highlight instances attached to it
                            highlightObjects.push(path.node);
                        }
                    }
                });
                highlightObjectOccurrences(document, highlightObjects, uri);
            });
        }
    });
};
const udpateTreeView = (references, document) => {
    vscode_1.window.createTreeView('propTrailReferences', { treeDataProvider: new references_1.ReferenceProvider(references, document), showCollapseAll: true });
};
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map