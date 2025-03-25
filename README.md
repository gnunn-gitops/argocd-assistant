WIP to add Lightspeed to Argo CD UI
```
spec:
  server:
    ...
    initContainers:
      - env:
          - name: EXTENSION_URL
            value: 'https://gexperts.com/files/extension-0.1.0.tar'
        image: 'quay.io/argoprojlabs/argocd-extension-installer:v0.0.8'
        name: extension-lightspeed
        securityContext:
          allowPrivilegeEscalation: false
        volumeMounts:
          - mountPath: /tmp/extensions/
            name: extension-lightspeed
    volumeMounts:
      - mountPath: /tmp/extensions/
        name: extension-lightspeed
    volumes:
      - emptyDir: {}
        name: extension-lightspeed
```
