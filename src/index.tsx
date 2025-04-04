import * as React from "react";
import ChatBot, { Options } from "react-chatbotify";
import {v4 as uuidv4} from 'uuid';

import {Model, Provider, QueryRequest, QueryResponse} from "./model/service";
import {submitQuery} from "./service/query";

import "./index.css"

export const Extension = (props: any) => {

    const conversationID = uuidv4();

    const { application } = props;
    const options: Options = {
        theme: {
            showHeader: false,
            showFooter: false,
            embedded: true

        },
        chatHistory: {
            storageKey: "lightspeed"
        },
        chatWindow: {
            showScrollbar: true
        },
        chatWindowStyle: {
            width: "100%",
            height: "80vh"
        },
        botBubbleStyle: {
            backgroundColor: "#6D7F8B",
            color: "#F8F8FB"
        },
        userBubbleStyle: {
            background: "#00A2B3",
            color: "#ffffff"
        }

    }

    const flow = {
        start: {
            message: "Welcome to OpenShift Lightspeed, how can I help you?",
            path: "loop"
        },
		loop: {
			message: async (params) => {
                const queryRequest: QueryRequest = {
                    conversation_id: conversationID,
                    model: Model.GPT4,
                    provider: Provider.AZURE,
                    query: params.userInput,
                    system_prompt: ""
                }

                const result: QueryResponse = await submitQuery(queryRequest, application);

				return result.response;
			},
			path: "loop",
		}
    }

    return (
        <ChatBot options={options} flow={flow} />
    );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', { icon: 'fa-sharp fa-light fa-bars-progress fa-lg' });
})(window);
