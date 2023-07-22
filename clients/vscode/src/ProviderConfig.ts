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

export class ProviderConfig {
    private tabbyCompletionItemProvider: Disposable;

    constructor(){
        //a crutch bc of an error due to an implicit initialization
        this.tabbyCompletionItemProvider = this.updateTabbyProvider();
    }

    public getTabbyCompletionItemProvider(): Disposable{
        return this.tabbyCompletionItemProvider;
    }

    public updateCompletionItemProvider(context: ExtensionContext){
        if(typeof this.tabbyCompletionItemProvider !== 'undefined'){
            this.tabbyCompletionItemProvider.dispose();
        }
        
        this.updateTabbyProvider();

        context.subscriptions.push(
            this.tabbyCompletionItemProvider,
            tabbyStatusBarItem(),
            ...tabbyCommands(),
        );
    }

    private areInlineCompletionsChosen() : boolean {
        const configuration = workspace.getConfiguration("tabby");
        return configuration.get<boolean>("usage.showInlineCompletions", false);
      
    }

    private updateTabbyProvider(): Disposable{
        if(this.areInlineCompletionsChosen()){
            this.tabbyCompletionItemProvider = languages.registerInlineCompletionItemProvider(
                { pattern: "**" },
                new TabbyCompletionProvider()
            );
            console.debug("Using inline completions");
        } else { 
            this.tabbyCompletionItemProvider = languages.registerCompletionItemProvider(
                { pattern: "**" },
                new TabbySuggestionsProvider()
            );
            console.debug("Using normal completions");
        }
        return this.tabbyCompletionItemProvider;
    }
}