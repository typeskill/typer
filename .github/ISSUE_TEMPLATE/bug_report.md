---
name: 🐛 Report a bug
about: Report a reproducible or regression bug.
labels: 'bug'
---

## Environment
<!-- Run `react-native info` in your terminal and paste its contents here. -->


## Tested Devices
<!-- For each device you have tested, report the result of your manual tests.
If the bug is not the same on different devices, please open one ticket for each.
Report 'failed' if the bug happened on this device, 'passed' if the bug did not happen on this device.
Ideally, please attempt tests on at least one iOS and one Android device or emulator. -->

- iPhone X, ios 12.3: <!-- failed | passed -->
- One Plus 5, Cyanogen 9.3: <!-- failed | passed  -->
- Android emulator v29.0.11.0, Android 8.0: <!-- failed | passed  -->
- XCode simulator 11.0, ios 12.1: <!-- failed | passed  -->

## Versions
<!-- Please add the used versions/branches -->
- react-native-typeskill:
- react-native:

## Description
<!-- Describe your issue in detail. It is also very appreciated to add a GIF from the Open Source ScreenCam app on Android, or the embedded screen recorder on iOS. -->


## Reproduction
<!-- IF you can reproduce the steps with the expo app at https://expo.io/@jsamr/typeskill, enumerate these steps. The last line after the enumeration is the discussion about what was expected and what happenned instead after last step.

Android Reproduction from the Expo Project:

1. Type "Thansk" ; Android Google Keyboard would suggest "Thanks" instead
2. Press "Thanks" ; "Thanks" should be printed now.
3. Press spacebar

"Thanks" has been overridden with "Thansk" while it shouldn't have. 

OTHERWISE, you must provide a minimal example: https://stackoverflow.com/help/mcve, ideally in the form of a git repository. -->
