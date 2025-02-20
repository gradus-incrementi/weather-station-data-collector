# Use the official Node.js image.
# Pull the latest LTS version of Node.js from Docker Hub.
FROM node:lts

# Create and change to the app directory in the container
WORKDIR /usr/src/app

# Copy package files to install dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

LABEL version="0.3.4"

# Bundle app source code inside the container
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Run the application
CMD ["node", "server.js"]
