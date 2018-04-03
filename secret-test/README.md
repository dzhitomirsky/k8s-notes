# Secret store example

## Architecture
Create secret store with db credentials encided in base64, pass them to service as env variable,
and check out that they were decoded correctly

## Step-by-step
* Evaluate docker env vars:
```bash
eval $(minikube docker-env)
```
* Buld **service1** 
```bash
cd service1
docker build -t service1 .
```
* Check encoded creds
```
echo  "admin" | base64
YWRtaW4K

echo  "pa$$word" | base64
cGE4NzQzMXdvcmQK
```
* Run your environment
```bash
kubectl create -f multyservice-deployment.yml
```
* Connect to running pods & check out decoded user & password
```
kubectl exec -it myservice bash
env | grep DB_USER
env | grep DB_PASSWORD

```
* Delete deployment
```bash
kubectl delete -f multyservice-deployment.yml
```