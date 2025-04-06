SECRET_NAME="argocd-secret"

oc get secret $SECRET_NAME -o yaml -n openshift-gitops | oc neat > argocd-secret.yaml

ORIGINAL_TOKEN_VALUE=$(oc get secret $SECRET_NAME -o "jsonpath={.data.lightspeed\.auth\.header}" -n openshift-gitops | base64 -d)

TOKEN="Bearer $(oc get secret lightspeed-auth-secret -o "jsonpath={.data.token}" -n openshift-gitops | base64 -d )"

echo "=========== BEARER HEADER ==========="
echo $TOKEN
echo "====================================="

#TOKEN="Bearer $(oc whoami -t)"

TOKEN=$(echo -n $TOKEN | base64 -w -0)

if [ ! -z "$ORIGINAL_TOKEN_VALUE" -a "$ORIGINAL_TOKEN_VALUE)" != " " ]; then
    OP="replace"
else
    OP="add"
fi

echo "Updating secret, using operation: $OP"

kubectl patch secret $SECRET_NAME -n openshift-gitops --type=json \
  -p='[{
    "op" : "add" ,
    "path" : "/data/lightspeed.auth.header" ,
    "value" : '$TOKEN'
  }]'
