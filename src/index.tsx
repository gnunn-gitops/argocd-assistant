import * as React from "react";
import ChatBot, { Flow, Settings, Styles } from "react-chatbotify";
import {v4 as uuidv4} from 'uuid';

import {Attachment, AttachmentTypes, Events, LogEntry, QueryRequest, SYSTEM_PROMPT} from "./model/service";
import {queryStream} from "./service/query";
import { getContainers, getResourceIdentifier, isAttachRequest, isCancelRequest} from "./util/util";
import {getLogs, hasLogs, MAX_LINES} from "./service/logs";

import MarkdownRenderer, { MarkdownRendererBlock } from "@rcb-plugins/markdown-renderer";

import MarkedWrapper from "./components/MarkedWrapper";
//import ErrorMessage from "./components/ErrorMessage";

import "./index.css"

const CHAT_HISTORY_KEY = "lightspeed-chat-history";
const RESOURCE_ID_KEY = "lightspeed-resource-id";
const LOGS_KEY = "lightspeed-logs";

//const TOAST_TIMEOUT = 10000;

export const Extension = (props: any) => {
    const { resource, application } = props;
    const pluginConfig = {
        autoConfig: true,
        markdownComponent: MarkedWrapper
    }
    const plugins = [MarkdownRenderer(pluginConfig)];


    const [form, setForm] = React.useState({});

    // This doesn't preserve conversationID between tab switches, I suspect
    // Argo CD reloads the extension
    const conversationID:string = React.useMemo(() => {
        return uuidv4()
    },[resource.kind,resource.metadata?.name,resource.metadata?.namespace]);

    const [events, setEvents] = React.useState<Events>({
        apiVersion: "v1",
        items: []
    });

    const containers:string[] = hasLogs(resource) ? getContainers(resource) : [];

    const application_name = application?.metadata?.name || "";
    const resource_name = resource?.metadata?.name || "";
    const resource_kind = resource?.kind || "";

    const currentResourceID = sessionStorage.getItem(RESOURCE_ID_KEY)
    const resourceID = getResourceIdentifier(resource);

    // If a new resource update caches. This is used to handle
    // how Argo CD reloads extension tab when tab switching on resource view.
    // If it's the same resource that was browsed earlier, keep the caches.
    // If it's a different resource clear the caches.
    if (currentResourceID !== resourceID) {
        sessionStorage.setItem(RESOURCE_ID_KEY, resourceID);
        sessionStorage.removeItem(CHAT_HISTORY_KEY);
        sessionStorage.removeItem(LOGS_KEY);
    }

    const settings: Settings = {
        general: {
            showFooter: false,
            showHeader: false,
            embedded: true
        },
        fileAttachment: {
            disabled: true
        },
        chatHistory: {
            disabled: false,
            storageKey: CHAT_HISTORY_KEY,
            storageType: "SESSION_STORAGE",
            // More management of state needs to be done in this extension, it basically
            // looks every time a tab is switched the view gets re-loaded. Enabling this switch
            // brings back the state automatically but if the user attached logs they would lose
            // though which is confusing.
            autoLoad: true
        },
        chatWindow: {
            showScrollbar: true
        }
    }

    const styles: Styles = {
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

    const flow:Flow = {
        start: {
            message: (params) => {
                if (!(CHAT_HISTORY_KEY in sessionStorage)) {
                    params.injectMessage("How can I help you with the resource '" +
                                          resource_name +
                                          "' of type " +
                                          resource_kind + "?" +
                                          ( hasLogs(resource) ? " I notice this resource has logs available, to attach one or more container logs type 'Attach' at any time.": ""));
                }
            },
            path: async (params) => {
                if (isAttachRequest(params.userInput) && hasLogs(resource)) {
                    return "attach"
                } else if (isAttachRequest(params.userInput)) return "no_attach"
                else return "loop"
            }
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
                }

                if (events?.items?.length > 0) {
                    attachments.push(
                        {
                            content: JSON.stringify(events),
                            content_type: "application/json",
                            attachment_type: AttachmentTypes.EVENTS
                        }
                    )
                }

                if (LOGS_KEY in sessionStorage ) {
                    attachments.push(
                        {
                            content: sessionStorage.getItem(LOGS_KEY),
                            content_type: "application/json",
                            attachment_type: AttachmentTypes.LOG
                        }
                    )
                }

                const queryRequest: QueryRequest = {
                    conversation_id: conversationID,
                    query: params.userInput,
                    system_prompt: SYSTEM_PROMPT,
                    attachments: attachments
                }
                try {
                    await queryStream(queryRequest, application, params);
                } catch (error) {
                    console.log(error);
                    return "Unexpected Error: " + error.message + "";
                }
			} ,
            renderMarkdown: ["BOT"],
			path: async (params) => {
                if (isAttachRequest(params.userInput) && hasLogs(resource)) {
                    return "attach"
                } else if (isAttachRequest(params.userInput)) {
                    return "no_attach"
                }
                else return "loop"
            }
		} as MarkdownRendererBlock,
        no_attach: {
            message: "Sorry, logs can only be attached for Pod resources.",
            path: "loop"
        },
        attach: {
            message: "Select the single container for which to attach the logs:",
			checkboxes: {items: containers, min: 1, max: 1},
            chatDisabled: true,
            function: (params) => setForm({...form, container: params.userInput}),
            path: "ask_lines"
        },
        ask_lines: {
			message: "How many lines of the log did you want to attach (max " + MAX_LINES + ")?",
			function: (params) => {
                setForm({...form, lines: params.userInput});
            },
			path: async (params) => {
                if (params.userInput)
				if (isNaN(Number(params.userInput))) {
                    // params.showToast(ErrorMessage({title: "Invalid Input", message: "The number of lines needs to be a valid number"}), TOAST_TIMEOUT);
					await params.injectMessage("The number of lines needs to be a valid number.");
					return;
				}
                if (Number(params.userInput) == 0 || Number(params.userInput) > MAX_LINES ) {
					await params.injectMessage("The number of lines needs to be more then 0 and " + MAX_LINES + " or less");
					return;
                }
                if (isCancelRequest(params.userInput)) return "start";
				return "get_logs";
			}
        },
        get_logs: {
            message: async(params) => {
                try {
                    const result:LogEntry[] = await getLogs(application, resource, form["container"], form["lines"]);
                    sessionStorage.setItem(LOGS_KEY, JSON.stringify(result));
                    return "Requested logs have been attached";
                } catch (error) {
                    return "Unexpected error: " + error.message;
                }
            },
            path: "loop"
        }
    }

    // Get Events, this code from Argo CD metrics extension
    // https://github.com/argoproj-labs/argocd-extension-metrics
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
    <ChatBot plugins={plugins} settings={settings} styles={styles} flow={flow} />
    );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', { icon: 'fa-sharp fa-light fa-message fa-lg' });
})(window);
