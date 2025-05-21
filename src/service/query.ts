import { convertToHTML, getHeaders } from "../util/util";
import { QueryRequest } from "../model/service";
import { marked, Renderer } from "marked";

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

    const renderer: Renderer = new marked.Renderer();

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
      await params.streamMessage(convertToHTML(text, renderer));
    }

  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
}




// type QueryResponseStart = {
//     event: 'start';
//     data: {
//         conversation_id: string;
//     };
// };

// type QueryResponseToken = {
//     event: 'token';
//     data: {
//         id: number;
//         token: string;
//     };
// };

// type QueryResponseError = {
//     event: 'error';
//     data: {
//         response: string;
//         cause: string;
//     };
// };

// type QueryResponseEnd = {
//     event: 'end';
//     data: {
//         referenced_documents: Array<ReferencedDoc>;
//         truncated: boolean;
//     };
// };

// type QueryResponse =
//     | QueryResponseStart
//     | QueryResponseToken
//     | QueryResponseError
//     | QueryResponseEnd;

// type ReferencedDoc = {
//     doc_title: string;
//     doc_url: string;
// };

// export const submitQueryStream = async (query: QueryRequest, application: any, params) => {

//     const url: string = "/extensions/lightspeed/v1/streaming_query"

//     const request: RequestInfo = new Request(url, {
//         credentials: 'include',
//         method: 'POST',
//         headers: getHeaders(application, true),
//         body: JSON.stringify(query)
//     })

//     fetch(request).then((response) => {
//         const decoder = new TextDecoder();
//         const reader = response.body.getReader();
//         let responseText = '';
//         reader.read().then(({ done, value }) => {
//             if (done) return response;
//             const text = decoder.decode(value);
//             console.log("Conversation done " + done);
//             console.log(text);
//             text
//                 .split('\n')
//                 .filter((s) => s.startsWith('data: '))
//                 .forEach((s) => {
//                     const line = s.slice(5).trim();
//                     let json: QueryResponse;
//                     try {
//                         json = JSON.parse(line);
//                     } catch (error) {
//                         // eslint-disable-next-line no-console
//                         console.error(`Failed to parse JSON string "${line}"`, error);
//                     }
//                     if (json && json.event && json.data) {
//                         if (json.event === 'start') {
//                             console.log("Start Response");
//                         } else if (json.event === 'token') {
//                             console.log("Token Response");
//                             responseText += json.data.token;
//                             params.streamMessage(responseText);
//                         } else if (json.event === 'end') {
//                             console.log("End Response");
//                         } else {
//                             // eslint-disable-next-line no-console
//                             console.error(`Unrecognized event "${json.event}" in response stream`);
//                         }
//                     }
//                 });
//         })
//     })
// }
