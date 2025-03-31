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

To workaround this for the POC we leverage the Proxy Extension in Argo CD and hardcode a user token obtained via `oc whoami -t`. If this
POC were to productized either Lightspeed would need to accept an Argo CD token, which would be ideal, or a
service account token with limited permissions could be provided.

Another minor issue is the Proxy Extension will not connect to the Lightspeed internal service as it complains the certificate is from
an unknown authority. Using a reencrypt route and hitting the route works fine but this means requiring a per-cluster configuration
versus just using the service URL for the Argo CD Proxy Extension.

### Installing POC

To install the POC follow these steps:

1. Request an OpenShift Lightspeed instance from the Red Hat Product Demo system.

2. Install the OpenShift GitOps operator into this instance, the POC was tested with 1.15 and 1.16 versions of OpenShift GitOps

3. Login into the OpenShift instance with the `oc` CLI and generate a token using `oc whoami -t`

4. Update `openshiftmanifests/argo-gitops.yaml`, change `$lightspeed.authorization.token` to be `Bearer <your-token>`. Note I've tried to get
Argo CD to read the token from either the `argocd-secrets` secret or via a new secret without success. I'm not sure if the space in the value
is causing issues, needs more investigation.

5. Update `openshiftmanifests/argo-gitops.yaml` again on line 14 to change the Lightspeed `.apps.xxxx` in the extension definition to match your RHDP instance.

6. Deploy the manifests needed via `kustomize build manifests/argocd | oc apply -f -`

7. Wait for the GitOps pods to redeploy

8. Login into OpenShift GitOps using the `admin` credential provided by RHDP

9.
