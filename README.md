# wallet-kit

A React Native wrapper for Apple PassKit written in typescript. Google Wallet implementation will be coming soon (hopefully).

## Installation

```sh
npm install wallet-kit
```

## Usage

```js
import { Wallet } from '@react-native/wallet';

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
