![alt text](https://raw.githubusercontent.com/gnunn-gitops/argocd-lightspeed/main/docs/img/lightspeed.png)

### Introduction

This is an MVP of adding an AI Assistant Chatbot to the Argo CD UI via an extension. It currently uses llama-stack as the backend since this enables the
future use of tools such as MCP servers however at the moment it has only been tested with an inference engine using the Agent API.

This MVP creates an Argo CD Extension that adds an `Assistant` tab to the resources view, it automatically adds manifests and events to the
query context and logs can be added through a guided conversation flow.

To call llama-stack this is uses the [Argo CD Proxy Extension](https://argo-cd.readthedocs.io/en/stable/developer-guide/extensions/proxy-extensions) feature to avoid CORS issues.

### Installing MVP in Argo CD

*Prerequistes*: You must have llama-stack installed and configured with at least one inference engine.

Install the extension into the Argo CD instance by adding the following in the appropriate spots, note here we are using the Argo CD Operator but feel free to adapt it for the argcd-cm ConfigMap if you have deployed Argo CD using the Helm chart:

```
apiVersion: argoproj.io/v1beta1
kind: ArgoCD
metadata:
  name: openshift-gitops
  namespace: openshift-gitops
spec:
  rbac:
    ...
    # This is needed to allow the extensiont to communicate with the proxy-extension
    # defined in extraConfig. Note the name `assistant` must match the proxy-extension
    # name.
    p, role:readonly, extensions, invoke, assistant, allow
  extraConfig:
    # Define the extension end point
    extension.config.assistant: |
      connectionTimeout: 2s
      keepAlive: 360s
      idleConnectionTimeout: 360s
      maxIdleConnections: 30
      services:
        # Note if you use HTTPS it needs to be a valid certificate or the CA
        # needs to be installed in the server component otherwise the
        # Argo CD Proxy Extension will fail
      - url: http://llamastack.llamastack.svc.cluster.local:8321
  server:
    # Enabled proxy extensions in the server component
    extraCommandArgs:
      - "--enable-proxy-extension"
    # Install the extension, update the x.y.z version to match the latest
    initContainers:
      - env:
          - name: EXTENSION_URL
            value: "https://github.com/gnunn-gitops/argocd-assistant/releases/download/0.4.1/extension-asistant-x.y.z.tar"
        image: "quay.io/argoprojlabs/argocd-extension-installer:v0.0.8"
        name: extension-assistant
        securityContext:
          allowPrivilegeEscalation: false
        volumeMounts:
          - name: extensions
            mountPath: /tmp/extensions/
    volumes:
      - name: extensions
        emptyDir: {}
```

# Limitations

This MVP has some limitations as follows:

1. It currently doesn't support defining the llama-stack client configuration to specify model, tools, etc. It just grabs the first model available with a simple client configuration. In the future this will be setup to be passed as a Secret.

2. When #1 is resolved, it's important to note that the Argo CD Proxy Extension does not have
the ability to pass the Argo CD token to back-ends, IMHO this will be needed to leverage MCP
securely since you want MCP access to mirror the permissions of the current user.

3. The Go Reverse Proxy the Argo CD Proxy Extension uses is not configurable and OOTB doesn't support streaming, this can be worked-around by the extension setting the ContentLength header to
-1 but ideally this should be configurable in the proxy extension definition.

