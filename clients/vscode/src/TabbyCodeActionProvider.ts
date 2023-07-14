import {
  CodeActionProvider,
  TextDocument,
  Range,
  CodeActionContext,
  CancellationToken,
  ProviderResult,
  CodeAction,
  CodeActionKind,
  Command,
  Diagnostic,
  workspace,
  WorkspaceEdit,
  commands,
  Position,
} from 'vscode';
  import { CompletionResponse, CancelablePromise } from "tabby-agent";
  import { agent } from "./agent";
  import { sleep } from "./utils";

export class TabbyCodeActionProvider implements CodeActionProvider {
    private uuid = Date.now();
    private latestTimestamp: number = 0;
    private pendingCompletion: CancelablePromise<CompletionResponse> | null = null;
  
    // User Settings
    private enabled: boolean = true;
  
    // These settings will be move to tabby-agent
    private suggestionDelay: number = 150;
    private maxPrefixLines: number = 20;
    private maxSuffixLines: number = 20;

    constructor() {
      this.updateConfiguration();
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('tabby')) {
          this.updateConfiguration();
        }
      });
    }

  //@ts-ignore because ASYNC and PROMISE
  //prettier-ignore
  public async provideCodeActions(document: TextDocument,  rangeParameter: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<(CodeAction[] | CodeActionList)> {
      //throw new Error('Method not implemented.');
      const emptyResponse = Promise.resolve([] as CodeAction[]);
      if (!this.enabled) {
        console.debug("Extension not enabled, skipping.");
        return emptyResponse;
      }

      // костыль
      if (!(rangeParameter instanceof Range)) {
        console.debug("Selection was passed");
        return emptyResponse;
      }

      const currentTimestamp = Date.now();
      this.latestTimestamp = currentTimestamp;
  
      await sleep(this.suggestionDelay);
      if (currentTimestamp < this.latestTimestamp) {
        return emptyResponse;
      }

      if (this.pendingCompletion) {
        this.pendingCompletion.cancel();
      }

      const range: Range = rangeParameter;
      const position: Position = range.start;

      const request = {
        filepath: document.uri.fsPath,
        language: document.languageId,  // https://code.visualstudio.com/docs/languages/identifiers
        text: document.getText(),
        position: document.offsetAt(position),
        maxPrefixLines: this.maxPrefixLines,
        maxSuffixLines: this.maxSuffixLines,
      };
      this.pendingCompletion = agent().getCompletions(request);

      const completion = await this.pendingCompletion.catch((_: Error) => {
        return null;
      });
      this.pendingCompletion = null;

      const completions = this.toCodeActions(completion, range);
      return Promise.resolve(completions);
  }

  private toCodeActions(tabbyCompletion: CompletionResponse | null, range: Range): CodeAction[] {
    //throw new Error('Method not implemented.');
    return (
      tabbyCompletion?.choices?.map((choice: any) => {
        let event = {
          type: "select",
          completion_id: tabbyCompletion.id,
          choice_index: choice.index,
        };
        //создаю инстанс
        const codeAction = new CodeAction('Suggestion', CodeActionKind.QuickFix);
        //добавляю в него сгенеренный код
        codeAction.edit = new WorkspaceEdit();
        codeAction.edit.replace(choice.uri, range, choice.text);
        //Выполняемая команда
        codeAction.command = ({
          title: "",
          command: "tabby.emitEvent",
          arguments: [event],
        });
        return codeAction; 
      }) || []
    );
  }

  private updateConfiguration() {
    const configuration = workspace.getConfiguration('tabby');
    this.enabled = configuration.get('codeActions', true);
  }

}