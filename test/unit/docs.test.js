'use strict'

const fs = require('fs')
const path = require('path')
const {expect} = require('chai')
const {google} = require('googleapis')

const {multisectionHTML} = require('../fixtures/multisectionHTML')

// Google drive response stubbing spagetti
google.auth.getApplicationDefault = () => {
  return {credential: {JWT: {}}}
}
google.options = () => {}
google.drive = () => {
  return {
    files: {
      'export': (opts) => {
        if (opts.mimeType.includes('spreadsheetml')) {
          return {
            data: fs.readFileSync(path.join(__dirname, '../fixtures/sheet-buffer'))
          }
        }
        if (opts.fileId === 'mulitsection') {
          return {data: multisectionHTML}
        }
        return {data: `<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"></head><body style="background-color:#ffffff;padding:72pt 72pt 72pt 72pt;max-width:468pt"><p style="padding:0;margin:0;color:#000000;font-size:11pt;font-family:&quot;Arial&quot;;line-height:1.15;orphans:2;widows:2;text-align:left"><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:&quot;Arial&quot;;font-style:normal">This is a simple test document export.</span></p></body></html>`}
      },
      'get': () => {
        return {data: '<h1>This is a raw HTML document</h1>'}
      }
    },
    revisions: {
      get: () => {
        return Promise.resolve({ data: {
          kind: 'drive#revision',
          mimeType: 'application/vnd.google-apps.document',
          modifiedTime: '2017-01-01T19:55:07.353Z',
          published: false,
          lastModifyingUser: {
            kind: 'drive#user',
            displayName: 'John Smith',
            photoLink: 'https://foo.com/photo.jpg',
            me: false
          }
        }})
      }
    }
  }
}

const docs = require('../../server/docs')

describe('Docs', () => {
  describe('Name Cleaner', () => {
    it('should remove leading numbers and delimeters', () => {
      expect(docs.cleanName('0000123abc12345')).equals('abc12345')
      expect(docs.cleanName('   abc     ')).equals('abc')
      expect(docs.cleanName('123-abc')).equals('abc') // hyphen
      expect(docs.cleanName('123–abc')).equals('abc') // en dash
      expect(docs.cleanName('123—abc')).equals('abc') // em dash
    })

    it('should remove trailing delimeters', () => {
      expect(docs.cleanName('foo | thing')).equals('foo')
      expect(docs.cleanName('one   |      two')).equals('one')
      expect(docs.cleanName('one | two | three')).equals('one | two')
    })

    it('should remove trailing delimeters', () => {
      expect(docs.cleanName('foo | thing')).equals('foo')
      expect(docs.cleanName('one   |      two')).equals('one')
      expect(docs.cleanName('one | two | three')).equals('one | two')
    })

    it('should remove file extensions', () => {
      expect(docs.cleanName('foo.html')).equals('foo')
      expect(docs.cleanName('foo.txt')).equals('foo')
      expect(docs.cleanName('nytimes.com.txt')).equals('nytimes.com')
    })
  })

  describe('Slugification', () => {
    it('should slugify simple phrases', () => {
      expect(docs.slugify('this is a slug')).equals('this-is-a-slug')
      expect(docs.slugify('this-is a slug')).equals('this-is-a-slug')
      expect(docs.slugify('2018 this is a slug')).equals('2018-this-is-a-slug')
    })

    it('should strip spacing', () => {
      expect(docs.slugify('  slugify-  me please ')).equals('slugify-me-please')
    })
  })

  describe('Fetching Byline', () => {
    it('should return reglar byline if none in HTML', () => {
      const {byline} = docs.fetchByline('<p></p>', 'Ben Koski')
      expect(byline).equals('Ben Koski')
    })

    it('should return a byline if present in HTML', () => {
      const {byline} = docs.fetchByline('<p>By John Smith</p>', 'Ben Koski')
      expect(byline).equals('John Smith')
    })

    it('should not return a byline not a real byline', () => {
      const {byline} = docs.fetchByline('<p>I am standing by Port Authority</p>', 'Ben Koski')
      expect(byline).to.not.equals('Port Authority')
      expect(byline).equals('Ben Koski')
    })
  })

  describe('Fetching Docs', () => {
    it('should successully fetch a document data', async () => {
      const doc = await docs.fetchDoc('id1', 'document', {})
      expect(doc).to.include.keys('html', 'originalRevision')
    })

    it('should get correct revision data', async () => {
      const {originalRevision} = await docs.fetchDoc('id1', 'document', {})
      expect(originalRevision.data).to.have.keys('kind', 'mimeType', 'modifiedTime', 'published', 'lastModifyingUser')
    })

    it('should have correct mimetype for document', async () => {
      const {originalRevision} = await docs.fetchDoc('id1', 'document', {})
      const {mimeType} = originalRevision.data
      expect(mimeType).equals('application/vnd.google-apps.document')
    })

    it('should parse sections correctly', async () => {
      const doc = await docs.fetchDoc('mulitsection', 'document', {})
      expect(doc).to.include.keys('html', 'sections')
      const {sections} = doc
      expect(sections.length).equals(2)
      expect(sections[0].subsections.length).equals(3)
    })
  })

  describe('Fetching Sheets', () => {
    it('should successully fetch a document data', async () => {
      const doc = await docs.fetchDoc('id1', 'document', {})
      expect(doc).to.include.keys('html', 'originalRevision')
    })

    it('should get correct revision data', async () => {
      const {originalRevision} = await docs.fetchDoc('id1', 'document', {})
      expect(originalRevision.data).to.have.keys('kind', 'mimeType', 'modifiedTime', 'published', 'lastModifyingUser')
    })

    it('should have correct mimetype for document', async () => {
      const {originalRevision} = await docs.fetchDoc('id1', 'document', {})
      const {mimeType} = originalRevision.data
      expect(mimeType).equals('application/vnd.google-apps.document')
    })
  })

  describe('Fetching Sheets', () => {
    it('should successully fetch sheet data', async () => {
      const sheet = await docs.fetchDoc('id1', 'spreadsheet', {})
      expect(sheet).to.include.keys('html', 'originalRevision')
    })

    it('should successully parse the sheet to a html table', async () => {
      const {html} = await docs.fetchDoc('id1', 'spreadsheet', {})
      expect(html).includes('<table>')
      expect(html).includes('</table>')
    })
  })

  describe('Fetching html', () => {
    it('should successully fetch html', async () => {
      const sheet = await docs.fetchDoc('id1', 'text/html', {})
      expect(sheet).to.include.keys('html', 'originalRevision')
    })

    it('should not modify html', async () => {
      const {html} = await docs.fetchDoc('id1', 'text/html', {})
      expect(html).equals('<h1>This is a raw HTML document</h1>')
    })
  })

  it('should identify bad resource types', async () => {
    const {html} = await docs.fetchDoc('id1', 'badtype', {})
    expect(html).equals('Library does not support viewing badtypes yet.')
  })
})
