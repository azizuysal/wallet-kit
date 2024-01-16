import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  type NativeModule,
} from 'react-native';
import WalletKit, { WalletButton, WalletButtonStyle } from 'wallet-kit';
import RNFS from 'react-native-fs';

const App = () => {
  const [canAddPasses, setCanAddPasses] = React.useState(false);
  const emitter = React.useMemo(
    () => new NativeEventEmitter(NativeModules.WalletKit as NativeModule),
    []
  );

  React.useEffect(() => {
    const listener = emitter.addListener(
      'AddPassCompleted',
      (success: boolean) => {
        console.log('AddPassCompleted with success: ', success);
      }
    );
    return () => listener.remove();
  }, [emitter]);

  React.useEffect(() => {
    const checkPassStatus = async () => {
      try {
        const response = await WalletKit.canAddPasses();
        setCanAddPasses(response);
      } catch (error) {
        console.log(error);
      }
    };
    checkPassStatus();
  }, []);

  const addSinglePass = async () => {
    try {
      const file = await RNFS.readFile(
        RNFS.MainBundlePath + '/Sample.pkpass',
        'base64'
      );
      await WalletKit.addPass(file);
    } catch (error) {
      console.error(error);
    }
  };

  const addMultiplePasses = async () => {
    try {
      const array: string[] = [];
      const file1 = await RNFS.readFile(
        RNFS.MainBundlePath + '/Coupon.pkpass',
        'base64'
      );
      array.push(file1);
      const file2 = await RNFS.readFile(
        RNFS.MainBundlePath + '/Generic.pkpass',
        'base64'
      );
      array.push(file2);
      const file3 = await RNFS.readFile(
        RNFS.MainBundlePath + '/StoreCard.pkpass',
        'base64'
      );
      array.push(file3);
      // [1, 2, 3].forEach(_ => array.push(file));
      await WalletKit.addPasses(array);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text>Can Add Passes: {canAddPasses ? 'YES' : 'NO'}</Text>
        <View style={styles.box}>
          <WalletButton
            addPassButtonStyle={WalletButtonStyle.blackOutline}
            style={styles.button1}
            onPress={() => addSinglePass()}
          />
          <WalletButton
            addPassButtonStyle={WalletButtonStyle.black}
            style={styles.button2}
            onPress={() => addMultiplePasses()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: 'black',
    width: Dimensions.get('window').width * 0.9,
    height: 200,
    marginVertical: 20,
  },
  button1: {
    flexGrow: 2,
    margin: 20,
  },
  button2: {
    flexGrow: 3,
    marginHorizontal: 80,
    marginBottom: 20,
  },
});

export default App;
