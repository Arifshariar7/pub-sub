FROM node:14-alpine

WORKDIR /app
COPY package.json .


COPY package-lock.json .

RUN npm install 

# copy rest of the files 
COPY . .

CMD [ "node","index.js" ]