# Deploys by copying js file into pod, pod must have had extension previously installed using dev version of package

NAMESPACE=openshift-gitops
LABEL_NAME=openshift-gitops-server

# NAMESPACE=gitops
# LABEL_NAME=argocd-server

yarn run build-dev

POD=$(oc get pod -l app.kubernetes.io/name=$LABEL_NAME -o jsonpath="{.items[0].metadata.name}" -n $NAMESPACE)

echo "Copying to pod $POD"

oc cp dist/resources/extensions-lightspeed/extensions-lightspeed.js $NAMESPACE/$POD:/tmp/extensions/resources/extensions-lightspeed/extensions-lightspeed.js
