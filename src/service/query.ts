import {QueryRequest, QueryResponse} from "../model/service";

const PROTOCOL = "https";

function getExtensionQueryURL(): string {
    console.log(location.host)
    return PROTOCOL + "://" + location.host + "/extensions/lightspeed/v1/query"
}

// function getLightSpeedHost(): string {
//     return "lightspeed-app-server-openshift-lightspeed" + location.host.substring(location.host.indexOf(".apps"))
// }

function getHeaders(token: string, application:any): Headers {

    console.log(application);

    const applicationName = application?.metadata?.name || "";
    const applicationNamespace = application?.metadata?.namespace || "";
    const project = application?.spec?.project || "";

    const headers: Headers = new Headers({
        'Authorization': "Bearer " + btoa(token),
        'Content-Type': "application/json",
        'Accept': 'application/json',
        'Origin':'https://' + location.host,
        "Argocd-Application-Name": `${applicationNamespace}:${applicationName}`,
        "Argocd-Project-Name": `${project}`,
    });
    return headers;
}

export function submitQuery(query:QueryRequest, token: string, application: any): Promise<QueryResponse> {
    //const url: string = PROTOCOL + "://" + getLightSpeedHost() + "/v1/query"
    const url: string = getExtensionQueryURL();

    const request: RequestInfo = new Request(url, {
        credentials: 'include',
        method: 'POST',
        headers: getHeaders(token, application),
        body: JSON.stringify(query)
      })

    return fetch(request)
      // the JSON body is taken from the response
      .then(res => res.json())
      .then(res => {
        // The response has an `any` type, so we need to cast
        // it to the `User` type, and return it from the promise
        return res as QueryResponse[]
      }) as Promise<QueryResponse>;
  }
