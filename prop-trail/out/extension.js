"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const babylon = require("babylon");
const babel_traverse_1 = require("babel-traverse");
const t = require("babel-types");
class GoDocumentHighlightProvider {
    provideDocumentHighlights(document, position, token) {
        console.log('living for wahat');
        return [];
    }
}
function activate(context) {
    let disposable = vscode_1.commands.registerCommand('extension.propTrail', () => {
        vscode_1.window.showInformationMessage('Hello World!');
    });
    const highlightProvider = vscode_1.languages.registerDocumentHighlightProvider({ scheme: 'file', language: 'javascriptreact' }, new GoDocumentHighlightProvider());
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
                        const attribute = attributeInElement(path.node, hoverName);
                        if (attribute) {
                            jumpToComponentDefinition(component, target, hoverName);
                        }
                    }
                }
            });
            return { contents: ['Testing information'] };
        }
    });
    context.subscriptions.push(disposable); //, highlightProvider);
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
    return babylon.parse(text, {
        sourceType: "module", plugins: [
            'jsx',
            'flow',
            'classConstructorCall',
            'doExpressions',
            'objectRestSpread',
            'decorators',
            'classProperties',
            'exportExtensions',
            'asyncGenerators'
        ]
    });
};
const highlightObjectOccurrences = (document, highlightObject, uri) => {
    if (highlightObject) {
        const { line: startLine, column: startColumn } = highlightObject.loc.start;
        const { line: endLine, column: endColumn } = highlightObject.loc.end;
        const startPosition = new vscode_1.Position(startLine - 1, startColumn);
        const endPosition = new vscode_1.Position(endLine - 1, endColumn);
        vscode_1.commands.executeCommand('vscode.executeDocumentHighlights', uri, startPosition).then(highlights => {
            console.log('position', highlights);
            const range = new vscode_1.Range(startPosition, endPosition);
            const options = { preserveFocus: true, preview: true, selection: range, viewColumn: -2 };
            vscode_1.window.showTextDocument(document, options).then(editor => {
            });
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
                let highlightObject;
                babel_traverse_1.default(ast, {
                    enter(path) {
                        if (t.isIdentifier(path.node) && path.node.name === hoverName) {
                            highlightObject = path.node;
                        }
                    }
                });
                highlightObjectOccurrences(document, highlightObject, uri);
            });
        }
    });
};
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map