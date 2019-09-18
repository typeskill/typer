import { StyleSheet, ViewStyle } from 'react-native'

const zeroMargin: ViewStyle = {
  margin: 0,
  marginBottom: 0,
  marginEnd: 0,
  marginHorizontal: 0,
  marginLeft: 0,
  marginRight: 0,
  marginStart: 0,
  marginTop: 0,
  marginVertical: 0,
}

export function overridePadding(padding: number) {
  return {
    padding,
    paddingBottom: padding,
    paddingEnd: padding,
    paddingHorizontal: padding,
    paddingLeft: padding,
    paddingRight: padding,
    paddingStart: padding,
    paddingTop: padding,
    paddingVertical: padding,
  }
}

const zeroPadding: ViewStyle = overridePadding(0)

export const genericStyles = StyleSheet.create({
  zeroMargin,
  zeroPadding,
  /**
   * As of React Native 0.60, merging padding algorithm doesn't
   * allow more specific spacing attributes to override more
   * generic ones. As such, we must override all.
   */
  zeroSpacing: { ...zeroMargin, ...zeroPadding },
})
