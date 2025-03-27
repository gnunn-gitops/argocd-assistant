# Deploys by copying js file into pod, pod must have had extension previously installed using dev version of package

yarn run build-dev

POD=$(oc get pod -l app.kubernetes.io/name=openshift-gitops-server -o jsonpath="{.items[0].metadata.name}" -n openshift-gitops)

echo "Copying to pod $POD"

oc cp dist/resources/extensions-lightspeed/extensions-lightspeed.js openshift-gitops/$POD:/tmp/extensions/resources/extensions-lightspeed/extensions-lightspeed.js
