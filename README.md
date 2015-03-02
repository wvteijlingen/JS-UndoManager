JS-UndoManager
==============

JS-UndoManager is a simple Javascript undo manager that supports grouping and coalescing consecutive actions. It is based on Apple's NSUndoManager found in Cocoa.

Features
--------
- Simple registering of undo functions.
- Grouping actions and undoing and redoing them as one.
- Automatic coalescing of consecutive actions.
- Limiting the maximum stored undo actions.
- Events.

Installation
--------
JS-UndoManager embraces UMD by offering a brower global, AMD module and a Common JS like environment like Node.
For browser globals, adding a `<script>` tag to the HTML document is enough. For AMD, you can use something like Require JS.

Usage
--------
Every UndoManager keeps it's own undo and redo stacks. You can use multiple instances to have separate undo contexts.

###Registering undo actions###
Registering undo actions is done using `registerUndoAction(target, func, arg, data)`.
When the action is undone, the function `func` will be called with the array `arg` as arguments and `target` as `this`.
The `data` argument is optional and purely for the programmer, it will be passed back in the callbacks. You can use it to identify which action is undone/redone.
When an action is registered while undoing, it is added to the redo stack. This way, the redo stack is automatically populated. Registering an action while not undoing or redoing will clear the redo stack to ensure integrity and avoid invalid states.

````javascript
var value = 0;

var manager = new UndoManager();

function changeSomething(newValue) {
  var userData = {kind: "valueChange"};

  //Push the old value to the undo stack.
  manager.registerUndoAction(this, changeSomething, [value], userData);
  value = newValue;
}
````

You can also register an anonymous function as an undo action:

````javascript
var userData = {kind: "something"};
manager.registerUndoFunction(function() {
  //Do something
}, userData);
````


###Performing undo and redo###
````javascript
manager.undo();
manager.redo();
````

###Checking undo and redo ability###
You can check wheter undoing and redoing is possible with `canUndo()` and `canRedo()`.

###Limiting the undo stack###
You can set the maximum amount of saved actions by using the `setMaxUndoLevels()` property.
When a new registered action causes the stack to grow bigger than the max level, the oldest undo action will be discarded.
Set to 'null' to have unlimited levels.

###Grouping undo actions###

Undo actions can be grouped. Grouped actions will be undone and redone as one.
Opening and closing group is done as follows. Multiple groups can be nested within each other. Just make sure to balance begin and end calls.
````javascript
manager.beginGrouping();
//Make changes here
manager.endGrouping();
````

###Coalescing actions###
Sometimes you want to make a lot of changes but really only need to save the first or last change. For example when a lot of mouse events are fired, which all update a model property.
Groups can automatically coalesce these actions for you. This is done by setting the coalesce mode when beginning a group.
UndoManager supports several coalesce modes. When you don't explicitly pass a coalesce mode, the default mode _NONE_ will be used.

````javascript
manager.beginGrouping(UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES);
//Make changes here
manager.endGrouping();
````

#####UndoManager.COALESCE_MODE.NONE#####
No coalescing. All actions will be recorded and undone / redone. (**AAABBB** > AAABBB)

#####UndoManager.COALESCE_MODE.FIRST#####
Only record the first registed action. (**A**AABBB > A)

#####UndoManager.COALESCE_MODE.LAST#####
Only record the last registered action. (AAABB**B** > B)

#####UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES#####
Only record action if it's not the same function as the previous recorded action. (**A**AA**B**BB > AB)

#####UndoManager.COALESCE_MODE.DUPLICATES#####
Only record action if it's not a duplicate of any previous recorded action. (**AB**ABAB > AB);


###Altering the undo and redo stacks###
You can manually empty the undo and redo stacks by using `clearUndo()` and `clearRedo()`.


###Events###
UndoManager dispatches several events to keep you posted of changes in the undo context.

#####onundo#####
Dispatched when an action is undone. This is fired for each action if entire groups are undone/redone.
This callback is passed 1 argument containing the following values:
- Data: The data passed when the action was registered.
- Manager: The UndoManager that performed the action.

#####onredo#####
Dispatched when an action is redone. This is fired for each action if entire groups are undone/redone.
This callback is passed 1 argument containing the following values:
- Data: The data passed when the action was registered.
- Manager: The UndoManager that performed the action.

#####onchange#####
Dispatched when a change in the undo/redo stack occurred. For example: when a new action is registered or when undo/redo is called.
This callback is passed 1 argument containing the following values:
- Manager: The UndoManager that performed the action.

TODO
--------
- Write tests

License
--------
The MIT License (MIT)

Copyright (c) 2014 Ward van Teijlingen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
