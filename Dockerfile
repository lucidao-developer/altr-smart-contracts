FROM node:16.19

RUN apt-get update && apt-get upgrade -y \
  && apt-get install -y python3-pip \
  && pip3 install slither-analyzer

RUN ["npm", "install", "-g", "npm@9.3.1"]

RUN mkdir -p /home/node/.vscode-server \
  && chown -R node:node /home/node/.vscode-server

VOLUME /home/node/.vscode-server

RUN mkdir -p /usr/src/app/node_modules \
  && chown -R node:node /usr/src/app/node_modules

WORKDIR /usr/src/app

EXPOSE 8546

USER node
