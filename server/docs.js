'use strict'

const {google} = require('googleapis')

const cache = require('./cache')
const formatter = require('./formatter')
const log = require('./logger')
const {getAuth} = require('./auth')

const supportedTypes = new Set(['document', 'text/html'])

const revisionSupportedArr = ['document', 'presentation']
const revisionSupported = new Set(revisionSupportedArr)
const revisionMimeSupported = new Set(revisionSupportedArr.map((x) => `application/vnd.google-apps.${x}`))

exports.fetchDoc = async (id, resourceType, req) => {
  const data = await cache.get(id)
  if (data && data.content) {
    log.info(`CACHE HIT ${req.path}`)
    return data.content
  }

  const auth = await getAuth()

  const driveDoc = await fetch({id, resourceType, req}, auth)
  const originalRevision = driveDoc[1]

  const {html, byline, createdBy, sections} = formatter.getProcessedDocAttributes(driveDoc)
  const payload = {html, byline, createdBy, sections}

  // cache only information from document body if mimetype supports revision data
  if (revisionMimeSupported.has(originalRevision.data.mimeType)) {
    cache.add(id, originalRevision.data.modifiedTime, payload)
  } else {
    console.log(`Skipping cache add: unsupported mimetype ${originalRevision.data.mimeType}`)
  }
  return payload
}

async function fetchHTMLForId(id, resourceType, req, drive) {
  if (!supportedTypes.has(resourceType)) {
    return `Library does not support viewing ${resourceType}s yet.`
  }

  if (resourceType === 'text/html') {
    return fetchHTML(drive, id)
  }

  const {data} = await drive.files.export({
    fileId: id,
    // text/html exports are not suupported for slideshows
    mimeType: resourceType === 'presentation' ? 'text/plain' : 'text/html'
  })
  return data
}

async function fetchOriginalRevisions(id, resourceType, req, drive) {
  if (!revisionSupported.has(resourceType)) {
    log.info(`Revision data not supported for ${resourceType}:${id}`)
    return {data: {lastModifyingUser: {}}} // return mock/empty revision object
  }
  return drive.revisions.get({
    fileId: id,
    revisionId: '1',
    fields: '*'
  }).catch((err) => {
    log.warn(`Failed retrieving revision data for ${resourceType}:${id}. Error was:`, err)
    return {data: {lastModifyingUser: {}}} // return mock/empty revision object
  })
}

async function fetch({id, resourceType, req}, authClient) {
  const drive = google.drive({version: 'v3', auth: authClient})
  const documentData = await Promise.all([
    fetchHTMLForId(id, resourceType, req, drive),
    fetchOriginalRevisions(id, resourceType, req, drive)
  ])
  return documentData
}

// returns raw html from the drive
async function fetchHTML(drive, id) {
  const {data} = await drive.files.get({
    fileId: id,
    supportsTeamDrives: true,
    alt: 'media'
  })
  return data
}
