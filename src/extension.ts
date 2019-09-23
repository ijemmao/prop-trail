import traverse, { NodePath } from 'babel-traverse';
import { ReferenceProvider } from './references';
import { find } from 'lodash';
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
  Range,
} from 'vscode';
import {
  parse,
  PluginName
} from 'babylon';
import {
  isIdentifier,
  isJSXOpeningElement,
  isJSXAttribute,
  isArrowFunctionExpression,
  JSXOpeningElement,
  Identifier
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

  const propTrail = async (document: TextDocument, position: Position) => {
    const ast = generateAst(document);

    traverse(ast, {
      enter(path: NodePath) {
        const { uri: target } = document;
        const range = document.getWordRangeAtPosition(position);
        const hoverName = document.getText(range);
        if (isJSXAttribute(path.node)
          && isJSXOpeningElement(path.parent)
          && attributeInElement(path.parent, hoverName)) {
          jumpToComponentDefinition(path.parent, target, hoverName);
        }
      }
    });
  }
  context.subscriptions.push(disposable, jumpToReference);
}

const attributeInElement = (component: JSXOpeningElement, hoverName: string) => {
  for (const attribute of component.attributes) {
    if (attribute.name && attribute.name.name === hoverName) return true;
  } return false;
}

const generateAst = (document: TextDocument) => {
  const text = document.getText();
  return parse(text, { sourceType: "module", plugins: PLUGINS });
}

const highlightObjectOccurrences = (document: TextDocument, highlightObjects: Identifier[]) => {
  if (highlightObjects.length) {
    const highlightPromises = highlightObjects.map((highlightObject) => {
      const { line: startLine, column: startColumn } = highlightObject.loc.start;
      const startPosition = new Position(startLine - 1, startColumn);
      return commands.executeCommand<DocumentHighlight[]>('vscode.executeDocumentHighlights', document.uri, startPosition).then(highlight => ({ highlight, meta: [highlightObject] }));
    })

    Promise.all(highlightPromises).then((highlights: { highlight: DocumentHighlight[] | undefined, meta: Identifier[] }[]) => {
      const cleanedHighlights = highlights
        .map(({ highlight, meta }: any) => {
          if (highlight) {
            return highlight;
          }
          const { loc: { end:
            { line: endLine, column: endCharacter },
            start: { line: startLine, column: startCharacter }
          } } = meta[0] || meta;

          const range = new Range(new Position(startLine, startCharacter), new Position(endLine, endCharacter));
          return new DocumentHighlight(range);
        })
        .flat()
        .reduce((objects: DocumentHighlight[], highlight: DocumentHighlight) => {
          if (!find(objects, ({ range }: DocumentHighlight) => range.isEqual(highlight.range))) {
            objects.push(highlight)
          }
          return objects;
        }, []);

      updateTreeView(cleanedHighlights, document);
    })
  }
}

const jumpToComponentDefinition = (component: JSXOpeningElement, target: Uri, hoverName: string) => {
  const { line, column } = component.loc.start;
  const componentPosition = new Position(line - 1, column + 3);
  commands.executeCommand<Location[]>('vscode.executeDefinitionProvider', target, componentPosition).then(references => {
    references = references || [];

    if (references) {
      const reference = references[0];
      const uri = Uri.file(reference.uri.path);
      workspace.openTextDocument(uri).then(document => {
        const ast = generateAst(document);
        let highlightObjects: Identifier[] = [];
        traverse(ast, {
          enter(path: any) {
            if (isIdentifier(path.node) && !isArrowFunctionExpression(path.parent) && path.node.name === hoverName) {
              // TODO: runtime O(n^2)
              if (!find(highlightObjects, (highlight) => (
                highlight.start === path.node.start && highlight.end === path.node.end))) {
                highlightObjects.push(path.node);
              }
            }
          }
        });
        highlightObjectOccurrences(document, highlightObjects);
      })
    }
  })
}

const updateTreeView = (...args: [DocumentHighlight[], TextDocument]) => {
  window.createTreeView('propTrailReferences', {
    treeDataProvider: new ReferenceProvider(...args),
    showCollapseAll: false
  });
}

export function deactivate() { }
