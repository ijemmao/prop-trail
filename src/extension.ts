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
import { parse, ParserPlugin } from '@babel/parser';
import {
  isIdentifier,
  isJSXOpeningElement,
  isJSXAttribute,
  isArrowFunctionExpression,
  JSXOpeningElement,
  Identifier
} from 'babel-types';

const PLUGINS: ParserPlugin[] = [
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

export const activate = (context: ExtensionContext) => {
  const disposable = commands.registerCommand('extension.propTrail', () => {
    const editor: TextEditor | undefined = window.activeTextEditor;
    if (editor) {
      const { document, selection } = editor;
      const { start: { line, character } } = selection;
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

  const revealTree = commands.registerCommand('propTrailReferences.reveal', async (treeView, key) => {
    await treeView.reveal({ key }, { focus: true, select: false, expand: true });
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
            // TODO: call this function once
          jumpToComponentDefinition(path.parent, target, hoverName);
        }
      }
    });
  }
  context.subscriptions.push(disposable, jumpToReference, revealTree);
}

const attributeInElement = (component: JSXOpeningElement, hoverName: string) => {
  for (const attribute of component.attributes) {
    if (attribute.name && attribute.name.name === hoverName) return true;
  } return false;
}

const generateAst = (document: TextDocument) => {
  const code = document.getText();
  return parse(code, { sourceType: 'module', plugins: PLUGINS });
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
      const uri = Uri.file(reference.targetUri.path);
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

// TODO: assign correct document to highlight
const generateTree = (highlights: DocumentHighlight[], document: TextDocument): any => {
  const tree: any = {};
  if (tree[document.fileName]) tree[document.fileName] = {};
  tree[document.fileName] = highlights.map((highlight) =>{
    return Object.assign({ document }, highlight)
  });
  return tree;
}

const updateTreeView = async (highlights: DocumentHighlight[], document: TextDocument) => {
  const provider = new ReferenceProvider(generateTree(highlights, document), document);
  const treeView = window.createTreeView('propTrailReferences', {
    treeDataProvider: provider,
    showCollapseAll: false
  });
  let key = '/Users/IjemmaOnwuzulike 1/Documents/Personal Projects/timetracker/web-app/src/screens/Calendar/Calendar.js';
  commands.executeCommand('propTrailReferences.reveal', treeView, key);
}

export function deactivate() { }
