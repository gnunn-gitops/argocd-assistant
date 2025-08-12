export enum Provider {
    AZURE = "Azure",
    OPENSHIFT_AI = "red_hat_openshift_ai"
}

export enum Model {
    GPT4 = "gpt-4"
}

export type Events = {
    apiVersion: string,
    items: any[]
}

export enum AttachmentTypes {
    EVENTS = 'event',
    LOG = 'log',
    MANIFEST = 'api object'
}

export type Attachment = {
    attachment_type: AttachmentTypes,
    content_type: string,
    content: string
}

export type QueryRequest = {
    attachments?: Attachment[],
    conversation_id: string,
    model?: Model,
    provider?: Provider,
    query: string,
}

export type QueryResponse = {
    status: number,
    conversationId: string,
    response: string,
}

// Copied from Argo CD UI code
export interface LogEntry {
    content: string;
    timeStamp: string;
    // first field is inferred on the fly and indicates first log line received from backend
    first?: boolean;
    last: boolean;
    timeStampStr: string;
    podName: string;
}