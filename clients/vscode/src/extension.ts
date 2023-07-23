// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, workspace } from "vscode";
import { createAgentInstance } from "./agent";
import { tabbyCommands } from "./commands";
import { updateTabbyProviderChoice } from "./ProviderConfig";
import { TabbySuggestionsProvider } from "./TabbySuggestionsProvider";
import { TabbyCompletionProvider } from "./TabbyCompletionProvider";
import { tabbyStatusBarItem } from "./statusBarItem";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  console.debug("Activating Tabby extension1", new Date());
  await createAgentInstance(context);

  updateTabbyProviderChoice(context);

  workspace.onDidChangeConfiguration(event => {
    if(event.affectsConfiguration("tabby")) {
      updateTabbyProviderChoice(context);
    }
  });
  
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.debug("Deactivating Tabby extension", new Date());
}

function areInlineCompletionsChosen() : boolean {
  const configuration = workspace.getConfiguration("tabby");
  return configuration.get<boolean>("usage.showInlineCompletions", false);

}