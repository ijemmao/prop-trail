import { commands, languages, window } from 'vscode';
import * as vscode from 'vscode';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

export function activate(context: vscode.ExtensionContext) {
  
	let disposable = commands.registerCommand('extension.propTrail', () => {
    window.showInformationMessage('Hello World!');
  });

  languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact'}, {
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
          'asyncGenerators'] });
      traverse(ast, {
        enter(path: any) {
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
      })
      return {
        contents: ['Testing information']
      }
    }
  })

  context.subscriptions.push(disposable);
}

const attributeInElement = (element: any, attribute: any) => {
  for (const currentAttribute of element.attributes) {
    if (currentAttribute.name && currentAttribute.name.name === attribute) return currentAttribute;
    else if (currentAttribute.argument && currentAttribute.argument.name === attribute) return currentAttribute;
  }
}

const jumpToComponentDefinition = (component: any, target: any) => {
  const componentPosition = new vscode.Position(component.loc.start.line - 1, component.loc.start.column + 3);
  vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', target, componentPosition).then(references => {
    references = references || [];

    if (references) {
      const reference = references[0];
      const uri = vscode.Uri.file(reference.uri.path);
      console.log(reference)
      vscode.workspace.openTextDocument(uri).then(document => {
        vscode.window.showTextDocument(document, -2, true).then(editor => {

        });
      })
    }
  })
}

export function deactivate() {}
