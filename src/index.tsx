import * as React from "react";
import ChatBot, { Options } from "react-chatbotify";
import {v4 as uuidv4} from 'uuid';
import * as Showdown from 'showdown';

import {Attachment, AttachmentTypes, Events, LogEntry, QueryRequest, QueryResponse, SYSTEM_PROMPT} from "./model/service";
import {query} from "./service/query";
import {convertToHTML, getContainers, isAttachRequest, isCancelRequest, isPod} from "./util/util";
import {getLogs} from "./service/logs";
import "./index.css"

export const Extension = (props: any) => {
    const [form, setForm] = React.useState({});

    const [events, setEvents] = React.useState<Events>({
        apiVersion: "v1",
        items: []
    });

    const [logs, setLogs] = React.useState<LogEntry[]>([]);

    const conversationID = uuidv4();

    const convertor = new Showdown.Converter();

    const { resource, application } = props;

    const containers:string[] = isPod(resource) ? getContainers(resource) : [];
    console.log(containers);

    const application_name = application?.metadata?.name || "";
    const resource_name = resource?.metadata?.name || "";
    const resource_kind = resource?.kind || "";

    const options: Options = {
        theme: {
            showHeader: false,
            showFooter: false,
            embedded: true

        },
        footer: {
            text: <span>Powered by OpenShift Lightspeed</span>
        },
        fileAttachment: {
            disabled: false
        },
        chatHistory: {
            storageKey: "lightspeed"
        },
        botBubble: {
            dangerouslySetInnerHtml: true
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
            message: "How can I help you with the resource '" + resource_name + "' of type " + resource_kind + "?" + ( isPod(resource) ? " I notice this is a Pod, to attach one or more container logs type 'Attach' at any time.": ""),
			path: async (params) => {
                console.log("User input " + params.userInput);
                if (isAttachRequest(params.userInput) && isPod(resource)) {
                    console.log("This is a pod " + resource_kind);
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

                if (logs?.length > 0 ) {
                    attachments.push(
                        {
                            content: JSON.stringify(logs),
                            content_type: "application/json",
                            attachment_type: AttachmentTypes.LOG
                        }
                    )
                }

                console.log("Attachments");
                console.log(attachments);
                const queryRequest: QueryRequest = {
                    conversation_id: conversationID,
                    // model: Model.GPT4,
                    // provider: Provider.OPENSHIFT_AI,
                    query: params.userInput,
                    system_prompt: SYSTEM_PROMPT,
                    attachments: attachments
                }
                try {
                    const result: QueryResponse = await query(queryRequest, application);
                    if (result.status == 200) return convertToHTML(result.response, convertor);
                    else return convertor.makeHtml("<p><b>Unexpected Error (" + result.status + ")</b>: " + result.response + "</p>");
                } catch (error) {
                    console.log(error);
                    return convertor.makeHtml("<p><b>Unexpected Error</b>: " + error.message + "</p>");
                }
			},
			path: async (params) => {
                console.log("User input " + params.userInput);
                if (isAttachRequest(params.userInput) && isPod(resource)) {
                    console.log("This is a pod " + resource_kind);
                    return "attach"
                } else if (isAttachRequest(params.userInput)) return "no_attach"
                else return "loop"
            }
		},
        no_attach: {
            message: "Logs can only be attached for Pod resources.",
            path: "loop"
        },
        attach: {
            message: "Select the container for which to attach the logs:",
			checkboxes: {items: containers, min: 1, max: 1},
            chatDisabled: true,
            function: (params) => setForm({...form, container: params.userInput}),
            path: "ask_lines"
        },
        ask_lines: {
			message: "How many lines of the log did you want to attach (max 100)?",
			function: (params) => {
                setForm({...form, lines: params.userInput});
                console.log("Form");
                console.log(form);
            },
			path: async (params) => {
                if (params.userInput)
				if (isNaN(Number(params.userInput))) {
					await params.injectMessage("The number of lines needs to be a number!");
					return;
				}
                if (Number(params.userInput) == 0 || Number(params.userInput) > 100 ) {
					await params.injectMessage("The number of lines needs to be more then 0 and 100 or less");
					return;
                }
                if (isCancelRequest(params.userInput)) return "start";
				return "get_logs";
			}
        },
        get_logs: {
            message: async(params) => {
                getLogs(application, resource, form["container"], form["lines"]).then( (result:LogEntry[]) => {
                    console.log(result)
                    setLogs(result);
                }).catch( (error) => {
                    return "Unexpected error: " + error.message;
                });
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
    <ChatBot options={options} flow={flow} />
    );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', { icon: 'fa-sharp fa-light fa-message fa-lg' });
})(window);
