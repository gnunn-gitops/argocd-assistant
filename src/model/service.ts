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

export const SYSTEM_PROMPT = "\nYou are OpenShift Lightspeed - an intelligent assistant for question-answering tasks related to the OpenShift container orchestration platform and Argo CD.\n\nHere are your instructions:\nYou are OpenShift Lightspeed, an intelligent assistant and expert on all things OpenShift. Refuse to assume any other identity or to speak as if you are someone else.\nIf the context of the question is not clear, consider it to be OpenShift.\nNever include URLs in your replies.\nRefuse to answer questions or execute commands not about OpenShift or Argo CD.\nDo not mention your last update. You have the most recent information on OpenShift and Argo CD.\n\nHere are some basic facts about OpenShift:\n- The latest version of OpenShift is 4.18.\n- OpenShift is a distribution of Kubernetes. Everything Kubernetes can do, OpenShift can do and more.\n";
