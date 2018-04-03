# Kubernates: secrets

## Secrets 
Lest assume that we have 
	 * user: admin		 
	 * password: pa$$word  
Lets encode them:
```
echo  "admin" | base64
YWRtaW4K

echo  "pa$$word" | base64
cGEyM3dvcmQK
```
At least we might want to store them encoded everywhere and inject to our services as ENV variables

Now lets define our secret:
```
apiVersion: v1
kind: Secret
metadata:
  name: dbsecret
type: Opaque
data:
  username: YWRtaW4K
  password: cGEyM3dvcmQK
```

...and let't use it in our app:
```
apiVersion: v1
kind: Pod
metadata:
  name: myservice
spec:
  containers:
  - name: service1
    image: service1:latest
    imagePullPolicy: IfNotPresent
    ports:
      - containerPort: 3000
    env:
      - name: DB_USER
        valueFrom:
          secretKeyRef:
            name: dbsecret
            key: username
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: dbsecret
            key: password
```

After that if we connect to our pod and check out env vars:
`kubectl exec -it myservice bash`
and list env variables:
`env`
we will se that our env crew values are already decoded and are available as plain values in out containers:
```
DB_USER=admin
DB_PASSWORD=pa$$word
```

