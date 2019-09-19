import traverse, { NodePath } from 'babel-traverse';
import { ReferenceProvider } from './references';
import {
  commands,
  window,
  workspace,
  ExtensionContext,
  DocumentHighlight,
  Location,
  Position,
  TextDocument,
  TextDocumentShowOptions,
  Uri,
  TextEditor,
} from 'vscode';
import {
  parse,
  PluginName
} from 'babylon';
import {
  isIdentifier,
  isJSXOpeningElement,
  isJSXAttribute
} from 'babel-types';

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

let numOfRefs = 0;
export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand('extension.propTrail', (args) => {
    const editor: TextEditor | undefined = window.activeTextEditor;
    if (editor) {
      const { document } = editor;
      const { start: { line, character } } = editor.selection;
      const position = new Position(line, character);
      propTrail(document, position);
    }
  });
  
  const jumpToReference = commands.registerCommand('propTrail.jumpToReference', reference => {
    const { document, range } = reference;
    const options: TextDocumentShowOptions = {
      preserveFocus: true,
      preview: true,
      selection: range,
      viewColumn: 2
    };
    window.showTextDocument(document, options);
  });

  const propTrail = async(document: TextDocument, position: Position) => {
    const ast = generateAst(document);
    
    traverse(ast, {
      enter(path: NodePath) {
        const { uri: target } = document;
        const range = document.getWordRangeAtPosition(position);
        const hoverName = document.getText(range);
        if (isJSXOpeningElement(path.node)) {
          const component = path.node;
          const { loc: { start: { line: componentStartLine } } } = path.node;
          const attribute = attributeInElement(path.node, hoverName);
          if (attribute && componentStartLine <= position.line) {
            jumpToComponentDefinition(component, target, hoverName);
          }
        }
      }
    });
  }

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
            if (isIdentifier(path.node) && path.node.name === hoverName) {
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
  window.createTreeView('propTrailReferences', {
    treeDataProvider: new ReferenceProvider(references, document),
    showCollapseAll: true
  });
}

export function deactivate() { }
