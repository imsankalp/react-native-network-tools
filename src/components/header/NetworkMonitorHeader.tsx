import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import type { NetowrkMonitorHeaderProp } from './types';
import { typography } from '../../config/typography';
import { colors } from '../../config/color';

const NetworkMonitorHeader = (props: NetowrkMonitorHeaderProp) => {
  const { title, closePresshandler, onClear } = props;
  return (
    <View style={styles.main}>
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
        <View style={styles.buttonContainer}>
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
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.filterContainer}>
        {onClear && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButtonText}>{'⊘ '}Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    flexDirection: 'column',
    width: '100%',
  },
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
    flex: 1,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.error,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
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
  filterContainer: {
    width: '100%',
    justifyContent: 'space-around',
    paddingBottom: 12,
  },
});

export default NetworkMonitorHeader;
