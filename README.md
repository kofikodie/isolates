# isolates
Serveless the hard way with v8 isolates

## What is this?

This is a proof of concept of how to use v8 isolates to run code in a sandboxed environment.

### What is a v8 isolate?
An Isolate is an independant copy of the V8 runtime which includes its own heap. Two different Isolates can run in parallel and can be seen as entirely different sandboxed instances of a V8 runtime.


