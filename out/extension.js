"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const provider_1 = require("./provider");
function activate(context) {
    const provider = new provider_1.default();
    // register content provider for scheme `references`
    // register document link provider for scheme `references`
    const providerRegistrations = vscode_1.Disposable.from(vscode_1.workspace.registerTextDocumentContentProvider(provider_1.default.scheme, provider), vscode_1.languages.registerDocumentLinkProvider({ scheme: provider_1.default.scheme }, provider));
    // register command that crafts an uri with the `references` scheme,
    // open the dynamic document, and shows it in the next editor
    const commandRegistration = vscode_1.commands.registerTextEditorCommand('extension.printReferences', editor => {
        const uri = provider_1.encodeLocation(editor.document.uri, editor.selection.active);
        return vscode_1.workspace.openTextDocument(uri).then(doc => vscode_1.window.showTextDocument(doc, editor.viewColumn + 1));
    });
    context.subscriptions.push(provider, commandRegistration, providerRegistrations);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map