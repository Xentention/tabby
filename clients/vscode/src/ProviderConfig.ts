import { 
    ExtensionContext, 
    languages, 
    workspace, 
    Disposable 
} from "vscode";
import { tabbyCommands } from "./commands";
import { TabbySuggestionsProvider } from "./TabbySuggestionsProvider";
import { TabbyCompletionProvider } from "./TabbyCompletionProvider";
import { tabbyStatusBarItem } from "./statusBarItem";

/**
 * Provides a CompletionItemProvider configuration to dinamically change
 * configuration according to the user's settings
 */
let tabbyCompletionItemProvider: Disposable;

export function updateTabbyProviderChoice(context: ExtensionContext){
    if(typeof tabbyCompletionItemProvider !== 'undefined'){
        tabbyCompletionItemProvider.dispose();
    }
    
    updateTabbyItemProvider();

    context.subscriptions.push(
        tabbyCompletionItemProvider,
        tabbyStatusBarItem(),
        ...tabbyCommands(),
    );
}

function updateTabbyItemProvider(): Disposable{
    if(areInlineCompletionsChosen()){
        tabbyCompletionItemProvider = languages.registerInlineCompletionItemProvider(
            { pattern: "**" },
            new TabbyCompletionProvider()
        );
        console.debug("Using inline completions");
    } else { 
        tabbyCompletionItemProvider = languages.registerCompletionItemProvider(
            { pattern: "**" },
            new TabbySuggestionsProvider()
        );
        console.debug("Using normal completions");
    }
    return tabbyCompletionItemProvider;
}

function areInlineCompletionsChosen() : boolean {
    const configuration = workspace.getConfiguration("tabby");
    return configuration.get<boolean>("usage.showInlineCompletions", false);
    
}