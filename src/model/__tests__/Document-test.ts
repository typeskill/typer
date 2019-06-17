/* eslint-disable @typescript-eslint/no-unused-vars */
import { Document } from '@model/Document'
import { TextBlock } from '@model/TextBlock'
import { Bridge } from '@core/Bridge'
import { mockDeltaChangeContext, mockSelection } from '@test/delta'
import { Selection } from '@delta/Selection'
import { getHeadingCharactersFromType } from '@delta/lines'
import { mockDocumentDelta, mockDocumentDeltaSerialUpdate, runUpdates } from '@test/document'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

function newConsumer() {
  const bridge = new Bridge()
  return {
    controlEventDom: bridge.getControlEventDomain(),
    sheetEventDom: bridge.getSheetEventDomain(),
    handleOnDocumentStateUpdate: () => {
      /** noop */
    },
  }
}

function createContext() {
  const consumer = newConsumer()
  const controlEventDom = consumer.controlEventDom
  const document = new Document()
  document.registerConsumer(consumer)
  const block0 = document.getActiveBlock() as TextBlock
  return {
    controlEventDom,
    block0,
    getOverridingSelection: () => block0.getSelection(),
  }
}

describe('@model/Document', () => {
  describe('constructor', () => {
    it('should no crash at instanciation', () => {
      expect(() => {
        const doc = new Document()
      }).not.toThrow()
    })
  })
  describe('document operations', () => {
    it('setting a line to ol type should add prefix', () => {
      const { controlEventDom, block0 } = createContext()
      runUpdates(block0.createSerialUpdateGenerator('First\n', mockDeltaChangeContext(0, 5)))
      block0.handleOnSelectionChange(Selection.fromBounds(5))
      controlEventDom.switchLineTypeInSelection('ol')
      expect(block0.getDelta().ops).toEqual([
        { insert: getHeadingCharactersFromType('ol', 0) + 'First' },
        { insert: '\n', attributes: { $type: 'ol' } },
      ])
    })
    it('applying type to multiple lines and adding newline', () => {
      const { controlEventDom, block0 } = createContext()
      const firstLine = getHeadingCharactersFromType('ol', 0) + 'First'
      const fullText = firstLine + '\n'
      runUpdates(block0.createSerialUpdateGenerator(fullText, mockDeltaChangeContext(0, fullText.length - 1)))
      block0.handleOnSelectionChange(Selection.fromBounds(firstLine.length - 1))
      controlEventDom.switchLineTypeInSelection('ol')
      runUpdates(
        block0.createSerialUpdateGenerator(fullText, mockDeltaChangeContext(fullText.length - 1, fullText.length)),
      )
      expect(block0.getDelta().ops).toEqual([
        { insert: getHeadingCharactersFromType('ol', 0) + 'First' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: getHeadingCharactersFromType('ol', 1) },
        { insert: '\n', attributes: { $type: 'ol' } },
      ])
    })
    it('deleting part of an ol prefix manually should remove ol type, override selection and notify for selected line attributes changes', () => {
      const { controlEventDom, block0, getOverridingSelection } = createContext()
      const initialLine = 'First\n'
      const owner = {}
      const onLineTypeChange = jest.fn()
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 5)))
      block0.handleOnSelectionChange(Selection.fromBounds(5))
      controlEventDom.switchLineTypeInSelection('ol')
      controlEventDom.addSelectedLineTypeChangeListener(owner, onLineTypeChange)
      const header = getHeadingCharactersFromType('ol', 0)
      const transformedLine = header + 'First'
      const slicedLine = header.slice(0, 1) + header.slice(2) + initialLine
      expect(block0.getDelta().ops).toEqual([
        { insert: transformedLine },
        { insert: '\n', attributes: { $type: 'ol' } },
      ])
      block0.handleOnSelectionChange(mockSelection(2))
      runUpdates(block0.createSerialUpdateGenerator(slicedLine, mockDeltaChangeContext(2, 1)))
      expect(block0.getDelta().ops).toEqual([{ insert: initialLine }])
      expect(getOverridingSelection()).toMatchObject(Selection.fromBounds(0))
      expect(onLineTypeChange).toHaveBeenCalledWith('normal')
    })
    it('applying text attributes to empty selection should result in cursor attributes matching these attributes', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F'
      block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
      })
    })
    it('successively applying text attributes to empty selection should result in the merging of those attributes', () => {
      const { controlEventDom, block0 } = createContext()
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      controlEventDom.applyTextTransformToSelection('italic', true)
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
        italic: true,
      })
    })
    it('setting cursor attributes should propagate to inserted text', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1)))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
      })
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(1, 2)))
      expect(block0.getDelta().ops).toEqual([
        { insert: 'F' },
        { insert: 'P', attributes: { weight: 'bold' } },
        { insert: '\n' },
      ])
    })
    it('unsetting cursor attributes should propagate to inserted text', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1)))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', null)
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: null,
      })
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(1, 2)))
      expect(block0.getDelta().ops).toEqual([{ insert: 'F', attributes: { weight: 'bold' } }, { insert: 'P\n' }])
    })
    it('applying text-length-transforming line type to selection should override selection with one of length augmented by the number of characters inserted', () => {
      const { block0 } = createContext()
      const initialLine = 'A\nB\nC\n'
      const selectionEnd = 5
      const head = getHeadingCharactersFromType('ol', 0)
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, selectionEnd)))
      const selection = Selection.fromBounds(0, selectionEnd)
      const documentDeltaUpdate = block0.getDelta().applyLineTypeToSelection(selection, 'ol')
      const overridingSelection = { start: head.length, end: head.length * 3 + selectionEnd }
      expect(documentDeltaUpdate.selectionAfterChange).toMatchObject(overridingSelection)
    })
    it('unapplying text-length-transforming line type to selection should override selection with one of length reduced by the number of characters deleted', () => {
      const { block0 } = createContext()
      const head0 = getHeadingCharactersFromType('ol', 0)
      const head1 = getHeadingCharactersFromType('ol', 1)
      const head2 = getHeadingCharactersFromType('ol', 2)
      const head3 = getHeadingCharactersFromType('ol', 3)
      const delta = mockDocumentDelta([
        { insert: head0 + 'A' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: head1 + 'B' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: head2 + 'C' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: head3 + 'D' },
        { insert: '\n', attributes: { $type: 'ol' } },
      ])
      runUpdates(block0['transformSerialUpdateToGenerator'](mockDocumentDeltaSerialUpdate(delta.ops)))
      const selection = Selection.fromObject({
        start: 0,
        end: delta.length(),
      })
      const documentDeltaUpdate = delta.applyLineTypeToSelection(selection, 'normal')
      const overridingSelection = Selection.fromBounds(0, 8)
      expect(documentDeltaUpdate.selectionAfterChange).toMatchObject(overridingSelection)
    })
  })
  describe('regressions', () => {
    it('pass regression: deleting a newline character should not delete the full upcoming line ', () => {
      const { block0 } = createContext()
      const initialLine = 'F\nG\n'
      const nextLine = 'FG\n'
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 3)))
      block0.handleOnSelectionChange(Selection.fromBounds(2))
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(2, 1)))
      expect(block0.getDelta().ops).toEqual([{ insert: 'FG\n' }])
    })
    it('pass regression: unapplying bold followed by applying italic to zero length cursor result in italic attribute for cursor', () => {
      const { controlEventDom, block0 } = createContext()
      const text = 'foo'
      block0.createSerialUpdateGenerator(text, mockDeltaChangeContext(0, 3))
      block0.handleOnSelectionChange(mockSelection(0, 3))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      block0.handleOnSelectionChange(mockSelection(3))
      controlEventDom.applyTextTransformToSelection('weight', null)
      controlEventDom.applyTextTransformToSelection('italic', true)
      expect(block0.getCursorAttributes()).toEqual({
        italic: true,
        weight: null,
      })
    })
    it('pass regression: pressing enter should enter newline in empty list line', () => {
      const { controlEventDom, block0 } = createContext()
      controlEventDom.switchLineTypeInSelection('ul')
      const line1 = getHeadingCharactersFromType('ul', 0)
      expect(block0.getDelta().ops).toEqual([{ insert: line1 }, { insert: '\n', attributes: { $type: 'ul' } }])
      runUpdates(
        block0.createSerialUpdateGenerator(`${line1}\n\n`, mockDeltaChangeContext(line1.length, line1.length + 1)),
      )
      expect(block0.getDelta().ops).toEqual([
        { insert: line1 },
        { insert: '\n', attributes: { $type: 'ul' } },
        { insert: line1 },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
    })
    it('pass regression #12: deleting ul line prefix just after cutting an ul and pressing enter should be handled appropriately', () => {
      const { controlEventDom, block0 } = createContext()

      const firstWord = 'A'
      const space = ' '
      const secondWord = 'B'
      // 1: create ul line
      const step1Line = `${firstWord}${space}${secondWord}`
      const step1EndOfChange = firstWord.length + space.length + secondWord.length
      runUpdates(block0.createSerialUpdateGenerator(step1Line, mockDeltaChangeContext(0, step1EndOfChange)))
      block0.handleOnSelectionChange(Selection.fromBounds(step1EndOfChange))
      // 2: apply ul to line
      const header = getHeadingCharactersFromType('ul', 0)
      controlEventDom.switchLineTypeInSelection('ul')
      // 3: move to cursor before "l"
      block0.handleOnSelectionChange(Selection.fromBounds(header.length + firstWord.length + 1))
      // 4: insert newline
      const step3line = `${header}${firstWord} \n${secondWord}\n`
      runUpdates(
        block0.createSerialUpdateGenerator(
          step3line,
          mockDeltaChangeContext(header.length + firstWord.length + 1, header.length + firstWord.length + 2),
        ),
      )
      expect(block0.getSelection()).toMatchObject(Selection.fromBounds(header.length * 2 + firstWord.length + 2))
      block0.handleOnSelectionChange(block0.getSelection())
      expect(block0.getDelta().ops).toEqual([
        { insert: `${header}${firstWord} ` },
        { insert: '\n', attributes: { $type: 'ul' } },
        { insert: `${header}${secondWord}` },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
      // 5: remove one char from prefix
      const step5line = `${header}${firstWord} \n${header.substring(0, header.length - 1)}${secondWord}\n`
      runUpdates(
        block0.createSerialUpdateGenerator(
          step5line,
          mockDeltaChangeContext(block0.getSelection().start, block0.getSelection().start - 1),
        ),
      )
      expect(block0.getDelta().ops).toEqual([
        { insert: `${header}${firstWord} ` },
        { insert: '\n', attributes: { $type: 'ul' } },
        { insert: `${secondWord}\n` },
      ])
    })
  })
})
