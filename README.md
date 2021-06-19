# Electron app example: Notes manager

This is a notes manger built with [Electron](https://www.electronjs.org/) and [Quill](https://quilljs.com/).

 -  Supports rich text.
 - It stores your notes in your user folder, inside a folder named `.notesmngr` as JSON files using the [Delta](https://quilljs.com/docs/delta/) format.
 -  You can easily move between notes without worring about the files.
 -  The notes are automatically saved, so you don't have to worry about saving them.

## Building

To build the project, use the following command:

```
npm run build
```

The result will be placed in the `out` folder

If you want to tun the app in debug mode type:

```
npm start
```
