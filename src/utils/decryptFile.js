import encrypt from 'browser-encrypt-attachment';
import 'isomorphic-fetch';

const ALLOWED_BLOB_MIMETYPES = {
  'image/jpeg': true,
  'image/gif': true,
  'image/png': true,

  'video/mp4': true,
  'video/webm': true,
  'video/ogg': true,

  'audio/mp4': true,
  'audio/webm': true,
  'audio/aac': true,
  'audio/mpeg': true,
  'audio/ogg': true,
  'audio/wave': true,
  'audio/wav': true,
  'audio/x-wav': true,
  'audio/x-pn-wav': true,
  'audio/flac': true,
  'audio/x-flac': true,
};

const decryptFile = (file, client) => {
  const url = client.mxcUrlToHttp(file.url);
  // Download the encrypted file as an array buffer.
  return Promise.resolve(fetch(url))
    .then((response) => response.arrayBuffer())
    .then((responseData) => encrypt.decryptAttachment(responseData, file))
    .then((dataArray) => {
      // IMPORTANT: we must not allow scriptable mime-types into Blobs otherwise
      // they introduce XSS attacks if the Blob URI is viewed directly in the
      // browser (e.g. by copying the URI into a new tab or window.)
      let mimetype = file.mimetype ? file.mimetype.split(';')[0].trim() : '';
      if (!ALLOWED_BLOB_MIMETYPES[mimetype]) {
        mimetype = 'application/octet-stream';
      }

      const blob = new Blob([dataArray], { type: mimetype });
      return blob;
    });
};

export default decryptFile;
