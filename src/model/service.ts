export enum Provider {
    AZURE = "Azure"
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
    model: Model,
    provider: Provider,
    query: string,
    system_prompt: string
}

export type QueryResponse = {
    conversationId: string,
    response: string
}
