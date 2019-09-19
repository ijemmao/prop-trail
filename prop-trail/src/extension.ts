import {
  commands,
  languages,
  window,
  workspace,
  ExtensionContext,
  DocumentHighlight,
  Location,
  Position,
  TextDocument,
  TextDocumentShowOptions,
  Uri,
} from 'vscode';
import { parse, PluginName } from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import { ReferenceProvider } from './references';

const PLUGINS: PluginName[] = [
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

export function activate(context: ExtensionContext) {

  let disposable = commands.registerCommand('extension.propTrail', () => {
    window.showInformationMessage('Hello World!');
  });
  
  const jumpToReference = commands.registerCommand('propTrail.jumpToReference', reference => {    const { document, range } = reference;
    const options: TextDocumentShowOptions = { preserveFocus: true, preview: true, selection: range, viewColumn: 2 }
    window.showTextDocument(document, options).then(editor => {});
  });

  languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, {
    provideHover(document, position, token) {
      const ast = generateAst(document);
      traverse(ast, {
        enter(path: any) {
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
      return { contents: ['Prop Trail'] }
    }
  })

  context.subscriptions.push(disposable, jumpToReference);
}

const attributeInElement = (element: any, attribute: any) => {
  for (const currentAttribute of element.attributes) {
    if (currentAttribute.name && currentAttribute.name.name === attribute) return currentAttribute;
    else if (currentAttribute.argument && currentAttribute.argument.name === attribute) return currentAttribute;
  }
}

const generateAst = (document: TextDocument) => {
  const text = document.getText();
  return parse(text, { sourceType: "module", plugins: PLUGINS });
}

const highlightObjectOccurrences = (document: TextDocument, highlightObjects: any[], uri: Uri) => {
  if (highlightObjects.length) {
    const highlightPromises = highlightObjects.map((highlightObject) => {
      const { line: startLine, column: startColumn } = highlightObject.loc.start;
      const { line: endLine, column: endColumn } = highlightObject.loc.end;
      const startPosition = new Position(startLine - 1, startColumn);
      const endPosition = new Position(endLine - 1, endColumn);
      return commands.executeCommand<DocumentHighlight[]>('vscode.executeDocumentHighlights', uri, startPosition).then(highlight => ({ highlight, meta: [highlightObject] }));
    })

    Promise.all(highlightPromises).then((highlights: any) => {
      highlights = highlights.map(({ highlight, meta }: any) => {
        if (highlight) {
          return highlight;
        } return meta
      });
      udpateTreeView(highlights, document);
    })
  }
}

const jumpToComponentDefinition = (component: any, target: Uri, hoverName: string) => {
  const { line, column } = component.loc.start;
  const componentPosition = new Position(line - 1, column + 3);
  commands.executeCommand<Location[]>('vscode.executeDefinitionProvider', target, componentPosition).then(references => {
    references = references || [];

    if (references) {
      const reference = references[0];
      const uri = Uri.file(reference.uri.path);
      workspace.openTextDocument(uri).then(document => {
        const ast = generateAst(document);
        let highlightObjects: any[] = [];
        traverse(ast, {
          enter(path: any) {
            if (t.isIdentifier(path.node) && path.node.name === hoverName) {
              // Each path.node has different highlight instances attached to it
              highlightObjects.push(path.node);
            }
          }
        });
        highlightObjectOccurrences(document, highlightObjects, uri);
      })
    }
  })
}

const udpateTreeView = (references: DocumentHighlight[], document: TextDocument) => {
  window.createTreeView('propTrailReferences', { treeDataProvider: new ReferenceProvider(references, document), showCollapseAll: true });
}

export function deactivate() { }
