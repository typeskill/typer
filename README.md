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
    <img alt="Greenkeeper badge" src="https://badges.greenkeeper.io/jsamr/react-native-typeskill.svg">
    <a href="https://snyk.io/test/github/jsamr/react-native-typeskill">
      <img alt="vulnerabilities" src="https://snyk.io/test/github/jsamr/react-native-typeskill/badge.svg">
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
    <a href="#trying-locally">You can also run it locally in seconds</a>

</p>

> ⚠️ This library is in early development and subject to fast changes. Do not use in production. Also, pull requests are closed prior to reaching 1.0.

## Features & design principles

### Design

- Extensively **modular** architecture: Typeskill handles the logic, you chose the layout;
- No bloated/clumsy `WebView` ; this library only relies on (React) **Native** components;
- Based on the reliable [Delta](https://github.com/quilljs/delta) **operational transform** library from [quilljs](https://github.com/quilljs).

### Features

- Support for **arbitrary embedded contents**
- Support for **arbitrary controllers** with the `Bridge` class
- JSON-**serializable** rich text content

<a name="trying-locally" />

## Trying locally

*Prerequisite: you must have `npm` and `expo-cli` globally installed*

``` bash
git clone https://github.com/jsamr/react-native-typeskill.git
cd react-native-typeskill/examples/expo
npm install
expo start
```

## Architecture & example

### Introduction

The library exposes a naked `Sheet` component, which you can customize and style.
The `Sheet` component is solely responsible for displaying and editing rich content.
This `Sheet` component needs an `innerInterface` object provided by the `Bridge` class to receive actions and notify selection attributes changes.
The actions to insert media content, change line type (normal, lists) or set text attributes to selection (bold, italic) are triggered with the `outerInterface` from the same `Bridge` instance.

This decoupled design has the following advantages:

- the logic can be tested independently from React components;
- the library consumer can integrate the library to fit its UI and architectural design;
- arbitrary content can be embdedded.

### Minimal example

Bellow is a simplified snippet [from the expo example](examples/expo/App.tsx) to show you how the `Toolbar` can be interfaced with the `Sheet` component.
You need a linked `react-native-vector-icons` or `@expo/vector-icons` if you are on expo to make this example work.

``` jsx
import React from 'react'
import { Component } from 'react-native'
import {
  Bridge,
  Sheeet,
  Toolbar,
  buildVectorIconControlSpec,
  TEXT_CONTROL_SEPARATOR,
  ControlAction
} from 'react-native-typeskill'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

const toolbarLayout = [
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_TEXT_BOLD,
    'format-bold'
  ),
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_TEXT_ITALIC,
    'format-italic'
  ),
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_TEXT_UNDERLINE,
    'format-underline'
  ),
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_TEXT_STRIKETHROUGH,
    'format-strikethrough-variant'
  ),
  TEXT_CONTROL_SEPARATOR,
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_LINES_ORDERED_LIST,
    'format-list-numbered'
  ),
  buildVectorIconControlSpec(
    MaterialCommunityIcons,
    ControlAction.SELECT_LINES_UNORDERED_LIST,
    'format-list-bulleted'
  )
]

export class RichTextEditor extends Component {
  bridge = new Bridge()

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Sheet bridgeInnerInterface={this.bridge.getInnerInterface()} />
        <Toolbar
          layout={toolbarLayout}
          bridgeOuterInferface={this.bridge.getOuterInterface()}
        />
      </View>
    )
  }
}
```

**This design gives you a total flexibility on your editor layout and integration with your application**.
The `outerInterface` smoothly fit in global state architectures such as Redux.

To see how this `outerInterface` is used in the `Toolbar` component, [read its implementation](src/components/Toolbar.tsx). Basically, this outer interface could be used anywhere in your layout, giving you the flexibility of composing multiple controls wherever you want.

### Lifecycle contract

You need to comply with this contract to avoid resource leakage and bugs.

First off, some definitions. The root component is referred to as the component containing the `Sheet` component. A controller is a component to which the `outerInterface` prop is passed.

You should follow this set of rules:

- the `Bridge` instance should be instanciated by root component, during its own istantiation or during mount;
- there should be exactly one `Bridge` instance for one rendered `Sheet`;
- any component (root or controller) which adds listeners to the `outerInterface` should detatch any references with `outerInterface.release(this)` before unmounting (`componentWillUnmount`).
