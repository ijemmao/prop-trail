"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_traverse_1 = require("babel-traverse");
const references_1 = require("./references");
const vscode_1 = require("vscode");
const babylon_1 = require("babylon");
const babel_types_1 = require("babel-types");
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
let numOfRefs = 0;
function activate(context) {
    let disposable = vscode_1.commands.registerCommand('extension.propTrail', (args) => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            const { document } = editor;
            const { start: { line, character } } = editor.selection;
            const position = new vscode_1.Position(line, character);
            propTrail(document, position);
        }
    });
    const jumpToReference = vscode_1.commands.registerCommand('propTrail.jumpToReference', reference => {
        const { document, range } = reference;
        const options = {
            preserveFocus: true,
            preview: true,
            selection: range,
            viewColumn: 2
        };
        vscode_1.window.showTextDocument(document, options);
    });
    const propTrail = (document, position) => __awaiter(this, void 0, void 0, function* () {
        const ast = generateAst(document);
        let classProperties = new Map();
        babel_traverse_1.default(ast, {
            enter(path) {
                const { uri: target } = document;
                const range = document.getWordRangeAtPosition(position);
                const hoverName = document.getText(range);
                // if (hoverName === 'getContextValue' && path.node.name === 'value') {
                // TODO: handle plain objects that are passed into value prop
                if (babel_types_1.isJSXAttribute(path.node) && babel_types_1.isJSXExpressionContainer(path.node.value)) {
                    if (babel_types_1.isCallExpression(path.node.value.expression)) {
                        if (babel_types_1.isMemberExpression(path.node.value.expression.callee)) {
                            if (babel_types_1.isIdentifier(path.node.value.expression.callee.property)) {
                                const providerFunctionName = path.node.value.expression.callee.property.name;
                                let classProperty;
                                if (classProperty = classProperties.get(providerFunctionName)) {
                                    if (babel_types_1.isArrowFunctionExpression(classProperty.value) && babel_types_1.isBlockStatement(classProperty.value.body)) {
                                        classProperty.value.body.body.forEach((item) => {
                                            if (babel_types_1.isReturnStatement(item) && babel_types_1.isObjectExpression(item.argument)) {
                                                console.log(item.argument.properties);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                // if parent is ClassProperty => arrow functions for a class are class properties
                if (babel_types_1.isClassProperty(path.node)) {
                    classProperties.set(path.node.key.name, path.node);
                }
                // if (isJSXAttribute(path.node)) jumpToComponentDefinition(path.parent, target, hoverName);
            }
        });
    });
    context.subscriptions.push(disposable, jumpToReference);
}
exports.activate = activate;
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
                        if (babel_types_1.isIdentifier(path.node) && path.node.name === hoverName) {
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
    vscode_1.window.createTreeView('propTrailReferences', {
        treeDataProvider: new references_1.ReferenceProvider(references, document),
        showCollapseAll: true
    });
};
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map