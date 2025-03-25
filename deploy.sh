# Small script that deploys the extension.
# Pushes the tar file to a personal web site and then restarts the
# server pod which will download and extract the extension again
# Todo: Figure out how to do live coding with extension
echo "Enter user: "
read -p "" USER
echo "Enter password: "
read -s PASSWORD

yarn run package-dev

# Host to use for extension during development, personal host
export HOST=ftp.gexperts.com

echo "Connecting with $USER@$HOST"

# Upload extension to web server
lftp -u $USER,$PASSWORD $HOST <<EOF
set ssl:verify-certificate no
set ftp:ssl-protect-data true
cd public_html/files
put dist/extension-lightspeed-0.1.0.tar
exit
EOF

# Recreate pod to redeploy extension
oc rollout restart deploy openshift-gitops-server -n openshift-gitops
oc rollout status deploy  openshift-gitops-server -n openshift-gitops
