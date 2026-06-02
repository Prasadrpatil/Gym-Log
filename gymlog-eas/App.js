import React, { useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

export default function App() {
  const [uri, setUri] = useState(null);

  useEffect(() => {
    const asset = Asset.fromModule(require('./assets/web/index.html'));
    asset.downloadAsync().then(() => setUri(asset.localUri));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {uri && (
        <WebView
          source={{ uri }}
          style={styles.webview}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  webview:   { flex: 1 },
});
