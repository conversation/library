'use strict'

const {expect} = require('chai')

const {fetchDoc} = require('../../server/docs')

const PAYLOAD_KEYS = ['html', 'byline', 'createdBy', 'sections']

describe('Docs', () => {
  describe('Fetching Docs', () => {
    it('should fetch document data with expected structure', async () => {
      const doc = await fetchDoc('id-doc', 'document', {})
      expect(doc).to.include.keys('html', 'byline', 'createdBy', 'sections')
    })

    it('should parse sections correctly', async () => {
      const doc = await fetchDoc('mulitsection', 'document', {})
      expect(doc).to.include.keys('html', 'sections')
      const {sections} = doc
      expect(sections.length).equals(2)
      expect(sections[0].subsections.length).equals(3)
    })
  })

  describe('Fetching Sheets', () => {
    it('does not support viewing spreadsheets', async () => {
      const {html} = await fetchDoc('id-sheet', 'spreadsheet', {})
      expect(html).includes('Library does not support viewing spreadsheets yet.')
    })
  })

  describe('Fetching html', () => {
    it('should fetch html data with expected structure', async () => {
      const sheet = await fetchDoc('id-html', 'text/html', {})
      expect(sheet).to.include.keys(PAYLOAD_KEYS)
    })

    it('should not modify html', async () => {
      const {html} = await fetchDoc('id-html', 'text/html', {})
      expect(html).equals('<h1>This is a raw HTML document</h1>')
    })
  })

  it('should identify bad resource types', async () => {
    const {html} = await fetchDoc('id-html', 'badtype', {})
    expect(html).equals('Library does not support viewing badtypes yet.')
  })
})
