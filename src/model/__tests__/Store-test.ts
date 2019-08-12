/* eslint-disable @typescript-eslint/no-unused-vars */
// tslint:disable:no-string-literal
// tslint:disable:no-unused-variable
import { Store } from '@model/Store'
import { TextBlock } from '@model/TextBlock'
import { Bridge } from '@core/Bridge'
import { Orchestrator } from '@model/Orchestrator'
import { setInstanceNumber as setBlockInstanceNumber } from '@model/Block'

function newTextBlock(): TextBlock {
  const block = new TextBlock({
    sheetEventDom: new Bridge().getSheetEventDomain(),
    onPressBackspaceFromOrigin: () => {
      /** */
    },
    onPressEnter: () => {
      /** */
    },
    orchestrator: new Orchestrator(),
  })
  return block
}

describe('@model/Store', () => {
  describe('instantiation', () => {
    it('should not crash', () => {
      expect(() => {
        const store = new Store()
      }).not.toThrow()
    })
  })
  describe('insertBlock', () => {
    it('should append block', () => {
      const store = new Store()
      store['updateState']({
        selectedBlockInstanceNumber: 0,
        blockOrders: [0],
      })
      setBlockInstanceNumber(1)
      store.appendBlock(newTextBlock())
      expect(store['state'].blockOrders).toEqual([0, 1])
      expect(store['state'].selectedBlockInstanceNumber).toEqual(1)
    })
  })
  describe('deleteblock', () => {
    it('should only delete one block', () => {
      const store = new Store()
      setBlockInstanceNumber(2)
      store['updateState']({
        selectedBlockInstanceNumber: 1,
        blockOrders: [0, 1],
      })
      store.deleteBlock(1)
      expect(store['state'].blockOrders).toEqual([0])
    })
    it('should update selectedBlockInstanceNumber', () => {
      const store = new Store()
      store['updateState']({
        selectedBlockInstanceNumber: 1,
        blockOrders: [0, 1],
      })
      store.deleteBlock(1)
      expect(store['state'].selectedBlockInstanceNumber).toEqual(0)
    })
  })
})
