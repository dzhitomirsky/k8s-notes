# Multiservice example

## Architecture
* Create 2 deployments of service1 & service2
* Each deployment should have 2 replicas
* Create a service for each deployment
* Configure nginx-ingress to proxy to each service

## Step-by-step
* Evaluate docker env vars:
```bash
eval $(minikube docker-env)
```
* Enable *ingress* addon
```bash
minikube addons enable ingress
```
* Buld **service1** & **service2**
```bash
cd service1
docker build -t service1 .

cd service2
docker build -t service2 .
```
* Run your environment
```bash
kubectl create -f multyservice-deployment.yml
```
* Check that it works (ingress in k8s works via https by default)
```
curl --insecure https://$(minikube ip)/foo/api/sayHello
curl --insecure https://$(minikube ip)/bar/api/sayHello
```
* Delete deployment
```bash
kubectl delete -f multyservice-deployment.yml
```