import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import type { NetowrkMonitorHeaderProp } from './types';
import { typography } from '../../config/typography';
import { colors } from '../../config/color';

const NetworkMonitorHeader = (props: NetowrkMonitorHeaderProp) => {
  const { title, closePresshandler } = props;
  return (
    <View style={styles.header}>
      <View style={styles.headerLogoContainer}>
        <Image
          width={48}
          style={styles.logoImageStyle}
          height={48}
          source={require('../../asset/NetworkLogo.png')}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        onPress={closePresshandler}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Image
          width={32}
          style={styles.imageStyle}
          height={32}
          source={require('../../asset/Close.png')}
          // resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  title: {
    ...typography.h2,
    color: colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    elevation: 5,
    shadowColor: colors.grey5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  logoImageStyle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.grey0,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  imageStyle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grey0,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.black,
  },
});

export default NetworkMonitorHeader;
