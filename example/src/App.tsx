import * as React from 'react';

import WalletKit, {
  WalletButton,
  WalletButtonStyle,
  createWalletEventEmitter,
  detectPassType,
} from '@azizuysal/wallet-kit';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const PASS_FILES = {
  ios: {
    single: 'Sample.pkpass',
    multiple: ['Coupon.pkpass', 'Generic.pkpass', 'StoreCard.pkpass'],
  },
  android: {
    single: 'demo.jwt',
    multiple: ['demo.jwt'],
  },
};

const SMOKE_RESULT_PATH = `${RNFS.DocumentDirectoryPath}/wallet-kit-smoke.txt`;

const writeSmokeResult = async (result: string): Promise<void> => {
  try {
    await RNFS.writeFile(SMOKE_RESULT_PATH, result, 'utf8');
  } catch (error) {
    console.error('WalletKit smoke: failed to write result', error);
  }
};

const showError = (context: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`${context}:`, error);
  Alert.alert('Error', `${context}: ${message}`, [{ text: 'OK' }], {
    cancelable: true,
  });
};

const App = () => {
  const [canAddPasses, setCanAddPasses] = React.useState(false);
  const [invalidInputRejected, setInvalidInputRejected] = React.useState(false);
  const [platform] = React.useState(Platform.OS);
  const emitter = React.useMemo(() => createWalletEventEmitter(), []);

  React.useEffect(() => {
    const listener = emitter.addListener(
      'AddPassCompleted',
      (success: boolean) => {
        console.log('Deprecated AddPassCompleted event:', success);
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
        console.error('Error checking pass status:', error);
      }
    };
    checkPassStatus();
  }, []);

  React.useEffect(() => {
    const checkInvalidInput = async () => {
      await writeSmokeResult('pending');
      try {
        await WalletKit.addPass('');
        console.error('WalletKit smoke: invalid input unexpectedly resolved');
        await writeSmokeResult('invalid input unexpectedly resolved');
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? error.code
            : undefined;
        if (code === 'INVALID_PASS') {
          console.log('WalletKit smoke: invalid input rejected');
          await writeSmokeResult('invalid input rejected');
          setInvalidInputRejected(true);
        } else {
          console.error(
            'WalletKit smoke: unexpected invalid input error',
            error
          );
          await writeSmokeResult('unexpected invalid input error');
        }
      }
    };
    checkInvalidInput();
  }, []);

  const loadPassData = async (filename: string): Promise<string> => {
    if (Platform.OS === 'ios') {
      return await RNFS.readFile(
        RNFS.MainBundlePath + '/' + filename,
        'base64'
      );
    } else {
      try {
        const jwt = await RNFS.readFileAssets(`samples/${filename}`);
        return jwt.trim();
      } catch (error) {
        console.error(`Failed to load ${filename}:`, error);
        throw new Error(
          `JWT file not found: ${filename}. Please create it in android/app/src/main/assets/samples/`
        );
      }
    }
  };

  const addSinglePass = async () => {
    try {
      const passFile =
        Platform.OS === 'ios'
          ? PASS_FILES.ios.single
          : PASS_FILES.android.single;
      const passData = await loadPassData(passFile);
      console.log('Pass type detected:', detectPassType(passData));
      const added = await WalletKit.addPass(passData);
      Alert.alert(
        added ? 'Added' : 'Not added',
        added
          ? 'The pass was added.'
          : 'The operation was cancelled or the pass already exists.'
      );
    } catch (error: unknown) {
      showError('Failed to add pass', error);
    }
  };

  const addMultiplePasses = async () => {
    try {
      const passFiles =
        Platform.OS === 'ios'
          ? PASS_FILES.ios.multiple
          : PASS_FILES.android.multiple;

      const passes = await Promise.all(
        passFiles.map((filename) => loadPassData(filename))
      );

      const added = await WalletKit.addPasses(passes);
      Alert.alert(
        added ? 'Added' : 'Not added',
        added
          ? 'Every pass was added.'
          : 'The operation was cancelled or a pass already exists.'
      );
    } catch (error: unknown) {
      showError('Failed to add passes', error);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View style={styles.content}>
            <Text style={styles.title}>Wallet Kit Example</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Platform: {platform.toUpperCase()}
              </Text>
              <Text style={styles.infoText}>
                Can Add Passes: {canAddPasses ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.infoText}>
                Invalid Input Rejected: {invalidInputRejected ? 'YES' : 'NO'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Native Buttons</Text>
            <View style={styles.buttonContainer}>
              <Text style={styles.buttonLabel}>Primary Style:</Text>
              <WalletButton
                addPassButtonStyle={WalletButtonStyle.primary}
                style={styles.walletButton}
                onPress={addSinglePass}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Text style={styles.buttonLabel}>Secondary Style:</Text>
              <WalletButton
                addPassButtonStyle={WalletButtonStyle.secondary}
                style={styles.walletButton}
                onPress={addSinglePass}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Text style={styles.buttonLabel}>Outline Style:</Text>
              <WalletButton
                addPassButtonStyle={WalletButtonStyle.outline}
                style={styles.walletButton}
                onPress={addSinglePass}
              />
            </View>

            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={addSinglePass}
            >
              <Text style={styles.actionButtonText}>Add Single Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={addMultiplePasses}
            >
              <Text style={styles.actionButtonText}>Add Multiple Passes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  buttonContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  walletButton: {
    width: '100%',
    height: 48,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
