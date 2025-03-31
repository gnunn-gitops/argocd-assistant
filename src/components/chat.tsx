import * as React from "react";

import "./chat.css"

import {Model, Provider, QueryRequest, QueryResponse} from "../model/service";
import {submitQuery} from "../service/query";

enum Entity {
    LIGHTSPEED = "Lightspeed",
    USER = "You"
}

type ChatEntry = {
    entity: string;
    message: string;
}

const LIGHTSPEED = "Lightspeed";

export const Chat = ({resource, application}:any) => {

    const [chatLog, setChatLog] = React.useState<ChatEntry[]>([{entity: Entity.LIGHTSPEED, message: "Welcome to OpenShift Lightspeed, how can I help you?"}]);

    console.log("Chat Application");
    console.log(application);

    // I'm passing both to work around some thread safety issues that
    // I don't want to solve for a simple POC
    const addEntry = async (query: ChatEntry, response: ChatEntry) => {
        // This might be inefficient but it forces the re-render by causing the
        // React useState to recognize a new variable was set
        var entries:ChatEntry[] = [...chatLog];
        entries.push(query);
        entries.push(response);
        setChatLog(entries);
    }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        console.log("form was submitted");
        e.preventDefault();
        const target = e.target as typeof e.target & {
            token: { value: string };
            query: { value: string };
          };

        const query = target.query.value;

        const queryRequest: QueryRequest = {
            conversation_id: "9846bb0c-1160-47e9-9505-0d0d55d2c229",
            model: Model.GPT4,
            provider: Provider.AZURE,
            query: query,
            system_prompt: ""
        }

        console.log(queryRequest);

        console.log("HandleSubmit Application");
        console.log(application);

        submitQuery(queryRequest, application).then( (res: QueryResponse) => {
            addEntry({entity: Entity.USER, message: query},{entity: LIGHTSPEED, message: res.response});
        });

        console.log(chatLog);
    };

    return (
        <div className='chat'>
            <div className='chat-log'>
                {
                    chatLog.map(entry =>
                      <p>
                        <b>{entry.entity}</b>:
                        {String(entry.message).includes('\n') ?
                           <blockquote><pre>{entry.message}</pre></blockquote>
                        :
                          <span>{entry.message}</span>
                        }
                      </p>)
                }
            </div>
            <div className='chat-entry'>
                <form onSubmit={handleFormSubmit}>
                    <span>Query</span><input name="query" /><button type="submit" className='argo-button argo-button--base'>Send</button>
                </form>
            </div>
        </div>
    )
}

export default Chat;
