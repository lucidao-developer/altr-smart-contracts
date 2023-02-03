FROM node:16.19

RUN apt-get update && apt-get upgrade -y \
  && apt-get install -y python3-pip \
  && pip3 install slither-analyzer

RUN ["npm", "install", "-g", "npm@9.4.1"]

WORKDIR /usr/src/app

COPY . .

RUN ["npm", "install"]

RUN chown -R node:node /usr/src/app

EXPOSE 8546

USER node
