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

Usage
--------
Every UndoManager keeps it's own undo and redo stacks. You can use multiple instances to have separate undo contexts.

###Registering undo actions###
Registering undo actions is done using `registerUndoAction(target, func, arg, data)`. When the action is undone, the function `func` will be called with the array `arg` as arguments and `target` as `this`.
When an action is registered while undoing, it is added to the redo stack. This way, the redo stack is automatically populated.

````js
var value = 0;

var manager = new UndoManager();

function changeSomething(newValue) {
  //Push the old value to the undo stack.
  manager.registerUndoAction(this, changeSomething, [value]);
  
  value = newValue;
}
````

###Performing undo and redo###
````js
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
````js
manager.beginGrouping();
//Make changes here
manager.endGrouping();
````

###Coalescing actions###
Sometimes you want to make a lot of changes but really only need to save the first or last change. For example when a lot of mouse events are fired, which all update a model property.
Groups can automatically coalesce these actions for you. This is done by setting the coalesce mode when beginning a group.
UndoManager supports 4 coalesce modes. When you don't explicitly pass a coalesce mode, the default mode _NONE_ will be used.

````js
manager.beginGrouping(UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES);
//Make changes here
manager.endGrouping();
````

####UndoManager.COALESCE_MODE.NONE####
No coalescing. All actions will be recorded and undone / redone. (AAABBB > AAABBB)

####UndoManager.COALESCE_MODE.FIRST####
Only record the first registed action. (AAABBB > A)

####UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES####
Only record action if it's not the same function as the previous recorded action. (AAABBB > AB)

####UndoManager.COALESCE_MODE.DUPLICATES####
Only record action if it's not a duplicate of any previous recorded action. (ABABAB > AB);


###Events###
UndoManager dispatches several events to keep you posted of changes in the undo context.

####onundo####
Dispatched when an action is undone.

####onredo####
Dispatched when an action is redo.

####onchange####
Dispatched when a change is the undo/redo stack occurred.
