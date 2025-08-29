import * as React from 'react';

import WalletKit, {
  WalletButton,
  WalletButtonStyle,
  createWalletEventEmitter,
  detectPassType,
  type AddPassCompletedEvent,
} from '@azizuysal/wallet-kit';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';

const PASS_FILES = {
  ios: {
    single: 'Sample.pkpass',
    multiple: ['Coupon.pkpass', 'Generic.pkpass', 'StoreCard.pkpass'],
  },
  android: {
    single: 'demo.jwt',
    multiple: ['demo.jwt', 'demo.jwt', 'demo.jwt'],
  },
};

const App = () => {
  const [canAddPasses, setCanAddPasses] = React.useState(false);
  const [platform] = React.useState(Platform.OS);
  const emitter = React.useMemo(() => createWalletEventEmitter(), []);

  React.useEffect(() => {
    const listener = emitter.addListener(
      'AddPassCompleted',
      (success: AddPassCompletedEvent) => {
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
        console.log('Error checking pass status:', error);
      }
    };
    checkPassStatus();
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
      await WalletKit.addPass(passData);
    } catch (error: any) {
      console.error('Error adding pass:', error.code || error.message);
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

      await WalletKit.addPasses(passes);
    } catch (error: any) {
      console.error('Error adding passes:', error.code || error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={styles.title}>Wallet Kit Example</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Platform: {platform.toUpperCase()}
            </Text>
            <Text style={styles.infoText}>
              Can Add Passes: {canAddPasses ? '✅ YES' : '❌ NO'}
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
          <TouchableOpacity style={styles.actionButton} onPress={addSinglePass}>
            <Text style={styles.actionButtonText}>Add Single Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={addMultiplePasses}
          >
            <Text style={styles.actionButtonText}>Add Multiple Passes</Text>
          </TouchableOpacity>

          {Platform.OS === 'android' && (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Android Note:</Text>
              <Text style={styles.noteText}>
                This example uses a dummy JWT for demonstration. In production,
                you would generate proper JWTs on your server with your Google
                Wallet API credentials.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  noteBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#F57C00',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default App;
