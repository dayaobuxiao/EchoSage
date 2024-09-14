# Use an official Node runtime as a parent image
FROM ccr.ccs.tencentyun.com/development/node16.20-alpine:fix

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Set npm to use multiple registries and bypass certificate validation
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set strict-ssl false && \
    npm config set ca "" && \
    (npm install uuid && \
     npm install || \
     (npm config set registry https://registry.npm.taobao.org/ && npm install) || \
     (npm config set registry https://registry.npmjs.org/ && npm install))

# Copy the current directory contents into the container at /app
COPY . .

# Install Tailwind CSS and its dependencies
RUN npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Initialize Tailwind CSS
RUN npx tailwindcss init -p

# Build the app
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Install serve to run the application
RUN npm install -g serve

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "build", "-l", "3000"]