/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { workspace, languages, window, commands, ExtensionContext, Disposable, TextDocument } from 'vscode';
import ContentProvider, { encodeLocation } from './provider';

export function activate(context: ExtensionContext) {

  const provider = new ContentProvider();

  // register content provider for scheme `references`
  // register document link provider for scheme `references`
  const providerRegistrations = Disposable.from(
    workspace.registerTextDocumentContentProvider(ContentProvider.scheme, provider),
    languages.registerDocumentLinkProvider({ scheme: ContentProvider.scheme }, provider)
  );

  // register command that crafts an uri with the `references` scheme,
  // open the dynamic document, and shows it in the next editor
  const commandRegistration = commands.registerTextEditorCommand('extension.printReferences', editor => {
    const uri = encodeLocation(editor.document.uri, editor.selection.active);
    return workspace.openTextDocument(uri).then(doc => window.showTextDocument(doc, editor.viewColumn! + 1));
  });

  // Register hover functionality
  languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, {
    provideHover(document, position, token) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);
      return {
        contents: ['Hover Content', word]
      }
    }
  })

  context.subscriptions.push(
    provider,
    commandRegistration,
    providerRegistrations
  );
}
