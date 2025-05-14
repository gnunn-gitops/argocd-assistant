import { LogEntry } from "src/model/service";
import { getHeaders, Kinds } from "../util/util";

export const MAX_LINES = 250;

// Test if resource is a pod or something that has a PodSpec.
export function hasLogs(resource: any): boolean {
    return resource?.spec?.template?.spec?.containers || resource?.kind === Kinds.POD;
}

export const getLogs = async(application: any, pod: any, container: string, count: number):Promise<LogEntry[]> => {
    const params = new URLSearchParams({
        appNamespace: application.metadata.namespace,
        namespace: pod.metadata.namespace,
        podName: pod.metadata.name,
        container: container,
        tailLines: String(count),
        follow: "false",
        sinceSeconds: "0"
    }).toString();

    const url = "/api/v1/applications/" + application.metadata.name + "/logs?" + params;

    const request: RequestInfo = new Request(url, {
        credentials: 'include',
        method: 'GET',
        headers: getHeaders(application)
    });

    const response = await fetch(request);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';
    let index = 0;

    var results:LogEntry[] = [];

    // Since we use the `tailLines` parameter we don't actually need to count the lines
    // and could just read until done. However just leaving it in for now for
    // flexibility.
    while (index <= count) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        partialData += decoder.decode(value, { stream: true });
        const parts = partialData.split('\n');
        partialData = parts.pop() || '';

        for (const part of parts) {
            try {
                const jsonObject = JSON.parse(part);
                results.push(jsonObject as LogEntry);
                index++;
                if (index > count) break;
            } catch (e) {
                // Ignore incomplete JSON objects
                console.log(e);
            }
        }
    }

    return results;
}
