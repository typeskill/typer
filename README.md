<h1 align="center">
<code>
    react-native-typeskill
</code>
</h1>

<p align="center">
    <a href="https://www.npmjs.com/package/react-native-typeskill" alt="Npm Version">
        <img src="https://img.shields.io/npm/v/react-native-typeskill.svg" /></a>
    <img src="https://img.shields.io/badge/platforms-android%20|%20ios%20|%20windows-lightgrey.svg" />
    <img src="https://img.shields.io/npm/l/react-native-typeskill.svg"/>
    <a href="https://github.com/jsamr/react-native-typeskill/issues?q=is%3Aissue+is%3Aopen+label%3A%22scheduled+feature%22" >
        <img src="https://img.shields.io/github/issues-raw/jsamr/react-native-typeskill/scheduled%20feature.svg?label=scheduled%20feature&colorB=125bba" alt="scheduled features" />
    </a>
</p>
<p align="center">
    <a href="https://circleci.com/gh/jsamr/react-native-typeskill">
        <img src="https://circleci.com/gh/jsamr/react-native-typeskill.svg?style=shield" alt="Circle CI" />
    </a>
    <a href="https://codecov.io/gh/jsamr/react-native-typeskill">
        <img src="https://codecov.io/gh/jsamr/react-native-typeskill/branch/master/graph/badge.svg" alt="Code coverage">
    </a>
    <a href="https://github.com/jsamr/react-native-typeskill/issues?q=is%3Aissue+is%3Aopen+label%3Abug">
        <img src="https://img.shields.io/github/issues-raw/jsamr/react-native-typeskill/bug.svg?label=open%20bugs" alt="open bugs">
    </a>
</p>

<p align="center">
<a href="https://expo.io/@jsamr/typeskill">
    <strong>Give it a try on Expo</strong>
</a>
<br/><br/>
<a href="https://expo.io/@jsamr/typeskill">
    <img src="images/qr.png" alt="Expo QR code">
</a>
<br/>
<a href="examples/expo">
<code>examples/expo</code>
</a>
</p>

> ⚠️ This library is in early development and subject to fast changes. Do not use in production. Also, pull requests are closed prior to reaching 1.0.

## Features & design principles

### Design

- Extensively **modular** and **flexible** architecture
- Based on the reliable [Delta](https://github.com/quilljs/delta) **operational transform** library from [quilljs](https://github.com/quilljs)

### Features

- Support for **arbitrary embedded contents**
- Support for **arbitrary controllers** with the `Bridge` class
- JSON-**serializable** rich text content

### Architecture

The library exposes a naked `Sheet` component, which you can customize and style.
The `Sheet` component is solely responsible for displaying and editing rich content.
This `Sheet` component needs an `innerInterface` object provided by the `Bridge` class to receive actions and notify selection attributes changes.
The actions to insert media content, change line type (normal, lists) or set text attributes to selection (bold, italic) are triggered with the `outerInterface` from the same `Bridge` instance.

Bellow is a simplified snippet [from the expo example](examples/expo/App.tsx) to show you how a custom `Toolbar` can be interfaced with the `Sheet` component:

``` jsx
import React from 'react'
import { Component } from 'react-native'
import { Bridge, Sheeet } from 'react-native-typeskill'

export default class RichTextEditor extends Component {
  private bridge: Bridge = new Bridge()

  render() {
    const innerInterface = this.bridge.getInnerInterface()
    const outerInterface = this.bridge.getOuterInterface()
    return (
    <View style={{ flex: 1 }}>
        <Sheet bridgeInnerInterface={innerInterface} />
        <Toolbar bridgeOuterInferface={outerInterface} />
    </View>
    )
  }
}
```

**This design gives you a total flexibility on your editor layout and integration with your application**.
The `outerInterface` smoothly fit in global state architectures such as Redux.

To see how this `outerInterface` is used in the `Toolbar` expo example, [read its implementation](examples/expo/src/Toolbar.tsx).
