<h1 align="center">
<code>
    @typeskill/typer
</code>
</h1>
<p align="center">
  <em>
    Typeskill, the Operational-Transform Based (React) Native Rich Text Library.
  </em>
</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@typeskill/typer" alt="Npm Version">
        <img src="https://img.shields.io/npm/v/@typeskill/typer.svg" /></a>
    <img src="https://img.shields.io/badge/platforms-android%20|%20ios%20|%20windows-lightgrey.svg" />
    <img src="https://img.shields.io/npm/l/@typeskill/typer.svg"/>
    <a href="https://github.com/typeskill/typer/issues?q=is%3Aissue+is%3Aopen+label%3A%22scheduled+feature%22" >
        <img src="https://img.shields.io/github/issues-raw/typeskill/typer/scheduled%20feature.svg?label=scheduled%20feature&colorB=125bba" alt="scheduled features" />
    </a>
</p>
<p align="center">
    <a href="https://circleci.com/gh/typeskill/typer">
        <img src="https://circleci.com/gh/typeskill/typer.svg?style=shield" alt="Circle CI" />
    </a>
    <a href="https://codecov.io/gh/typeskill/typer">
        <img src="https://codecov.io/gh/typeskill/typer/branch/master/graph/badge.svg" alt="Code coverage">
    </a>
    <a href="https://github.com/typeskill/typer/issues?q=is%3Aissue+is%3Aopen+label%3Abug">
        <img src="https://img.shields.io/github/issues-raw/typeskill/typer/bug.svg?label=open%20bugs" alt="open bugs">
    </a>
    <img alt="Greenkeeper badge" src="https://badges.greenkeeper.io/typeskill/typer.svg">
    <a href="https://snyk.io/test/github/typeskill/typer">
      <img alt="vulnerabilities" src="https://snyk.io/test/github/typeskill/typer/badge.svg">
    </a>
</p>
<p align="center">
  <code>
      npm install --save @typeskill/typer
  </code>
</p>
<p align="center">
    <img width="400" src="https://raw.githubusercontent.com/typeskill/typeskill/HEAD/images/screenshot.png" alt="Typeskill screenshot">

</p>
<p align="center">
    <a href="https://expo.io/@jsamr/typeskill-showcase">
        <strong>Give it a try on Expo</strong>
    </a>
    <br/><br/>
    <a href="https://expo.io/@jsamr/typeskill-showcase">
        <img src="https://raw.githubusercontent.com/typeskill/typeskill/HEAD/images/qr-showcase.png" alt="Expo QR code">
    </a>
    <br/>
    <a href="#trying-locally">You can also run it locally in seconds</a>
</p>

## Features & design principles

### Design

- Extensively **modular** architecture: Typeskill handles the logic, you chose the layout;
- No bloated/clumsy `WebView` ; this library only relies on (React) **Native** components;
- Fully [controlled components](https://reactjs.org/docs/forms.html#controlled-components);
- Based on the reliable [Delta](https://github.com/quilljs/delta) **operational transform** library from [quilljs](https://github.com/quilljs).

### Features

- Support for **arbitrary embedded contents**;
- Support for **arbitrary controllers** with the `Bridge` class;
- JSON-**serializable** rich content.

<a name="trying-locally" />

## Trying locally

*Prerequisite: you must have `npm` and `expo-cli` globally installed*

``` bash
git clone https://github.com/typeskill/examples/tree/master
cd examples/expo-showcase
npm install
expo start
```

You can also `cd examples/expo-debugger` to understand how the document is represented!

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

### The shape of a Document

A document is an object describing rich content and the current selection. Its `op` field is an array of operational transforms implemented with [delta library](https://github.com/quilljs/delta). Its `schemaVersion` guarantees retro-compatibility in the future and, if needed, utilities to convert from one version to the other.

To explore the structure, the easiest way is with the debugger:

<a href="https://expo.io/@jsamr/typeskill-debugger">
    <img src="https://raw.githubusercontent.com/typeskill/typeskill/HEAD/images/qr-debugger.png" alt="Expo Debugger QR code">
</a>

### Controlled components

Document renderers and controls are **[controlled components](https://reactjs.org/docs/forms.html#controlled-components)**, which means you need to define how to store the state from a master component, or through a store architecture such as a Redux. [You can study `Editor.tsx`, a minimal example master component.](https://github.com/typeskill/examples/blob/master/expo-minimal/src/Editor.tsx)

### A domain of shared events

Document renderers need an invariant `Bridge` instance prop.
The bridge has two responsibilities:

- To convey actions such as *insert an image at selection* or *change text attributes in selection* from external controls;
- To notify selection attributes changes to external controls.

A `Bridge` instance must be hold by the master component, and can be shared with any external control such as `Toolbar` to operate on the document.

**Remarks**

- The `Bridge` constructor **is not exposed**. You must consume the `buildBridge` function or `useBridge` hook instead;
- To grasp how the bridge is interfaced with the `Toolbar` component, you can [read its implementation](src/components/Toolbar.tsx).

### Robustness

This decoupled design has the following advantages:

- the logic can be tested independently from React components;
- the library consumer can integrate the library to fit its graphical and architectural design;
- support for arbitrary content in the future.

### Minimal example

Bellow is a simplified snippet [from the minimal expo example](https://github.com/typeskill/examples/tree/master/expo-minimal) to show you how the `Toolbar` can be interfaced with the `Typer` component.
You need a linked `react-native-vector-icons` or `@expo/vector-icons` if you are on expo to make this example work.

```jsx
import React from 'react'
import { View } from 'react-native'
import {
  Typer,
  Toolbar,
  DocumentControlAction,
  buildVectorIconControlSpec,
  useBridge,
  useDocument,
} from '@typeskill/typer'
/** NON EXPO **/
import { MaterialCommunityIcons } from 'react-native-vector-icons/MaterialCommunityIcons'
/** EXPO **/
// import { MaterialCommunityIcons } from '@expo/vector-icons'

function buildMaterialControlSpec(actionType, name) {
  return buildVectorIconControlSpec(MaterialCommunityIcons, actionType, name)
}

const toolbarLayout = [
  buildMaterialControlSpec(DocumentControlAction.SELECT_TEXT_BOLD, 'format-bold'),
  buildMaterialControlSpec(DocumentControlAction.SELECT_TEXT_ITALIC, 'format-italic'),
  buildMaterialControlSpec(DocumentControlAction.SELECT_TEXT_UNDERLINE, 'format-underline'),
  buildMaterialControlSpec(DocumentControlAction.SELECT_TEXT_STRIKETHROUGH, 'format-strikethrough-variant'),
]

export function Editor() {
  const [document, setDocument] = useDocument()
  const bridge = useBridge()
  return (
    <View style={{ flex: 1 }}>
      <Typer
        document={document}
        onDocumentUpdate={setDocument}
        bridge={bridge}
        maxMediaBlockHeight={300}
      />
      <Toolbar
        document={document}
        layout={toolbarLayout}
        bridge={bridge}
      />
    </View>
  )
}
```

### API Contract

You need to comply with this contract to avoid bugs:

- The `Bridge` instance should be instantiated by the master component with `buildBridge`, during mount or with `useBridge` hook;
- There should be exactly one `Bridge` instance for one document renderer.

## API Reference

[**Typescript definitions**](types/typer.d.ts) provide an exhaustive and curated documentation reference. The comments are [100% compliant with tsdoc](https://github.com/microsoft/tsdoc) and generated with Microsoft famous [API Extractor](https://api-extractor.com/) utility. [**These definitions follow semantic versioning.**](https://semver.org/)

Please note that `props` definitions are namespaced. For example, if you are looking at `Toolbar` component definitions, you should look for `Props` definition inside `Toolbar` namespace.

## Inspecting and reporting bugs

[`@typeskill/debugger`](https://github.com/typeskill/debugger) is a tool to inspect and reproduce bugs. If you witness a bug, please try a reproduction on the debugger prior to reporting it.

## Customizing

### Integrating your image picker

Typeskill won't chose a picker on your behalf, as it would break its commitment to modular design.
You can check [`Editor.tsx` component](https://github.com/typeskill/examples/blob/master/expo-showcase/src/Editor.tsx) from [the showcase expo example](https://github.com/typeskill/examples/tree/master/expo-showcase) to see how to integrate your image picker.
