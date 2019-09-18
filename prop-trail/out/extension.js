"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const babylon = require("babylon");
const babel_traverse_1 = require("babel-traverse");
const t = require("babel-types");
let elements = [];
let attribute = null;
function activate(context) {
    let disposable = vscode_1.commands.registerCommand('extension.propTrail', () => {
        vscode_1.window.showInformationMessage('Hello World!');
    });
    vscode_1.languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, {
        provideHover(document, position, token) {
            let number = 0;
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
                    number += 1;
                    let grabbedName;
                    const { uri: target } = document;
                    const range = document.getWordRangeAtPosition(position);
                    const hoverName = document.getText(range);
                    if (t.isJSXOpeningElement(path.node)) {
                        if (typeof path.node.name !== 'string') {
                            (path.node.name.object)
                                ? grabbedName = path.node.name.object.name
                                : grabbedName = path.node.name.name;
                        }
                        else {
                            grabbedName = path.node.name;
                        }
                        // console.log(grabbedName, hoverName);
                        // Focusing on hovering component
                        if (grabbedName === hoverName) {
                            // Adding JSXElement to global array)
                            elements.push({ name: grabbedName, attributes: path.node.attributes });
                            console.log(path.node);
                            console.log('right here', number);
                            // commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', target, position).then(locations => {
                            //   const referenceRange = locations && locations[0];
                            //   console.log(referenceRange);
                            // })
                        }
                    }
                    else if (t.isJSXAttribute(path.node)) {
                        grabbedName = path.node.name.name;
                        // attribute = path.node;
                        // const element = attributeInElement(elements, attribute);
                        // console.log('what it do', element);
                        // if (grabbedName === hoverName && elements) {
                        //   console.log(path.node);
                        // }
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
const attributeInElement = (elements, attribute) => {
    let index = 0;
    let inElement = false;
    let element;
    while (inElement === false || index < elements.length) {
        const currentElement = elements[index];
        if (!inElement) {
            currentElement.attributes.forEach((currentAttribute) => {
                if (currentAttribute.name.name === attribute.name.name) {
                    inElement = true;
                    element = currentElement;
                }
            });
        }
        index += 1;
    }
    if (inElement)
        return element;
    return undefined;
};
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map