/**
 * UMD
 */
(function (root, factory) {
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else {
		// Browser globals (root is window)
		root.UndoManager = factory();
  }
}(this, function () {
	"use strict";


	/**
	 * --------------
	 * UndoAction
	 * --------------
	 */
	function UndoAction(target, func, arg, data) {
		this.target = target;
		this.func = func;
		this.arg = arg;
		this.data = data;
		this.parentGroup = null;
		this.onperform = null;
	}

	UndoAction.prototype.perform = function() {
		this.func.apply(this.target, this.arg);
		if(typeof this.onperform === "function") {
			this.onperform(this);
		}
	};

	/**
	 * --------------
	 * ActionGroup
	 * --------------
	 */
	function ActionGroup(mode) {
		this.actions = [];
		this.mode = (mode || UndoManager.COALESCE_MODE.NONE);
		this.parentGroup = null;
	}

	ActionGroup.prototype.addAction = function(action) {
		action.parentGroup = this;

		switch(this.mode) {
			case UndoManager.COALESCE_MODE.FIRST:
				if(this.actions.length === 0) {
					this.actions.push(action);
				}
				break;

			case UndoManager.COALESCE_MODE.LAST:
				this.actions[0] = action;
				break;

			case UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES:
				if(this.actions.length === 0 || action.func !== this.actions[this.actions.length-1].func) {
					this.actions.push(action);
				}
				break;

			case UndoManager.COALESCE_MODE.DUPLICATES:
				for (var i = this.actions.length - 1; i >= 0; i--) {
					if(this.actions[i].func === action.func) {
						this.actions.push(action);
						break;
					}
				}
				break;
			default:
				this.actions.push(action);
		}
	};

	ActionGroup.prototype.addGroup = function(actionGroup) {
		actionGroup.parentGroup = this;
		this.actions.push(actionGroup);
	};

	ActionGroup.prototype.perform = function() {
		for (var i = this.actions.length - 1; i >= 0; i--) {
			this.actions[i].perform();
		}
	};


	/**
	 * --------------
	 * UndoManager
	 * --------------
	 * Every UndoManager keeps has it's own undo and redo stacks.
	 * You can use multiple instances to have separate undo contexts.
	 */
	function UndoManager() {
		this.STATE_COLLECTING_ACTIONS = "collectingActions";
		this.STATE_UNDOING = "undoing";
		this.STATE_REDOING = "redoing";


		this.undoStack = [];
		this.redoStack = [];
		this._state = this.STATE_COLLECTING_ACTIONS;
		
		this._openGroupRef = null;
		this._groupLevel = 0;
		this._maxUndoLevels = null;

		/**
		 * Dispatched when an action is undone.
		 * This callback is passed 1 argument containing the following values:
		 * - Data: The data passed when the action was registered.
		 * - Manager: The UndoManager that performed the action.
		 * 
		 * @type Function
		 */
		this.onundo = null;
		
		/**
		 * Dispatched when an action is redone.
		 * This callback is passed 1 argument containing the following values:
		 * - Data: The data passed when the action was registered.
		 * - Manager: The UndoManager that performed the action.
		 * 
		 * @type Function
		 */
		this.onredo = null;

		/**
		 * Called when something changes in the undo or redo stack.
		 * For example: when a new action is registered or when undo/redo is called.
		 * This callback is passed 1 argument containing the following values:
		 * - Manager: The UndoManager that performed the action.
		 * 
		 * @type Function
		 */
		this.onchange = null;


		/**
		 * Set the maximum levels of undo that the manager will keep track of.
		 * When a new registered action causes the stack to grow bigger than
		 * the max level, the oldest undo action will be discarded.
		 * Set to 'null' to have unlimited levels.
		 *
		 * @type int|null
		 */
		this.setMaxUndoLevels = function(levels) {
			this._maxUndoLevels = levels;

			if(levels !== null) {
				while(this.undoStack.length > this._maxUndoLevels) {
					this.undoStack.shift();
				}
			}
		};

		this.getMaxUndoLevels = function() {
			return this._maxUndoLevels;
		};

		/**
		 * Returns true when there are actions that can be undone.
		 * @return boolean
		 */
		this.canUndo = function() {
			return (this.undoStack.length > 0 && this._state === this.STATE_COLLECTING_ACTIONS);
		};

		/**
		 * Returns true when there are actions that can be redone.
		 * @return boolean
		 */
		this.canRedo = function() {
			return (this.redoStack.length > 0 && this._state === this.STATE_COLLECTING_ACTIONS);
		};

		/**
		 * Returns the amount of undo actions that can be undone.
		 * @return int
		 */
		this.getUndoActionsCount = function() {
			return this.undoStack.length;
		};

		/**
		 * Returns the amount of redo actions that can be redone.
		 * @return int
		 */
		this.getRedoActionsCount = function() {
			return this.redoStack.length;
		};

		/**
		 * Undoes the first item or group on the undo stack.
		 * Throws an Error when there are no actions that can be undone.
		 */
		this.undo = function() {
			if(!this.canUndo()) throw new Error("Cannot undo, no undo actions on the stack or undo/redo operation in progress.");

			this.endGrouping();

			this._state = this.STATE_UNDOING;

			this.beginGrouping();
			this.undoStack.pop().perform();
			this.endGrouping();

			this._state = this.STATE_COLLECTING_ACTIONS;

			this._dispatch(this.onchange, {manager: this});
		};


		/**
		 * Redoes the first item or group on the redo stack.
		 * Throws an Error when there are no actions that can be redone.
		 */
		this.redo = function() {
			if(!this.canRedo()) throw new Error("Cannot redo, no redo actions on the stack or undo/redo operation in progress.");

			this._state = this.STATE_REDOING;
			
			this.beginGrouping();
			this.redoStack.pop().perform();
			this.endGrouping();

			this._state = this.STATE_COLLECTING_ACTIONS;

			this._dispatch(this.onchange, {manager: this});
		};

		/**
		 * Register an undo action.
		 * @param  object	target The object to pass as 'this' in the function.
		 * @param  function func   The function to call when undoing.
		 * @param  array	arg    Array of arguments to pass to the function.
		 * @param  object	data   An object containing custom data.
		 */
		this.registerUndoAction = function(target, func, arg, data) {
			if(typeof func !== 'function') {
				throw new TypeError('Expected func to be of type function. ' + typeof(func) + ' given.');
			}

			var action = new UndoAction(target, func, arg, data);
			action.onperform = this._onActionPerform.bind(this); //Callback

			if(this._groupLevel !== 0) {
				this._openGroupRef.addAction(action);

				//console.log("---- Added undo action to group: " + arg[0]);
			} else {
				if(this._state === this.STATE_UNDOING) {
					this.redoStack.push(this._wrappedAction(action));
					//console.log("---- Added undo action to redo stack: " + arg[0]);
				} else {
					this.undoStack.push(this._wrappedAction(action));

					if(this._maxUndoLevels !== null && this.undoStack.length > this._maxUndoLevels) {
						this.undoStack.shift();
					}
					
					//console.log("---- Added undo action to undo stack: " + arg[0]);
				}
			}

			if(this._state === this.STATE_COLLECTING_ACTIONS) {
				this.clearRedo();
			}

			this._dispatch(this.onchange, {manager: this});
		};

		/**
		 * Register an undo function.
		 * @param  function func   The function to call when undoing.
		 */
		this.registerUndoFunction = function(func, data) {
			this.registerUndoAction(null, func, null, data);
		};


		/**
		 * Start an undo group.
		 * @param string mode   The mode to use for coalescing the actions in the group.
		 */
		this.beginGrouping = function(mode) {
			var newGroup = new ActionGroup(mode);

			if(this._groupLevel === 0) {
				if(this._state === this.STATE_UNDOING) {
					this.redoStack.push(newGroup);
					//console.log("---- Added group to redo stack: " + mode);
				} else {
					this.undoStack.push(newGroup);
					//console.log("---- Added group to undo stack: " + mode);
				}

			} else {
				this._openGroupRef.addGroup(newGroup);
				//console.log("---- Added group to group: " + mode);
			}

			this._openGroupRef = newGroup;

			this._groupLevel++;
		};

		/**
		 * End an undo group.
		 * This will throw an Error when there are no open groups to end.
		 */
		this.endGrouping = function() {
			if(this._groupLevel > 0) {
				this._groupLevel--;

				if(this._groupLevel === 0) {
					this._openGroupRef = null;
				} else {
					this._openGroupRef = this._openGroupRef.parentGroup;
				}
			}
		};

		/**
		 * Clears the redo stack.
		 */
		this.clearRedo = function() {
			this.redoStack = [];
			this._dispatch(this.onchange);
		};

		/**
		 * Clears the undo stack.
		 */
		this.clearUndo = function() {
			this.undoStack = [];
			this._dispatch(this.onchange);
		};


		//Private

		/**
		 * Wraps a single UndoAction in an ActionGroup.
		 *
		 * @param  UndoAction action The action to wrap.
		 * @return ActionGroup       The group containing the item.
		 */
		this._wrappedAction = function(action) {
			var group = new ActionGroup();
			group.addAction(action);
			return group;
		};

		this._dispatch = function(callback, arg){
			if(typeof callback === "function") callback(arg);
		};

		this._onActionPerform = function(action) {
			//Pass through
			var callbackData = {data: action.data, manager: this};

			var callback = (this._state === this.STATE_UNDOING) ? this.onundo : this.onredo;
			this._dispatch(callback, callbackData);
		};
	}

	/**
	 * Coalesce modes
	 */
	UndoManager.COALESCE_MODE = {
		/**
		 * No coalescing
		 * AAABBB > AAABBB
		 */
		NONE: "none",

		/**
		 * Only record the first registed action
		 * AAABBB > A
		 */
		FIRST: "first",

		/**
		 * Only record the last registered action
		 * AAABBB > B
		 */
		LAST: "last",

		/**
		 * Only record action if it's not the same function as the previous recorded action
		 * AAABBB > AB
		 */
		CONSECUTIVE_DUPLICATES: "concecutiveDuplicates",
		
		/**
		 * Only record action if it's not a duplicate of any previous recorded action
		 * ABABAB > AB
		 */
		DUPLICATES: "duplicates"
	};

	return UndoManager;


}));