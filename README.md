# Kubernates first steps

## Glossary
* A **Pod** is a Kubernetes abstraction that represents a group of one or more application containers (such as Docker), and some shared resources for those containers. When we create a Deployment on Kubernetes, that Deployment creates Pods with containers inside them.
* A **Node** is a worker machine in Kubernetes and may be either a virtual or a physical machine, depending on the cluster. Each **Node** is managed by the Master. A **Node** can have multiple **pods**
* **Deployment** is a building block that can be used to create and manage a group of pods. Deployments can be for scaling horizontally or ensuring availability. It is an abstraction that controlls updates of pods & pod replicas.
* A **Service** in Kubernetes is an abstraction which defines a logical set of Pods and a policy by which to access them. Services enable a loose coupling between dependent Pods.
A **Service** routes traffic across a set of Pods. Services are the abstraction that allow pods to die and replicate in Kubernetes without impacting your application. Discovery and routing among dependent Pods (such as the frontend and backend components in an application) is handled by Kubernetes Services.

## Installation and configuration
* install kubectl (https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl)
to check correct installation by running
`cubctl version`
* install minikube & required virtualization driver () (https://github.com/kubernetes/minikube)
* check if minikube is installed properly, run
```
	minikube version
```
* run minikube `minikube start` you can config vm driver by setting --vm-driver (e.g. I use --vm-driver hyperkit)
`minikube start --vm-driver hyperkit`
* check cluster info `kubectl cluster-info`, you will see smth. like:
```
	Kubernetes master is running at https://192.168.64.2:8443

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```
* check number of running nodes `kubectl get nodes`, you will see smth. like:
```
NAME       STATUS    ROLES     AGE       VERSION
minikube   Ready     <none>    46m       v1.9.4
```

## First deployment
* Deploy a container: (image-pull-policy)
```
kubectl run <deployment_name> --image <imagename:tag> --port <exposed port> --env="env_var_name=value" --replicas=<number of replicas> --image-pull-policy='IfNotPresent' 
```

e.g:
`kubectl run myservice --image service1:latest --port 3000 --image-pull-policy='IfNotPresent'`

* check list of deployments:
`kubectl get deployments`
* pod is isolated inside the kubernates cluster, to get to the inner api you have to use proxy:
`kubectl proxy`
it will run a proxy on 8001
* run `kubectl get pods` (i.e. `kubectl get pods -o go-template --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'`)
to get list (in our case name) of running pods
* The API server will automatically create an endpoint for each pod, based on the pod name, that is also accessible through the proxy. So to reach our deployed container, curl:
`curl http://localhost:8001/api/v1/proxy/namespaces/default/pods/$POD_NAME`
it will request to `/` of the deployed service
* run `kubectl describe <one of: pods, nodes, deployments>` for more detailed pods info, e.g. statuses, containers etc.
* get logs of the pod:
`kubernates logs <pod name, e.g. service1-7ff765bcfc-79kjq>`
* list pod's env vars:
`kubectl exec $POD_NAME env`
* excuse bash command vs a container in pods:
`kubectl exec -ti $POD_NAME bash`
if the container name is omitted - the first by default will be taken, to specify exact container with `-c` option, e.g. 
`kubectl exec -it $POD_NAME -c service1 bash`
* inside isolated kubernates network you can reach to the container api via port, described in a deployment (--port option)

## Exposing the application
* list running services (A Service called kubernetes that is created by default when minikube starts the cluster.)
`kubectl get services`
*  expose our deployment as new service with a port 8080
`kubectl expose deployment/myservice --type="NodePort" --port 3000`
(on normal installation (not minikube) you can use 'LoadBalancer' type)
* get info about a service:
`kubectl describe services/myservice`
we are interested in 
`NodePort:                 <unset>  31485/TCP` in the output
* now if we call:
`curl $(minicube ip):31485` - we'll get the response
e.g.
`http://192.168.64.2:30345/api/sayHello`

## Labelling
* Describe the deployment
`kubectl describe deployment`
we are interested in:
`Labels:                 run=myservice`
* Now we can list pods/services with label: 'run=myservice'
```
kubectl get pods -l run=myservice
NAME                                   READY     STATUS    RESTARTS   AGE
service1-7ff765bcfc-79kjq   1/1       Running   0          22m
$ kubectl get services -l run=myservice
NAME                  TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
my service   NodePort   10.98.144.54   <none>        8080:31485/TCP   19m
```

* Add label to pod 'service1-7ff765bcfc-79kjq'
`ubectl label pod $POD_NAME app=v1`
* Now we can get our pod by label:
`kubectl get pods -l app=v1`

## Deleting a service
* delete a service by a label `kubectl delete service -l run=myservice`
after it `curl $(minicube ip):31485` gives you now response, 
but if you connect to pod - you will find out that it is still running inside without exposing any port outside (we've deleted a service)

## Scaling
* call `kubectl get deployments`
```
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
kubernetes-bootcamp   1         1         1            1      1m
```
as we see - there is only 1 instance of our deployment
* ok! let's scale it:
`kubectl scale deployments/myservice --replicas=4`
now you call `kubectl get deployments`, you will see:
```
NAME             DESIRED   CURRENT   UP-TO-DATE   AVAILABLE  AGE
kubernetes-bootcamp   4         4         4            3      3m
```
* now let's check number of running pods and replicas:
`kubectl get pods` - you will see 4 pods
`kubectl describe deployments/kubernetes-bootcamp` - will bring you 
`Replicas: 4 desired | 4 updated | 4 total | 4 available | 0 unavailable`
* now if we call `kubectl describe services/kubernetes-bootcamp`, take `NodePort:                 <unset>  30995/TCP` and curl it several times by calling: `curl $(minikube ip):30995` - we will see that it calls different pods each time.
* if now scale down to 2 replicas by `kubectl scale deployments/kubernetes-bootcamp --replicas=2` and then call `kubectl get deployments/pods` - we will se that number of replicas descreased to 2.

## Making rolling updates & rollbacks
Lets assume that we have 4 replicas of our deployment. 
* Now let's try to update image of the application to another image:
`kubectl set image deployments/myservice myservice=service2:v1`

* After that if we call `kubectl describe pods | grep v2` we will see that all the replicas are running 'v2' version of container
* In case smith is wrong and you see picture like:
```
$ kubectl get pods
NAME                                   READY     STATUS             RESTARTS   AGE
kubernetes-bootcamp-5569c6b8d6-kcwl4   0/1       ImagePullBackOff   0          26skubernetes-bootcamp-5569c6b8d6-xxqwt   0/1       ImagePullBackOff   0          26s
kubernetes-bootcamp-7689dc585d-44s55   1/1       Terminating        0          7m
kubernetes-bootcamp-7689dc585d-9cms5   1/1       Running            0          7mkubernetes-bootcamp-7689dc585d-9gmg5   1/1       Running            0          7m
kubernetes-bootcamp-7689dc585d-kps7r   1/1       Running            0          7m
```
You can perform a **rollout**:
`kubectl rollout undo deployments/myservice`
**Updates are versioned** and you can revert to any previously know state of a Deployment.


## Tips & hacks
* using local container in dev use
```
minikube docker-env
eval $(minikube docker-env)
```
* use `imagePullPolicy: IfNotPresent` for usage of containers built locally
* Enable kubernates dashboard:
```
	kubectl proxy  
	http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy/
```
* Enable nginx-ingress `minikube addons enable ingress`

## Lets build more or less real world example
* Create 2 simple node apps & dockerize them
* Create 2 deployments for 2 replicas for each app
* Make apps communicate
* expose 1 of the apps outside with a ingress proxy
* check how it works on
`$(minikube ip)/foo/api/sayHello`
`$(minikube ip)/bar/api/sayHello`
* Get in touch with yml description
`kubectl create -f <filename>.yml`

```
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: test
  annotations:
    kubernetes.io/ingress.allow-http: “true”
    ingress.kubernetes.io/ssl-passthrough: “false”
spec:
  rules:
  - host: 
    http:
      paths:
      - path: /
        backend:
          serviceName: s1
          servicePort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: s1
spec:
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: node1
---
apiVersion: v1
kind: Service
metadata:
  name: s2
spec:
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: node2
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service1
spec:
  selector:
    matchLabels:
      app: node1
  replicas: 2
  template:
    metadata:
      labels:
        app: node1
    spec:
      containers:
      - name: service1
        image: service1:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service2
spec:
  selector:
    matchLabels:
      app: node2
  replicas: 2
  template:
    metadata:
      labels:
        app: node2
    spec:
      containers:
      - name: service2
        image: service2:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
```







