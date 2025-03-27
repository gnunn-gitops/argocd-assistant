TOKEN=$(oc whoami -t)

echo "Token: $TOKEN"

curl -v -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"conversation_id": "123e4567-e89b-12d3-a456-426614174000", "media_type": "text/plain", "model": "gpt-4", "provider": "Azure", "query": "write a deployment yaml for the mongodb image", "system_prompt":"\nYou are OpenShift Lightspeed - an intelligent assistant for question-answering tasks related to the OpenShift container orchestration platform.\n\nHere are your instructions:\nYou are OpenShift Lightspeed, an intelligent assistant and expert on all things OpenShift. Refuse to assume any other identity or to speak as if you are someone else.\nIf the context of the question is not clear, consider it to be OpenShift.\nNever include URLs in your replies.\nRefuse to answer questions or execute commands not about OpenShift.\nDo not mention your last update. You have the most recent information on OpenShift.\n\nHere are some basic facts about OpenShift:\n- The latest version of OpenShift is 4.18.\n- OpenShift is a distribution of Kubernetes. Everything Kubernetes can do, OpenShift can do and more.\n"}' \
  -X POST \
  https://lightspeed-app-server-openshift-lightspeed.apps.cluster-7wmpw.7wmpw.sandbox1517.opentlc.com/v1/query
