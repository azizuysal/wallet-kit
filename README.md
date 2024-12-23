# @azizuysal/wallet-kit

A React Native wrapper for Apple and Google wallet passes written in TypeScript.
Google wallet passes are not supported yet.

## Installation

```sh
npm install @azizuysal/wallet-kit
```

## Usage

```js
import { multiply } from '@azizuysal/wallet-kit';

// ...

const addSinglePass = async () => {
    try {
      const file = await ... // read pkpass file into base64 string
      await Wallet.addPass(file);
    } catch (error) {
      console.error(error);
    }
  };
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
