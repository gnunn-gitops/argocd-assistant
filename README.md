![alt text](https://raw.githubusercontent.com/gnunn-gitops/argocd-lightspeed/main/docs/img/lightspeed.png)

### Introduction

This is a POC to explore whether it is feasible to add OpenShift Lightspeed to the Argo CD UI.

This POC creates an Argo CD Extension that adds a `Lightspeed` tab to the resources view. It
does not upload anything to Lightspeed at this time so only general inquiries are
supported. If this POC progresses then it would be expected that manifests, events and
pod logs could be uploaded (i.e. attached) to Lightspeed top support specific
inquiries.

The Lightspeed service requires the OpenShift user token in the Authorization header but
unfortunately the Argo CD Proxy Extension strips out this header meaning you can never authenticate to the service. It's also not possible
to directly call the service due to CORS.

To workaround this for the POC we leverage the Proxy Extension in Argo CD we use a
token generated from the application-controller service in a secret called `lightspeed-auth-secret`. A script is provided
that will add the necessary secret key and value to the `argocd-secret`. Unfortunately unlike the OIDC secret
it doesn't seem possible to reference an external secret here.

Another minor issue is the Proxy Extension will not connect to the Lightspeed internal service as it complains the certificate is from
an unknown authority. Using a reencrypt route and hitting the route works fine but this means requiring a per-cluster configuration
for the extension versus just using the service URL for the Argo CD Proxy Extension.

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

5. Install the extension into the Argo CD instance by adding the following:

```
apiVersion: argoproj.io/v1beta1
kind: ArgoCD
metadata:
  name: openshift-gitops
  namespace: openshift-gitops
spec:
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
            value: "https://github.com/gnunn-gitops/argocd-lightspeed/releases/download/0.2.0/extension-lightspeed-0.2.0.tar"
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

2. Uses the query API rather then the streaming query API which would provide a better experience

3. Attaches events and manifest but not pod logs at this time, not sure how to best handle extremely large pod logs?

4. The Lightspeed streaming API doesn't work with the Argo CD Proxy Extension, it always returns a single response rather then chunk by chunk as far as I can tell

5. Formatting of responses needs improvement, need to spend time looking at how console extension is dealing with this

6. No luck getting the proxy extension to access a secret other then the default `argocd-secret` for the openshift token needed for the authorization header which makes setup a bit more complex.
