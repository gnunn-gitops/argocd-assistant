import { LogEntry } from "src/model/service";
import { getHeaders } from "../util/util";

export const getLogs = async(application: any, pod: any, container: string, count: number):Promise<LogEntry[]> => {
    const params = new URLSearchParams({
        appNamespace: application.metadata.namespace,
        namespace: pod.metadata.namespace,
        podName: pod.metadata.name,
        container: container,
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

    // const reader = response.body.getReader();
    // const decoder = new TextDecoder();
    // let lines: string[] = [];
    // let currentLine = "";
    // let linesRead = 0;

    // while (linesRead <= count) {
    //     const { done, value } = await reader.read();
    //     if (done) {
    //     if (currentLine) {
    //         lines.push(currentLine);
    //         linesRead++;
    //     }
    //     break;
    //     }

    //     const chunk = decoder.decode(value);
    //     for (const char of chunk) {
    //     if (char === '\n') {
    //         lines.push(currentLine);
    //         currentLine = "";
    //         linesRead++;
    //         if (linesRead >= 100) break;
    //     } else {
    //         currentLine += char;
    //     }
    //     }
    //     if (linesRead > count) break;
    // }

    // console.log("Logs");
    // console.log(lines);

    // return lines.slice(0,count);

}
