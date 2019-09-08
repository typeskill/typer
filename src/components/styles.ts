import { StyleSheet } from 'react-native'

export const genericStyles = StyleSheet.create({
  /**
   * As of React Native 0.60, merging padding algorithm doesn't
   * allow more specific spacing attributes to override more
   * generic ones. As such, we must override all.
   */
  zeroSpacing: {
    margin: 0,
    marginBottom: 0,
    marginEnd: 0,
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    marginStart: 0,
    marginTop: 0,
    marginVertical: 0,
    padding: 0,
    paddingBottom: 0,
    paddingEnd: 0,
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingStart: 0,
    paddingTop: 0,
    paddingVertical: 0,
  },
})
