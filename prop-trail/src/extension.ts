import {
  commands,
  languages,
  window,
  workspace,
  CancellationToken,
  CodeLens,
  Command,
  ExtensionContext,
  DocumentHighlight,
  Location,
  Position,
  Range,
  TextDocument,
  TextDocumentShowOptions,
  Uri,
  CodeLensProvider
} from 'vscode';
import { parse } from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import { DepNodeProvider } from './nodeDependencies';
import { TestView } from './TestView';

class GoCodeLensProvider implements CodeLensProvider {
  public provideCodeLenses(document: TextDocument, token: CancellationToken):
    CodeLens[] | Thenable<CodeLens[]> {
      const range = new Range(0, 0, 0, 10);
      // const command: Command = { title: 'showContextMenu', command: 'editor.action.showContextMenu' }
      const command: Command = { title: 'showContextMenu', command: 'settings.action.showContextMenu' }
      const codeLens = new CodeLens(range, command);
      commands.getCommands(true).then((commands) => {
        console.log(commands.filter(item => item.includes('workbench')));
        // jumpToNextSnippetPlaceholder
      })
      console.log(codeLens);
      return [codeLens]
  }

  public resolveCodeLens?(codeLens: CodeLens, token: CancellationToken):
    CodeLens | Thenable<CodeLens> {
      // console.log(codeLens);
      return codeLens;
  }
}

export function activate(context: ExtensionContext) {
  
	let disposable = commands.registerCommand('extension.propTrail', () => {
    window.showInformationMessage('Hello World!');
  });

  window.registerTreeDataProvider('propTrailReferences', new DepNodeProvider(workspace.rootPath || ''));

  const codeLensProvider = languages.registerCodeLensProvider({ scheme: 'file', language: 'javascriptreact' }, new GoCodeLensProvider());

  languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact'}, {
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

  context.subscriptions.push(disposable, codeLensProvider);

  new TestView(context);
}

const attributeInElement = (element: any, attribute: any) => {
  for (const currentAttribute of element.attributes) {
    if (currentAttribute.name && currentAttribute.name.name === attribute) return currentAttribute;
    else if (currentAttribute.argument && currentAttribute.argument.name === attribute) return currentAttribute;
  }
}

const generateAst = (document: TextDocument) => {
  const text = document.getText();
  return parse(text, {
    sourceType: "module", plugins: [
      'jsx',
      'flow',
      'classConstructorCall',
      'doExpressions',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'asyncGenerators']
  });
}

const highlightObjectOccurrences = (document: TextDocument, highlightObject: any, uri: Uri) => {
  if (highlightObject) {
    const { line: startLine, column: startColumn } = highlightObject.loc.start;
    const { line: endLine, column: endColumn } = highlightObject.loc.end;
    const startPosition = new Position(startLine - 1, startColumn);
    const endPosition = new Position(endLine - 1, endColumn);
    commands.executeCommand<DocumentHighlight[]>('vscode.executeDocumentHighlights', uri, startPosition).then(highlights => {

      const range = new Range(startPosition, endPosition);
      const options: TextDocumentShowOptions = { preserveFocus: true, preview: true, selection: range, viewColumn: 2 }
      window.showTextDocument(document, options).then(editor => {
        commands.executeCommand<CodeLens[]>('vscode.executeCodeLensProvider', uri).then(ok => {

          console.log('something ese')
        })
      });
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
        let highlightObject: any;
        traverse(ast, {
          enter(path: any) {
            if (t.isIdentifier(path.node) && path.node.name === hoverName) {
              highlightObject = path.node;
            }
          }
        });
        highlightObjectOccurrences(document, highlightObject, uri);
      })
    }
  })
}

export function deactivate() {}
