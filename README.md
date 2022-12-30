# isolates
Serveless the hard way with v8 isolates

## What is this?

An isolate is an independent copy of the V8 runtime, and it includes a heap manager, a garbage collector. Only one thread may access a given isolate at a time, but different threads may access different isolates simultaneously.

An isolate is not sufficient for running scripts, however. You also need a global (root) object. A context defines a complete script execution environment by designating an object in an isolate's heap as a global object.