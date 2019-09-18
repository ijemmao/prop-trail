import { commands, languages, window } from 'vscode';
import * as vscode from 'vscode';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

let elements: Array<any> = [];
let attribute: any = null;

export function activate(context: vscode.ExtensionContext) {
  
	let disposable = commands.registerCommand('extension.propTrail', () => {
    window.showInformationMessage('Hello World!');
  });
  
  languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact'}, {
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
          'asyncGenerators'] });
      traverse(ast, {
        enter(path: any) {
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
            } else {
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
          } else if (t.isJSXAttribute(path.node)) {
            grabbedName = path.node.name.name;
            // attribute = path.node;
            // const element = attributeInElement(elements, attribute);
            // console.log('what it do', element);
            // if (grabbedName === hoverName && elements) {
            //   console.log(path.node);
            // }
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

const attributeInElement = (elements: Array<any>, attribute: any) => {
  let index = 0;
  let inElement = false;
  let element: any;
  while (inElement === false || index < elements.length) {
    const currentElement = elements[index];
    if (!inElement) {
      currentElement.attributes.forEach((currentAttribute: any) => {
        if (currentAttribute.name.name === attribute.name.name) {
          inElement = true;
          element = currentElement;
        }
      })
    }
    index += 1;
  }
  if (inElement) return element;
  return undefined;
}

export function deactivate() {}
