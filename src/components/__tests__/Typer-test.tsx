import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { buildEmptyDocument, Document } from '@model/document'
import { Typer } from '@components/Typer'
import { buildBridge } from '@core/Bridge'
import { buildTextOp } from '@delta/operations'

describe('@components/<Typer>', () => {
  it('should renders without crashing', () => {
    const typer = renderer.create(<Typer bridge={buildBridge()} document={buildEmptyDocument()} />)
    expect(typer).toBeTruthy()
  })
  it('should not call onDocumentUpdate after external updates', async () => {
    const bridge = buildBridge()
    const initialDocument = buildEmptyDocument()
    const callback = jest.fn()
    const typer1 = await renderer.create(
      <Typer document={initialDocument} bridge={bridge} onDocumentUpdate={callback} />,
    )
    await typer1.update(<Typer document={initialDocument} bridge={bridge} onDocumentUpdate={callback} />)
    expect(callback).not.toHaveBeenCalled()
  })
  it("should not call onDocumentUpdate after selection change which doesn't trigger text attribtues changes", async () => {
    const bridge = buildBridge()
    const initialDocument: Document = {
      ...buildEmptyDocument(),
      ops: [buildTextOp('A\n')],
    }
    const nextDocument: Document = {
      ...initialDocument,
      currentSelection: { start: 1, end: 1 },
    }
    const callback = jest.fn()
    const typer1 = await renderer.create(
      <Typer document={initialDocument} bridge={bridge} onDocumentUpdate={callback} />,
    )
    await typer1.update(<Typer document={nextDocument} bridge={bridge} onDocumentUpdate={callback} />)
    expect(callback).not.toHaveBeenCalled()
  })
  it('should call onDocumentUpdate after selection change which trigger text attribtues changes', async () => {
    const bridge = buildBridge()
    const initialDocument: Document = {
      ...buildEmptyDocument(),
      ops: [buildTextOp('A'), buildTextOp('B', { bold: true }), buildTextOp('\n')],
    }
    const nextDocument: Document = {
      ...initialDocument,
      currentSelection: { start: 2, end: 2 },
    }
    const callback = jest.fn()
    const typer1 = await renderer.create(
      <Typer document={initialDocument} bridge={bridge} onDocumentUpdate={callback} />,
    )
    await typer1.update(<Typer document={nextDocument} bridge={bridge} onDocumentUpdate={callback} />)
    expect(callback).toHaveBeenCalled()
  })
  it('should call onDocumentUpdate with new document version after block insertion', async () => {
    const bridge = buildBridge()
    let document: Document = {
      ...buildEmptyDocument(),
      ops: [buildTextOp('AB\n')],
    }
    const onDocumentUpdate = (doc: Document) => {
      document = doc
    }
    await renderer.create(<Typer document={document} bridge={bridge} onDocumentUpdate={onDocumentUpdate} />)
    const imageBlockDesc = { height: 0, width: 0, source: { uri: 'https://foo.bar' } }
    bridge.getControlEventDomain().insertOrReplaceAtSelection({ type: 'image', description: imageBlockDesc })
    expect(document.ops).toMatchObject([{ insert: { kind: 'image', ...imageBlockDesc } }, buildTextOp('AB\n')])
  })
  it('should call onDocumentUpdate with new document version after text attribute changes', async () => {
    const bridge = buildBridge()
    let document: Document = {
      ...buildEmptyDocument(),
      ops: [buildTextOp('AB\n')],
      currentSelection: { start: 0, end: 2 },
    }
    const onDocumentUpdate = (doc: Document) => {
      document = doc
    }
    await renderer.create(<Typer document={document} bridge={bridge} onDocumentUpdate={onDocumentUpdate} />)
    bridge.getControlEventDomain().applyTextTransformToSelection('bold', true)
    expect(document.ops).toMatchObject([buildTextOp('AB', { bold: true }), buildTextOp('\n')])
  })
})
