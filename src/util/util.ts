export const HttpHeader = {
    CONTENT_TYPE: 'Content-Type',
};

export const Protocol = {
    HTTP: 'http',
    HTTPS: 'https'
}

export const Kinds = {
    POD: 'Pod',
    REPLICA_SET: 'ReplicaSet',
    DEPLOYMENT: 'Deployment',
    STATEFUL_SET: 'StatefulSet',
    JOB: 'Job',
    ROLLOUT: 'Rollout'
}

export const ContentType = {
    APPLICATION_JSON: 'application/json',
    APPLICATION_XML: 'application/xml',
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
    APPLICATION_FORM_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM_DATA: 'multipart/form-data',
} as const;

// Handle anything that is a pod or has a PodSpec template.
export function getContainers(resource: any): string[] {
    var result: string[] = [];
    if (resource?.kind === Kinds.POD) {
        try {
            resource.spec.containers.forEach((container) => {
                result.push(container.name);
            })
        } catch (error) {
            console.log("This is not a pod")
        }
    } else if (resource?.spec?.template?.spec?.containers) {
        try {
            resource.spec.template.spec.containers.forEach((container) => {
                result.push(container.name);
            })
        } catch (error) {
            console.log("Invalid pod specification")
        }
    }
    return result;
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

export function convertToHTML(response: string, convertor: any): string {
    return convertor.makeHtml(
        response.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;"));
}
