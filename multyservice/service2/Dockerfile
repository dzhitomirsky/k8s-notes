FROM node:8
LABEL maintainer="Daniel.Zhitomirsky@opuscapita.com"

WORKDIR /home/node/service2

COPY . .

#Installing depepndecies, building ui bundle, making cleanup
#RUN npm set progress=false && npm install; npm cache verify
RUN npm install
# ENV NODE_ENV="production"
# RUN npm run build
# RUN npm prune --production

USER node

EXPOSE 3000

CMD npm start