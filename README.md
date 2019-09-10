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

- Support for **arbitrary embedded contents**;
- Support for **arbitrary controllers** with the `Bridge` class;
- JSON-**serializable** rich content.

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

The library exposes two components to render documents:

- The `Typer` component is responsible for **editing** a document;
- The `Print` component is responsible for **displaying** a document.

### Definitions

- A *document* is a JSON-serializable object describing rich content;
- A *document renderer* is any controlled component which renders a document—i.e. `Typer` or `Print`;
- The *master component* is referred to as the component containing and controlling the document renderer;
- A *document control* is any controlled component owned by the master component capable of altering the document—i.e. `Typer` or `Toolbar`;
- An *external [document] control* is any document control which is not a document renderer—i.e. `Toolbar` or any custom control.

### Controlled components

Document renderers and controls are **[controlled components](https://reactjs.org/docs/forms.html#controlled-components)**, which means you need to define how to store the state from a master component, or through a store architecture such as a Redux.

**link to example**

### A domain of shared events

Document renderers need an invariant `Bridge` instance prop.
The bridge has three responsibilities:

- To convey actions such as *insert an image at selection* or *change text attributes in selection* from external controls;
- To notify selection attributes changes to external controls.

A `Bridge` instance must be hold by the master component, and can be shared with any external control such as `Toolbar` to operate on the document.

**Remarks**

- The `Bridge` constructor **is not exposed**. You must consume the `buildBridge` function instead;
- To grasp how the bridge is interfaced with the `Toolbar` component, you can [read its implementation](src/components/Toolbar.tsx).

### Robustness

This decoupled design has the following advantages:

- the logic can be tested independently from React components;
- the library consumer can integrate the library to fit its graphical and architectural design;
- support for arbitrary content in the future.

### Minimal example

Bellow is a simplified snippet [from the expo example](examples/expo/App.tsx) to show you how the `Toolbar` can be interfaced with the `Typer` component.
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
  )
]

export class RichTextEditor extends Component {
  bridge = new Bridge()

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Typer bridgeInnerInterface={this.bridge.getInnerInterface()} />
        <Toolbar
          layout={toolbarLayout}
          bridgeOuterInferface={this.bridge.getOuterInterface()}
        />
      </View>
    )
  }
}
```

### Lifecycle contract

You need to comply with this contract to avoid resource leakage and bugs:

- The `Bridge` instance should be instantiated by the master component, during its own instantiation or during mount;
- There should be exactly one `Bridge` instance for one document renderer.

## Customizing

### Integrating your image picker

Typeskill won't chose a picker on your behalf, as it would break its commitment to modular design.
