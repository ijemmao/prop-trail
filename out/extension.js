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
const traverse_1 = require("@babel/traverse");
const references_1 = require("./references");
const lodash_1 = require("lodash");
const vscode_1 = require("vscode");
const parser_1 = require("@babel/parser");
const babel_types_1 = require("babel-types");
const PLUGINS = [
    'asyncDoExpressions',
    'asyncGenerators',
    'bigInt',
    'classPrivateMethods',
    'classPrivateProperties',
    'classProperties',
    'classStaticBlock',
    'decimal',
    'decorators-legacy',
    'doExpressions',
    'dynamicImport',
    'estree',
    'exportDefaultFrom',
    'flowComments',
    'functionBind',
    'functionSent',
    'importMeta',
    'jsx',
    'logicalAssignment',
    'importAssertions',
    'moduleStringNames',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    'partialApplication',
    'privateIn',
    'throwExpressions',
    'topLevelAwait',
    'typescript',
    'v8intrinsic',
];
exports.activate = (context) => {
    const disposable = vscode_1.commands.registerCommand('extension.propTrail', () => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            const { document, selection } = editor;
            const { start: { line, character } } = selection;
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
    const revealTree = vscode_1.commands.registerCommand('propTrailReferences.reveal', (treeView, key) => __awaiter(void 0, void 0, void 0, function* () {
        yield treeView.reveal({ key }, { focus: true, select: false, expand: true });
    }));
    const propTrail = (document, position) => __awaiter(void 0, void 0, void 0, function* () {
        const ast = generateAst(document);
        traverse_1.default(ast, {
            enter(path) {
                const { uri: target } = document;
                const range = document.getWordRangeAtPosition(position);
                const hoverName = document.getText(range);
                if (babel_types_1.isJSXAttribute(path.node)
                    && babel_types_1.isJSXOpeningElement(path.parent)
                    && attributeInElement(path.parent, hoverName)) {
                    // TODO: call this function once
                    jumpToComponentDefinition(path.parent, target, hoverName);
                }
            }
        });
    });
    context.subscriptions.push(disposable, jumpToReference, revealTree);
};
const attributeInElement = (component, hoverName) => {
    for (const attribute of component.attributes) {
        if (attribute.name && attribute.name.name === hoverName)
            return true;
    }
    return false;
};
const generateAst = (document) => {
    const code = document.getText();
    return parser_1.parse(code, { sourceType: 'module', plugins: PLUGINS });
};
const highlightObjectOccurrences = (document, highlightObjects) => {
    if (highlightObjects.length) {
        const highlightPromises = highlightObjects.map((highlightObject) => {
            const { line: startLine, column: startColumn } = highlightObject.loc.start;
            const startPosition = new vscode_1.Position(startLine - 1, startColumn);
            return vscode_1.commands.executeCommand('vscode.executeDocumentHighlights', document.uri, startPosition).then(highlight => ({ highlight, meta: [highlightObject] }));
        });
        Promise.all(highlightPromises).then((highlights) => {
            const cleanedHighlights = highlights
                .map(({ highlight, meta }) => {
                if (highlight) {
                    return highlight;
                }
                const { loc: { end: { line: endLine, column: endCharacter }, start: { line: startLine, column: startCharacter } } } = meta[0] || meta;
                const range = new vscode_1.Range(new vscode_1.Position(startLine, startCharacter), new vscode_1.Position(endLine, endCharacter));
                return new vscode_1.DocumentHighlight(range);
            })
                .flat()
                .reduce((objects, highlight) => {
                if (!lodash_1.find(objects, ({ range }) => range.isEqual(highlight.range))) {
                    objects.push(highlight);
                }
                return objects;
            }, []);
            updateTreeView(cleanedHighlights, document);
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
            const uri = vscode_1.Uri.file(reference.targetUri.path);
            vscode_1.workspace.openTextDocument(uri).then(document => {
                const ast = generateAst(document);
                let highlightObjects = [];
                traverse_1.default(ast, {
                    enter(path) {
                        if (babel_types_1.isIdentifier(path.node) && !babel_types_1.isArrowFunctionExpression(path.parent) && path.node.name === hoverName) {
                            // TODO: runtime O(n^2)
                            if (!lodash_1.find(highlightObjects, (highlight) => (highlight.start === path.node.start && highlight.end === path.node.end))) {
                                highlightObjects.push(path.node);
                            }
                        }
                    }
                });
                highlightObjectOccurrences(document, highlightObjects);
            });
        }
    });
};
// TODO: assign correct document to highlight
const generateTree = (highlights, document) => {
    const tree = {};
    if (tree[document.fileName])
        tree[document.fileName] = {};
    tree[document.fileName] = highlights.map((highlight) => {
        return Object.assign({ document }, highlight);
    });
    return tree;
};
const updateTreeView = (highlights, document) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new references_1.ReferenceProvider(generateTree(highlights, document), document);
    const treeView = vscode_1.window.createTreeView('propTrailReferences', {
        treeDataProvider: provider,
        showCollapseAll: false
    });
    let key = '/Users/IjemmaOnwuzulike 1/Documents/Personal Projects/timetracker/web-app/src/screens/Calendar/Calendar.js';
    vscode_1.commands.executeCommand('propTrailReferences.reveal', treeView, key);
});
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map