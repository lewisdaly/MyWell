FROM node:7

#Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install nodemon -g -s

#install dependencies
COPY package.json /usr/src/app/
RUN npm install -s

COPY ./ /usr/src/app/
RUN cd /usr/src/app/src && npm install -s

#Default envs
ENV ENABLE_LOGS=false
ENV VERSION_NUMBER=
ENV SERVER_URL=http://localhost:3000
ENV ENVIRONMENT=development

EXPOSE 8100

CMD [ "./entrypoint.sh" ]
