# Prop Trail

Prop Trail is a small but powerful VSCode extension that allows developers to see all references for props that are passed into React Components.

## Features

* Right click on the desired prop, click on the 'PROP TRAIL' menu option, and click on the Navigation Icon in the Activity Bar to see all the prop's references in the React component.s

![Demo](./demo.gif)

## Known Issues

Currently, this extension only goes into a component at a time. So it doesn't track the path of a prop that has been passed down into multiple components. 

## Release Notes

### 1.0.0

Initial release of prop-trials.

### 1.0.1

* Change the display name from `prop-trail` to `Prop Trail`.

### 1.0.3

* Update information in README.
* Refactor codebase to remove `v1` directory.
* Address source mapping issues.
