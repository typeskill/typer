// tslint:disable:no-string-literal
import Store from '@model/Store'
import DocumentDelta from '@delta/DocumentDelta'
import TextBlock from '@model/TextBlock'
import Bridge from '@core/Bridge'
import Orchestrator from '@model/Orchestrator'
import { setInstanceNumber as setBlockInstanceNumber } from '@model/Block'

function newTextBlock(): TextBlock<any> {
  let delta = new DocumentDelta()
  return new TextBlock({
    bridgeInnerInterface: new Bridge().getInnerInterface(),
    getDelta: () => delta,
    onPressBackspaceFromOrigin: () => { /** */ },
    onPressEnter: () => { /** */ },
    orchestrator: new Orchestrator(),
    updateDelta: (nuDelta: DocumentDelta) => {
      delta = nuDelta
    }
  })
}

describe('@model/Store', () => {
  describe('instantiation', () => {
    it('should not crash', () => {
      expect(() => {
        const store = new Store()
      }).not.toThrow()
    })
  })
  describe('updateState', () => {
    it('should keep class prototypes', () => {
      const store = new Store()
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        deltas: {
          0: new DocumentDelta()
        }
      })
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        deltas: {
          0: new DocumentDelta([{ insert: 'a' }])
        }
      })
      expect(store['state'].deltas[0]).toBeInstanceOf(DocumentDelta)
    })
    it('should merge only one level deep', () => {
      const store = new Store()
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        deltas: {
          0: new DocumentDelta()
        }
      })
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        deltas: {
          1: new DocumentDelta([{ insert: 'b' }])
        }
      })
      expect(store['state'].deltas[0]).toBeUndefined()
      expect(store['state'].deltas[1]).toBeInstanceOf(DocumentDelta)
    })
  })
  describe('insertBlock', () => {
    it('should append block', () => {
      const store = new Store()
      const delta0 = new DocumentDelta()
      const delta1 = new DocumentDelta()
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        blockOrders: [0],
        deltas: {
          0: delta0
        }
      })
      setBlockInstanceNumber(1)
      store.appendBlock(newTextBlock())
      expect(store['state'].blockOrders).toEqual([0, 1])
      expect(store['state'].deltas).toEqual({
        0: delta0,
        1: delta1
      })
      expect(store['state'].selectedBlockInstanceNumber).toEqual(1)
    })
  })
  describe('deleteblock', () => {
    it('should only delete one block', () => {
      const store = new Store()
      const delta0 = new DocumentDelta()
      const delta1 = new DocumentDelta()
      setBlockInstanceNumber(2)
      store['updateState']({
        selectedBlockInstanceNumber: 1,
        blockOrders: [0, 1],
        deltas: {
          0: delta0,
          1: delta1
        }
      })
      store.deleteBlock(1)
      expect(store['state'].blockOrders).toEqual([0])
      expect(store['state'].deltas).toEqual({
        0: delta0
      })
    })
    it('should update selectedBlockInstanceNumber', () => {
      const store = new Store()
      const delta0 = new DocumentDelta()
      const delta1 = new DocumentDelta()
      store['updateState']({
        selectedBlockInstanceNumber: 1,
        blockOrders: [0, 1],
        deltas: {
          0: delta0,
          1: delta1
        }
      })
      store.deleteBlock(1)
      expect(store['state'].selectedBlockInstanceNumber).toEqual(0)
    })
  })
})
