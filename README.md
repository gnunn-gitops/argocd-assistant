![alt text](https://raw.githubusercontent.com/gnunn-gitops/argocd-lightspeed/main/docs/img/lightspeed.png)

<!--ARCADE EMBED START--><div style="position: relative; padding-bottom: calc(56.25% + 41px); height: 0; width: 100%;"><iframe src="https://demo.arcade.software/QIs0UjKxEX5K5eMgiZCX?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true" title="OpenShit Lightspeed with Argo CD" frameborder="0" loading="lazy" webkitallowfullscreen mozallowfullscreen allowfullscreen allow="clipboard-write" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; color-scheme: light;" ></iframe></div><!--ARCADE EMBED END-->

### Introduction

This is a POC to explore whether it is feasible to add OpenShift Lightspeed to the Argo CD UI.

This POC creates an Argo CD Extension that adds a `Lightspeed` tab to the resources view. it automatically adds manifests and events to the query context and logs can be added through a guided conversation flow.

The Lightspeed service requires the OpenShift user token in the Authorization header.

To mansge this for the POC we leverage the Proxy Extension in Argo CD we use a
token generated from the application-controller service in a secret called `lightspeed-auth-secret`. A script is provided
that will add the necessary secret key and value to the `argocd-secret`. Unfortunately unlike the OIDC secret
it doesn't seem possible to reference an external secret here.

### Installing POC on Existing Cluster

Note you muse have OpenShift Lightspeed installed and working on the cluster.

1. In the `openshift-lightspeed` namespace create a new networkpolicy to allow the Argo CD extension to talk to the Lightspeed service.
Note add any additional Argo CD instances you want to use the extension for to the NetworkPolicy.

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  labels:
    app.kubernetes.io/component: application-server
    app.kubernetes.io/name: lightspeed-service-api
    app.kubernetes.io/part-of: openshift-lightspeed
  name: lightspeed-app-server-gitops
  namespace: openshift-lightspeed
spec:
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: openshift-gitops
      podSelector:
        matchExpressions:
        - key: app.kubernetes.io/name
          operator: In
          values:
          - openshift-gitops-server
    ports:
    - port: 8443
      protocol: TCP
  podSelector:
    matchLabels:
      app.kubernetes.io/component: application-server
      app.kubernetes.io/managed-by: lightspeed-operator
      app.kubernetes.io/name: lightspeed-service-api
      app.kubernetes.io/part-of: openshift-lightspeed
  policyTypes:
  - Ingress
```

2. Lightspeed requires an OpenShift token, in the console it uses the user's token but Argo CD UI does not have this token. As a result
we will use the `application-controller` service account to create a token. To do so create the following secret:

```
apiVersion: v1
kind: Secret
metadata:
  name: lightspeed-auth-secret
  annotations:
    kubernetes.io/service-account.name: openshift-gitops-argocd-application-controller
type: kubernetes.io/service-account-token
```

3. You will need to copy the token into the argocd-secret with the key `argocd-secret`. If you want to do this
in a GitOps way you an use ExternalSecrets to take the secret from step 2 and insert it into the existing `argocd-secret`

4. Add a ClusterRoleBinding to allow the `application-controller` service account to call the Lightspeed API, again adjust as needed
for your Argo CD instance(s).

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: gitops-cluster-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: openshift-gitops-argocd-application-controller
  namespace: openshift-gitops
```

5. The extension talks to the Lightspeed Kubernetes service, you will need the Service CA for the Argo CD proxy extension to trust it.

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-service-cabundle
  annotations:
    service.beta.openshift.io/inject-cabundle: true
data: {}
```

6. Install the extension into the Argo CD instance by adding the following in the appropriate spots:

```
apiVersion: argoproj.io/v1beta1
kind: ArgoCD
metadata:
  name: openshift-gitops
  namespace: openshift-gitops
spec:
  rbac:
    ...
    p, role:readonly, extensions, invoke, lightspeed, allow
  extraConfig:
    extension.config.lightspeed: |
      connectionTimeout: 2s
      keepAlive: 360s
      idleConnectionTimeout: 360s
      maxIdleConnections: 30
      services:
      - url: https://lightspeed-app-server.openshift-lightspeed.svc.cluster.local:8443
        headers:
        - name: Authorization
          value: '$lightspeed.auth.header'
  server:
    annotations:
      # Needed to support longer queries to lightspeed
      haproxy.router.openshift.io/timeout: 360s
    extraCommandArgs:
      - "--enable-proxy-extension"
    initContainers:
      - env:
          - name: EXTENSION_URL
            value: "https://github.com/gnunn-gitops/argocd-lightspeed/releases/download/0.4.1/extension-lightspeed-0.4.1.tar"
        image: "quay.io/argoprojlabs/argocd-extension-installer:v0.0.8"
        name: extension-lightspeed
        securityContext:
          allowPrivilegeEscalation: false
        volumeMounts:
          - name: extensions
            mountPath: /tmp/extensions/
    volumeMounts:
      - mountPath: /etc/pki/tls/certs/service-ca.crt
        name: config-service-cabundle
        subPath: service-ca.crt
    volumes:
      - configMap:
          name: config-service-cabundle
          defaultMode: 420
        name: config-service-cabundle
        optional: true
```

### Installing POC on RHDP Lightspeed Cluster

To install the POC follow these steps:

1. Request an OpenShift Lightspeed instance from the Red Hat Product Demo system.

2. Install the OpenShift GitOps operator into this instance, the POC was tested with 1.15 and 1.16 versions of OpenShift GitOps

3. Login into the OpenShift instance with the `oc` CLI and generate a token using `oc whoami -t`

4. Update `openshiftmanifests/argo-gitops.yaml` again on line 14 to change the Lightspeed `.apps.xxxx` in the extension definition to match the wildcard your RHDP instance is using.

5. Deploy the manifests needed via `kustomize build manifests/argocd | oc apply -f -`

6. Wait for the GitOps pods to redeploy

7. Run the command `./create-light-speed-secret.sh` which will add a new key, `lightspeed.auth.header`, to `argocd-secrets` in the `openshift-gitops` namespace.

8. Login into OpenShift GitOps using the `admin` credential provided by RHDP

9. Go into the `product-catalog` application, click on one of the resources in the tree and select the `Lightspeed` tab and enter a query. Note the UI is currently terrible with hourglass or error reporting, you can use the Developer Tools in the browser to see if there was an issue if no response is returned.

# Limitations

This POC has a few limitations some of which were mentioned in the intro:

1. Lightspeed requires an OpenShift user which is not something that Argo CD has any concept of. Working around it by using a token from a service account but longer term would be nice if Lightspeed could accept an Argo CD token and API URL for validation

2. When MCP comes into play for Lightspeed I'm not sure there is a way to pass the Argo CD user token with the Argo CD extension since it gets scrubbed (https://github.com/argoproj/argo-cd/blob/master/server/extension/extension.go#L511). In the browser the Argo CD token is an http protected cookie so the extension code cannot access it (which makes sense).
