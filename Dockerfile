FROM node:4-onbuild
EXPOSE 1202
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install && npm install forever -g
ENTRYPOINT ["forever","index.js"]