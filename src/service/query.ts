import { getHeaders } from "../util/util";
import { QueryRequest } from "../model/service";
//import { marked, Renderer } from "marked";

// export const query = async (query: QueryRequest, application: any): Promise<QueryResponse> => {
//     const url: string = "/extensions/lightspeed/v1/query"

//     const request: RequestInfo = new Request(url, {
//         credentials: 'include',
//         method: 'POST',
//         headers: getHeaders(application, false),
//         body: JSON.stringify(query)
//     })

//     const response = await fetch(request);
//     var result: QueryResponse;
//     if (response.headers.has(HttpHeader.CONTENT_TYPE) && response.headers.get(HttpHeader.CONTENT_TYPE) == ContentType.APPLICATION_JSON) {
//         const body = await response.json();
//         console.log("Body");
//         console.log(body);
//         if (response.status == 200) {
//             result = {
//                 status: response.status,
//                 conversationId: body.conversationId,
//                 response: body.response
//             }
//         } else {
//             result = {
//                 status: response.status,
//                 conversationId: body.conversationId,
//                 response: body.detail
//             }
//         }
//     } else {
//         const message: string = await response.text();
//         result = {
//             status: response.status,
//             conversationId: query.conversation_id,
//             response: message
//         }
//     }
//     return result;
// }

export const queryStream = async (query: QueryRequest, application: any, params: any) => {

    //const renderer: Renderer = new marked.Renderer();

    const url: string = "/extensions/lightspeed/v1/streaming_query"

    const request: RequestInfo = new Request(url, {
        credentials: 'include',
        method: 'POST',
        headers: getHeaders(application, true),
        body: JSON.stringify(query)
    })

  try {
    const response = await fetch(request);

    if (!response.ok && !response.body) {
        await params.streamMessage("Unexpected error (" + response.status + "): No message received from service");
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let text = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      text += chunk;
      // Process the received chunk (e.g., display it, parse it, etc.)
      await params.streamMessage(text);
    }

  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
}
