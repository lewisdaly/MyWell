FROM node:7

#Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install nodemon -g -q

#install dependencies
COPY package.json /usr/src/app/
RUN npm install -q

COPY ./ /usr/src/app/

#Default envs
ENV ENABLE_LOGS=false
ENV VERSION_NUMBER=
ENV SERVER_URL=http://docker.local:3000
ENV ENVIRONMENT=development

EXPOSE 8100

CMD [ "./entrypoint.sh" ]
