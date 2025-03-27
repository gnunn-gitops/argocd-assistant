WIP to add Lightspeed to Argo CD UI, unfortunately this does not appear to be feasible at this time.

The Lightspeed service requires the OpenShift user token in the Authorization header but
unfortunately the Argo CD Proxy Extension strips out this header meaning you can never authenticate to the service. It's not possible
to directly call the service due to CORS.

Either a change to the Lightspeed service or a change to the Argo CD Proxy Extension is required to make this work.

Another minor issue is the Proxy Extension will not connect to the Lightspeed internal service as it complains the certificate is from
an unknown authority. Using a reencrypt route and hitting the route works fine but this means requiring a per-cluster configuration
versus just using the service URL for the Argo CD Proxy Extension.
