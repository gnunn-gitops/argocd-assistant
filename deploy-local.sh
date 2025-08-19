# Deploys by copying js file into pod, pod must have had extension previously installed using dev version of package

# NAMESPACE=openshift-gitops
# LABEL_NAME=openshift-gitops-server

NAMESPACE=demo-gitops
LABEL_NAME=argocd-server

VERSION=$(node -p -e "require('./package.json').version")

# yarn run build-dev
yarn run build

POD=$(oc get pod -l app.kubernetes.io/name=$LABEL_NAME -o jsonpath="{.items[0].metadata.name}" -n $NAMESPACE)

echo "Deleting existing version of extension"

oc exec -it -n ${NAMESPACE} ${POD} -c argocd-server -- bash -c "rm -rf /tmp/extensions/resources/extensions-assistant/*"

echo "Make sure directory exists"

oc exec -it -n ${NAMESPACE} ${POD} -c argocd-server -- bash -c "mkdir -p /tmp/extensions/resources"

echo "Copying to pod $POD"

oc cp dist/resources/extensions-assistant/extension-assistant-bundle-${VERSION}.min.js $NAMESPACE/$POD:/tmp/extensions/resources/extension-assistant-bundle-${VERSION}.min.js

# oc cp dist/resources/extensions-lightspeed/extensions-lightspeed.js $NAMESPACE/$POD:/tmp/extensions/resources/extensions-lightspeed/extensions-lightspeed.js
