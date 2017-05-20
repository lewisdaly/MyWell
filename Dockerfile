FROM node:latest

#Create app directory
RUN mkdir -p /usr/src/app

RUN npm install nodemon -g

# this corresponds to the mounted dir in ../docker-compose.yml
WORKDIR /usr/src/app

#install dependencies
ADD package.json /usr/src/app/
RUN npm install

ENV ENABLE_LOGS=false

EXPOSE 8100

CMD [ "npm" "run" "prod"]
