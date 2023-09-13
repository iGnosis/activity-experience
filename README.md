# Sound Health - Activity Experience ![check-code-coverage](https://img.shields.io/badge/code--coverage-26.18%25-red)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.1.4.

## Getting Started

### Requirements
[Node.js](https://nodejs.org/en) >= v14.20

### Local setup

1. Use the package manager [npm](https://www.npmjs.com/) to install the required dependencies
```bash
npm install
```
2. Make necessary changes to the environment variables in `src/environments/local/environment.local.pure.ts`
3. After completing the installation, you can start the local server by running the following command:
```bash
npm run start:local-pure
```

**NOTE:** Please make sure that the [player client](https://github.com/PointMotionInc/sh-player-client) is running locally as a prerequisite for using this Angular application through the web browser at `http://localhost:4300/app/session`

### Build for Production

1. Create a copy of environment file `environment.ts` into the `src/environments` directory and name it `environment.prod.ts` and make necessary changes to the environment variables
2. Run the following command to build the application for production:
```bash
npm run build
```

This will create a `dist` directory in your project containing the production-ready files which can be uploaded to any static site hosting service of choice.

**NOTE:** You can update the environment variable `activityEndpoint` in the [player client](https://github.com/PointMotionInc/sh-player-client) environment file to point to the hosted activity experience to make it accessible through the player client.

### Troubleshooting
#### Conflicting packages

If you encounter conflicts or issues with package dependencies during installation, you can try running the following command to bypass peer dependency checks:
```bash
npm install --legacy-peer-deps
```

This can help resolve conflicts and allow you to install the required packages.
## Contributing

WIP

## License

WIP
