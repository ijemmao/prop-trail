"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode = require("vscode");
const babylon = require("babylon");
const babel_traverse_1 = require("babel-traverse");
const t = require("babel-types");
function activate(context) {
    let disposable = vscode_1.commands.registerCommand('extension.propTrail', () => {
        vscode_1.window.showInformationMessage('Hello World!');
    });
    vscode_1.languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, {
        provideHover(document, position, token) {
            const text = document.getText();
            const ast = babylon.parse(text, {
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
            babel_traverse_1.default(ast, {
                enter(path) {
                    const { uri: target } = document;
                    const range = document.getWordRangeAtPosition(position);
                    const hoverName = document.getText(range);
                    if (t.isJSXOpeningElement(path.node)) {
                        console.log('okokokok', path.node);
                        const component = path.node;
                        const attribute = attributeInElement(path.node, hoverName);
                        console.log(component);
                        if (attribute) {
                            jumpToComponentDefinition(component, target);
                        }
                    }
                }
            });
            return {
                contents: ['Testing information']
            };
        }
    });
    context.subscriptions.push(disposable);
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
const jumpToComponentDefinition = (component, target) => {
    const componentPosition = new vscode.Position(component.loc.start.line - 1, component.loc.start.column + 3);
    vscode.commands.executeCommand('vscode.executeDefinitionProvider', target, componentPosition).then(references => {
        references = references || [];
        if (references) {
            const reference = references[0];
            const uri = vscode.Uri.file(reference.uri.path);
            console.log(reference);
            vscode.workspace.openTextDocument(uri).then(document => {
                vscode.window.showTextDocument(document, -2, true).then(editor => {
                });
            });
        }
    });
};
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map