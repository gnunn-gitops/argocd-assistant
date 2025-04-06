import * as React from "react";
import ChatBot, { Options } from "react-chatbotify";
import {v4 as uuidv4} from 'uuid';
//import * as YAML from 'yaml';

import {Attachment, AttachmentTypes, Events, Model, Provider, QueryRequest, QueryResponse} from "./model/service";
import {submitQuery} from "./service/query";

import "./index.css"

export const Extension = (props: any) => {
    const [events, setEvents] = React.useState<Events>({
        apiVersion: "v1",
        items: []
    });

    const conversationID = uuidv4();

    const { resource, application } = props;

    console.log(resource);

    const application_name = application?.metadata?.name || "";

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
                const attachments: Attachment[] = [];

                if (resource) {
                    attachments.push(
                        {
                            content: JSON.stringify(resource),
                            content_type: "application/json",
                            attachment_type: AttachmentTypes.MANIFEST
                        }
                    )
                } else {
                    console.log("No manifest available");
                }

                if (events.items.length > 0) {
                    attachments.push(
                        {
                            content: JSON.stringify(events),
                            content_type: "application/json",
                            attachment_type: AttachmentTypes.EVENTS
                        }
                    )
                } else {
                    console.log("No events available");
                }

                console.log("Attachments");
                console.log(attachments);
                const queryRequest: QueryRequest = {
                    conversation_id: conversationID,
                    model: Model.GPT4,
                    provider: Provider.AZURE,
                    query: params.userInput,
                    system_prompt: "",
                    attachments: attachments
                }

                const result: QueryResponse = await submitQuery(queryRequest, application);

				return result.response;
			},
			path: "loop",
		}
    }

    // Get Events
    React.useEffect(() => {
        let url = `/api/v1/applications/${application_name}/events?resourceUID=${resource.metadata.uid}&resourceNamespace=${resource.metadata.namespace}&resourceName=${resource.metadata.name}`;
        if (resource.kind === "Application") {
          url = `/api/v1/applications/${application_name}/events`;
        }
        fetch(url)
          .then(response => response.json())
          .then(data => {
            setEvents({
                apiVersion: "v1",
                items: data.items
            });
          })
          .catch(err => {
            console.error("res.data", err);
          });
      }, [application, resource, application_name]);

    return (
        <ChatBot options={options} flow={flow} />
    );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', { icon: 'fa-sharp fa-light fa-message fa-lg' });
})(window);
