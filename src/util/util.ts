const POD_KIND = "Pod";

// export const CONTENT_TYPE:string = "Content-Type";
// export const APPLICATION_JSON:string = "application/json"

export const HttpHeader = {
  CONTENT_TYPE: 'Content-Type',
};

export const Protocol = {
    HTTP: 'http',
    HTTPS: 'https'
}

export const ContentType = {
  APPLICATION_JSON: 'application/json',
  APPLICATION_XML: 'application/xml',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  APPLICATION_FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM_DATA: 'multipart/form-data',
} as const;

//export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export function getContainers(pod: any): string[] {
    console.log(pod);
    var result: string[] = [];
    try {
        pod.spec.containers.forEach( (container) => {
            result.push(container.name);
        })
    } catch (error) {
        console.log("This is not a pod")
    }
    return result;
}

export function isPod(resource: any): boolean {
    return (resource?.kind === POD_KIND);
}

export function isAttachRequest(input: string): boolean {
    return input.toUpperCase().localeCompare('ATTACH', undefined, { sensitivity: 'base' }) == 0;
}

export function isCancelRequest(input: string): boolean {
    return input.toUpperCase().localeCompare('CANCEL', undefined, { sensitivity: 'base' }) == 0 ||
           input.toUpperCase().localeCompare('QUIT', undefined, { sensitivity: 'base' }) == 0 ||
           input.toUpperCase().localeCompare('EXIT', undefined, { sensitivity: 'base' }) == 0;
}


export function getHeaders(application: any): Headers {

    console.log(application);

    const applicationName = application?.metadata?.name || "";
    const applicationNamespace = application?.metadata?.namespace || "";
    const project = application?.spec?.project || "";

    const headers: Headers = new Headers({
        'Content-Type': ContentType.APPLICATION_JSON,
        'Accept': ContentType.APPLICATION_JSON,
        'Origin': 'https://' + location.host,
        "Argocd-Application-Name": `${applicationNamespace}:${applicationName}`,
        "Argocd-Project-Name": `${project}`,
    });
    return headers;
}
