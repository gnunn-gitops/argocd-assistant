import { QueryRequest, QueryResponse} from "../model/service";

const PROTOCOL = "https";

function getExtensionQueryURL(): string {
    console.log(location.host)
    return PROTOCOL + "://" + location.host + "/extensions/lightspeed/v1/query"
}

// function getLightSpeedHost(): string {
//     return "lightspeed-app-server-openshift-lightspeed" + location.host.substring(location.host.indexOf(".apps"))
// }

function getHeaders(application: any): Headers {

    console.log(application);

    const applicationName = application?.metadata?.name || "";
    const applicationNamespace = application?.metadata?.namespace || "";
    const project = application?.spec?.project || "";

    const headers: Headers = new Headers({
        'Content-Type': "application/json",
        'Accept': 'application/json',
        'Origin': 'https://' + location.host,
        "Argocd-Application-Name": `${applicationNamespace}:${applicationName}`,
        "Argocd-Project-Name": `${project}`,
    });
    return headers;
}

export function submitQuery(query: QueryRequest, application: any): Promise<QueryResponse> {
    //const url: string = PROTOCOL + "://" + getLightSpeedHost() + "/v1/query"
    const url: string = getExtensionQueryURL();

    const request: RequestInfo = new Request(url, {
        credentials: 'include',
        method: 'POST',
        headers: getHeaders(application),
        body: JSON.stringify(query)
    })

    return fetch(request)
        // the JSON body is taken from the response
        .then(res => res.json())
        .then(res => {
            // The response has an `any` type, so we need to cast
            // it to the `User` type, and return it from the promise
            return res as QueryResponse
        }) as Promise<QueryResponse>;
}

// type QueryResponseStart = {
//     event: 'start';
//     data: {
//       conversation_id: string;
//     };
//   };

//   type QueryResponseToken = {
//     event: 'token';
//     data: {
//       id: number;
//       token: string;
//     };
//   };

//   type QueryResponseError = {
//     event: 'error';
//     data: {
//       response: string;
//       cause: string;
//     };
//   };

//   type QueryResponseEnd = {
//     event: 'end';
//     data: {
//       referenced_documents: Array<ReferencedDoc>;
//       truncated: boolean;
//     };
//   };

//   type QueryResponse =
//     | QueryResponseStart
//     | QueryResponseToken
//     | QueryResponseError
//     | QueryResponseEnd;

// type ReferencedDoc = {
//     doc_title: string;
//     doc_url: string;
// };

// export const submitQueryStream = async (query: QueryRequest, application: any, params) => {

//     const url: string = getExtensionQueryURL();

//     const request: RequestInfo = new Request(url, {
//         credentials: 'include',
//         method: 'POST',
//         headers: getHeaders(application),
//         body: JSON.stringify(query)
//     })

//     // fetch(request)
//     // .then(async (response) => {
//     //     // response.body is a ReadableStream
//     //     const reader = response.body.getReader();
//     //     const decoder = new TextDecoder();

//     // });

//     fetch(request).then((response) => {
//         const decoder = new TextDecoder();
//         const reader = response.body.getReader();
//         let responseText = '';
//         reader.read().then(({done, value}) => {
//             if (done) return response;
//             const text = decoder.decode(value);
//             console.log(text);
//             text
//             .split('\n')
//             .filter((s) => s.startsWith('data: '))
//             .forEach((s) => {
//               const line = s.slice(5).trim();
//               let json: QueryResponse;
//               try {
//                 json = JSON.parse(line);
//               } catch (error) {
//                 // eslint-disable-next-line no-console
//                 console.error(`Failed to parse JSON string "${line}"`, error);
//               }
//               if (json && json.event && json.data) {
//                 if (json.event === 'start') {

//                 } else if (json.event === 'token') {
//                   responseText += json.data.token;
//                   params.streamMessage(responseText);
//                 } else if (json.event === 'end') {

//                 } else {
//                   // eslint-disable-next-line no-console
//                   console.error(`Unrecognized event "${json.event}" in response stream`);
//                 }
//               }
//             });
//        })
//     })
// }
